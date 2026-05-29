import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  AccountStatus,
  Order,
  OrderStatus,
  PartnerStatus,
  Prisma,
  RequestStatus,
  WorkStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';
import {
  isServicePartnerProfile,
  isOrderAllowedForPartnerType,
  orderCategoriesForPartnerType,
} from '../common/partner-access.util';
import { orderMatchesActiveOffering } from '../common/partner-offerings.util';

type MatchableOrder = Pick<
  Order,
  'status' | 'assignedPartnerId' | 'category' | 'serviceId' | 'city' | 'regionId'
>;

export interface SpecialistContext {
  userId: string;
  profile: Awaited<ReturnType<PartnersService['ensurePartnerProfile']>>;
  activeSubserviceIds: Set<string>;
  accountActive: boolean;
  requestApproved: boolean;
}

function normCity(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

/**
 * Единый источник правды по видимости и приёму заказов специалистом.
 * Все проверки — на бэкенде; фронтенд не управляет matching/visibility.
 * Архитектура расширяема: distance radius / ranking / priority добавляются здесь.
 */
@Injectable()
export class SpecialistEligibilityService {
  constructor(
    private prisma: PrismaService,
    private partners: PartnersService,
  ) {}

  async loadContext(userId: string): Promise<SpecialistContext> {
    const [user, profile] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { accountStatus: true } }),
      this.partners.ensurePartnerProfile(userId),
    ]);
    const activeSubserviceIds = await this.partners.getActiveSubserviceIdsForPartnerProfile(profile.id);
    return {
      userId,
      profile,
      activeSubserviceIds,
      accountActive: user?.accountStatus === AccountStatus.ACTIVE,
      requestApproved: profile.requestStatus === RequestStatus.APPROVED,
    };
  }

  /** Может ли специалист в принципе видеть/принимать заказы (без учёта online). */
  assertEligibleToBrowse(ctx: SpecialistContext): void {
    if (!ctx.accountActive) {
      throw new ForbiddenException('Аккаунт неактивен');
    }
    if (ctx.profile.status !== PartnerStatus.APPROVED) {
      throw new ForbiddenException('Профиль специалиста не одобрен');
    }
    if (!ctx.requestApproved) {
      throw new ForbiddenException('Заявка специалиста не одобрена');
    }
    if (!isServicePartnerProfile(ctx.profile)) {
      throw new ForbiddenException('Заказы услуг недоступны для этого профиля');
    }
  }

  /** ONLINE — единственное состояние, в котором приходят/принимаются заказы. */
  isOnline(ctx: SpecialistContext): boolean {
    return ctx.profile.workStatus === WorkStatus.ONLINE;
  }

  assertOnline(ctx: SpecialistContext): void {
    if (!this.isOnline(ctx)) {
      throw new ForbiddenException('Перейдите в статус ОНЛАЙН, чтобы принимать заказы');
    }
  }

  /** Полная проверка соответствия заказа специалисту. */
  orderMatches(ctx: SpecialistContext, order: MatchableOrder): boolean {
    if (order.status !== OrderStatus.NEW) return false;
    if (order.assignedPartnerId && order.assignedPartnerId !== ctx.profile.id) return false;
    if (!isOrderAllowedForPartnerType(order, ctx.profile.partnerType)) return false;
    if (!orderMatchesActiveOffering(order, ctx.activeSubserviceIds)) return false;
    if (!this.cityMatches(order.city, ctx.profile.city)) return false;
    if (!this.regionMatches(order.regionId, ctx.profile.regionId)) return false;
    return true;
  }

  private cityMatches(orderCity: string | null, partnerCity: string | null): boolean {
    if (!orderCity) return true; // нет города в заказе — не блокируем (legacy/неизвестно)
    return normCity(orderCity) === normCity(partnerCity);
  }

  private regionMatches(orderRegion: string | null, partnerRegion: string | null): boolean {
    if (!orderRegion || !partnerRegion) return true; // регион не задан — не блокируем
    return orderRegion === partnerRegion;
  }

  /** Грубый Prisma-фильтр для ленты (точная проверка offering/city/region — в JS). */
  feedWhere(ctx: SpecialistContext): Prisma.OrderWhereInput {
    const categories = orderCategoriesForPartnerType(ctx.profile.partnerType) ?? [];
    return {
      status: OrderStatus.NEW,
      OR: [{ assignedPartnerId: null }, { assignedPartnerId: ctx.profile.id }],
      ...(categories.length ? { category: { in: categories } } : {}),
    };
  }

  /**
   * Специалисты, которым подходит заказ (для realtime-рассылки и нотификаций).
   * Только ACTIVE-аккаунт + APPROVED + ONLINE + matching offering/city/region.
   */
  async findMatchingSpecialists(order: MatchableOrder) {
    const partners = await this.prisma.partnerProfile.findMany({
      where: {
        status: PartnerStatus.APPROVED,
        requestStatus: RequestStatus.APPROVED,
        workStatus: WorkStatus.ONLINE,
        user: { accountStatus: AccountStatus.ACTIVE },
      },
      include: {
        user: { select: { id: true } },
        serviceOfferings: {
          where: { status: 'ACTIVE' },
          select: { subserviceId: true },
        },
      },
    });

    return partners
      .filter((p) => {
        if (!isServicePartnerProfile(p)) return false;
        if (!isOrderAllowedForPartnerType(order, p.partnerType)) return false;
        const ids = new Set(p.serviceOfferings.map((o) => o.subserviceId));
        if (!orderMatchesActiveOffering(order, ids)) return false;
        if (!this.cityMatches(order.city, p.city)) return false;
        if (!this.regionMatches(order.regionId, p.regionId)) return false;
        return true;
      })
      .map((p) => ({ partnerProfileId: p.id, userId: p.user.id }));
  }
}
