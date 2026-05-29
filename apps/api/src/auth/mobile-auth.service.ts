import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AccountType,
  OtpChannel,
  PartnerRole,
  PartnerStatus,
  PartnerType,
  PortalRole,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { UserStatusService } from '../user-status/user-status.service';
import { MobileOtpSendDto } from './dto/mobile-otp-send.dto';
import { MobileOtpVerifyDto } from './dto/mobile-otp-verify.dto';
import { MobileRefreshDto } from './dto/mobile-refresh.dto';
import {
  assertAdminOtpLoginAllowed,
  buildNewUserCreateData,
  mergePortalRolesForOtpLogin,
  OtpLoginAs,
  resolveOtpLoginAs,
  resolveOtpSessionRole,
  syncUserRoleFromPortalRoles,
  validateLoginAsProfile,
} from './mobile-auth-login.util';
import {
  generateOtpCode,
  hashOtp,
  hashRefreshToken,
  newFamilyId,
  newRefreshToken,
  normalizePhone,
  phoneToEmail,
} from './mobile-auth.util';
import { OtpDeliveryService } from './otp-delivery.service';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const ACCESS_TTL = process.env.MOBILE_ACCESS_EXPIRES_IN || '15m';
const REFRESH_DAYS = Number(process.env.MOBILE_REFRESH_DAYS || 30);

@Injectable()
export class MobileAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private userStatus: UserStatusService,
    private otpDelivery: OtpDeliveryService,
    private rbac: RbacService,
  ) {}

  private getStoreReviewCredentials(): { phone: string; code: string } | null {
    const raw = process.env.OTP_STORE_REVIEW_PHONE?.trim();
    const rawCode = process.env.OTP_STORE_REVIEW_CODE?.trim();
    if (!raw || !rawCode || rawCode.length !== 6) return null;
    try {
      return { phone: normalizePhone(raw), code: rawCode };
    } catch {
      return null;
    }
  }

  private isOtpVerifyBypass(phone: string, code: string): boolean {
    const trimmed = code.trim();
    const storeReview = this.getStoreReviewCredentials();
    if (storeReview && phone === storeReview.phone && trimmed === storeReview.code) {
      return true;
    }
    const devEnabled =
      String(process.env.OTP_DEV_BYPASS_ENABLED ?? '').toLowerCase() === 'true';
    const devCode = process.env.OTP_DEV_BYPASS_CODE ?? '777777';
    return devEnabled && trimmed === devCode;
  }

  private accessExpiresSec(): number {
    const m = String(ACCESS_TTL).match(/^(\d+)([smhd])$/);
    if (!m) return 900;
    const n = Number(m[1]);
    const u = m[2];
    if (u === 's') return n;
    if (u === 'm') return n * 60;
    if (u === 'h') return n * 3600;
    return n * 86400;
  }

  private async signAccess(
    user: { id: string; email: string; role: Role },
    sessionRole: Role,
  ) {
    const portalRoles = await this.prisma.user
      .findUnique({ where: { id: user.id }, select: { portalRoles: true } })
      .then((u) => u?.portalRoles ?? []);

    return this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: sessionRole,
        roles: portalRoles,
        typ: 'access',
      },
      { expiresIn: ACCESS_TTL },
    );
  }

  private refreshExpiresAt() {
    const d = new Date();
    d.setDate(d.getDate() + REFRESH_DAYS);
    return d;
  }

  private async issueSession(
    userId: string,
    deviceId: string,
    deviceName?: string,
    platform?: string,
    familyId?: string,
  ) {
    const raw = newRefreshToken();
    const tokenHash = hashRefreshToken(raw);
    const fam = familyId || newFamilyId();
    await this.prisma.authRefreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId: fam,
        deviceId,
        deviceName,
        platform,
        expiresAt: this.refreshExpiresAt(),
      },
    });
    return { refreshToken: raw, familyId: fam, expiresAt: this.refreshExpiresAt() };
  }

  private async upsertDevice(
    userId: string,
    dto: {
      deviceId: string;
      deviceName?: string;
      platform?: string;
      rememberDevice?: boolean;
      enableBiometric?: boolean;
    },
  ) {
    const now = new Date();
    await this.prisma.userDevice.upsert({
      where: { userId_deviceId: { userId, deviceId: dto.deviceId } },
      create: {
        userId,
        deviceId: dto.deviceId,
        deviceName: dto.deviceName,
        platform: dto.platform,
        trustedAt: dto.rememberDevice ? now : null,
        lastSeenAt: now,
        biometricEnabled: !!dto.enableBiometric,
      },
      update: {
        deviceName: dto.deviceName,
        platform: dto.platform,
        lastSeenAt: now,
        trustedAt: dto.rememberDevice ? now : undefined,
        biometricEnabled: dto.enableBiometric ?? undefined,
      },
    });
  }

  private async resolveRegion(dto: MobileOtpVerifyDto) {
    let regionId = dto.regionId;
    let city = 'Уральск';
    if (regionId) {
      const region = await this.prisma.region.findUnique({ where: { id: regionId } });
      if (!region?.isActive) throw new BadRequestException('Регион не найден');
      city = region.name;
    } else {
      const defaultRegion = await this.prisma.region.findUnique({ where: { code: 'uralsk' } });
      regionId = defaultRegion?.id;
      city = defaultRegion?.name ?? city;
    }
    return { regionId, city };
  }

  /** Жоқ client/partner профильдерін қосу + portalRoles жаңарту */
  private async ensureMultiRoleProfiles(
    userId: string,
    loginAs: OtpLoginAs,
    dto: MobileOtpVerifyDto,
  ) {
    const { regionId, city } = await this.resolveRegion(dto);
    const accountType = dto.accountType || AccountType.INDIVIDUAL;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { clientProfile: true, partnerProfile: true },
    });
    if (!user) throw new BadRequestException('Пайдаланушы табылмады');

    if (!user.clientProfile) {
      await this.prisma.clientProfile.create({
        data: {
          userId,
          accountType: AccountType.INDIVIDUAL,
          city,
        },
      });
    }

    if (loginAs === 'partner' && !user.partnerProfile) {
      await this.prisma.partnerProfile.create({
        data: {
          userId,
          regionId,
          status: PartnerStatus.DRAFT,
          accountType,
          partnerRole: PartnerRole.SPECIALIST,
          partnerType: PartnerType.OTHER,
          fullName: dto.name?.trim() || user.name || 'Серіктес',
          companyName: dto.name?.trim() || user.name || 'Серіктес',
          company: dto.name?.trim() || user.name || 'Серіктес',
          city,
          directions: [],
          balance: 10000,
        },
      });
    }

    const portalRoles = mergePortalRolesForOtpLogin(user.portalRoles, loginAs);
    if (loginAs === 'admin') {
      assertAdminOtpLoginAllowed(user, portalRoles);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        portalRoles,
        role: syncUserRoleFromPortalRoles(portalRoles),
      },
    });
  }

  async sendOtp(dto: MobileOtpSendDto) {
    let phone: string;
    try {
      phone = normalizePhone(dto.phone);
    } catch {
      throw new BadRequestException('Некорректный номер телефона');
    }

    const recent = await this.prisma.otpChallenge.findFirst({
      where: { phone, createdAt: { gt: new Date(Date.now() - OTP_COOLDOWN_MS) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent && !recent.verified) {
      throw new BadRequestException('Подождите минуту перед повторной отправкой');
    }

    const code = generateOtpCode();
    const challenge = await this.prisma.otpChallenge.create({
      data: {
        phone,
        codeHash: hashOtp(code),
        channel: dto.channel,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    const devPayload = { phone, channel: dto.channel, code, challengeId: challenge.id };
    if (process.env.NODE_ENV !== 'production') {
      console.log('[GP Mobile OTP]', JSON.stringify(devPayload));
    }

    const delivery = await this.otpDelivery.dispatchOtp(phone, code, dto.channel);

    return {
      ok: true,
      expiresInSec: OTP_TTL_MS / 1000,
      ...(dto.channel === OtpChannel.whatsapp
        ? { whatsappSent: delivery.whatsappSent ?? false }
        : {}),
      ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {}),
    };
  }

  async verifyOtp(dto: MobileOtpVerifyDto) {
    let phone: string;
    try {
      phone = normalizePhone(dto.phone);
    } catch {
      throw new BadRequestException('Некорректный номер телефона');
    }

    const bypass = this.isOtpVerifyBypass(phone, dto.code);
    if (!bypass) {
      const challenge = await this.prisma.otpChallenge.findFirst({
        where: { phone, verified: false },
        orderBy: { createdAt: 'desc' },
      });
      if (!challenge || challenge.expiresAt < new Date()) {
        throw new UnauthorizedException('Код истёк. Запросите новый.');
      }
      if (challenge.attempts >= MAX_ATTEMPTS) {
        throw new UnauthorizedException('Слишком много попыток');
      }

      const ok = challenge.codeHash === hashOtp(dto.code.trim());
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: challenge.attempts + 1, verified: ok },
      });
      if (!ok) throw new UnauthorizedException('Неверный код');
    }

    return this.completeLoginAfterOtp(phone, dto);
  }

  private async completeLoginAfterOtp(phone: string, dto: MobileOtpVerifyDto) {
    const loginAs = resolveOtpLoginAs(dto);
    const { regionId, city } = await this.resolveRegion(dto);
    const accountType = dto.accountType || AccountType.INDIVIDUAL;

    let user = await this.prisma.user.findFirst({
      where: { phone },
      include: { clientProfile: true, partnerProfile: true },
    });
    let isNewUser = false;

    if (!user) {
      if (loginAs === 'admin') {
        throw new ForbiddenException(
          'Admin кіру үшін аккаунт алдын ала құрылуы керек. Жаңа admin OTP арқылы құрылмайды.',
        );
      }
      isNewUser = true;
      const email = phoneToEmail(phone);
      const passwordHash = await bcrypt.hash(newRefreshToken(), 10);
      const portalRoles = mergePortalRolesForOtpLogin([], loginAs);
      user = await this.prisma.user.create({
        data: buildNewUserCreateData({
          email,
          passwordHash,
          phone,
          name: dto.name,
          regionId,
          city,
          loginAs,
          accountType,
          portalRoles,
        }),
        include: { clientProfile: true, partnerProfile: true },
      });
    } else {
      await this.ensureMultiRoleProfiles(user.id, loginAs, dto);
      user = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { clientProfile: true, partnerProfile: true },
      });
      if (!user) throw new BadRequestException('Пайдаланушы табылмады');
      validateLoginAsProfile(loginAs, user);
    }

    const sessionRole = resolveOtpSessionRole(user, loginAs);
    this.userStatus.assertCanLogin(user);

    await this.upsertDevice(user.id, dto);
    const { refreshToken, expiresAt } = await this.issueSession(
      user.id,
      dto.deviceId,
      dto.deviceName,
      dto.platform,
    );
    const accessToken = await this.signAccess(user, sessionRole);

    const portalRoles = this.rbac.resolvePortalRoles(user);

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: this.accessExpiresSec(),
      refreshExpiresAt: expiresAt.toISOString(),
      isNewUser,
      sessionRole,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: sessionRole,
        roles: portalRoles,
      },
      needsApplication:
        loginAs === 'partner' && user.partnerProfile?.status !== PartnerStatus.APPROVED,
      partnerStatus: user.partnerProfile?.status || null,
      statuses: this.userStatus.snapshot(user, user.partnerProfile ?? null),
    };
  }

  async refresh(dto: MobileRefreshDto) {
    const tokenHash = hashRefreshToken(dto.refreshToken);
    const row = await this.prisma.authRefreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { clientProfile: true, partnerProfile: true } } },
    });
    if (!row || row.revokedAt || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Сессия недействительна');
    }
    if (row.deviceId !== dto.deviceId) {
      throw new UnauthorizedException('Устройство не совпадает');
    }

    await this.prisma.authRefreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });

    const sessionRole = dto.sessionRole ?? row.user.role;

    const { refreshToken, expiresAt } = await this.issueSession(
      row.userId,
      dto.deviceId,
      row.deviceName || undefined,
      row.platform || undefined,
      row.familyId,
    );
    const accessToken = await this.signAccess(row.user, sessionRole);

    await this.prisma.userDevice.updateMany({
      where: { userId: row.userId, deviceId: dto.deviceId },
      data: { lastSeenAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: this.accessExpiresSec(),
      refreshExpiresAt: expiresAt.toISOString(),
      sessionRole,
      user: {
        id: row.user.id,
        name: row.user.name,
        phone: row.user.phone,
        role: sessionRole,
      },
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    await this.prisma.authRefreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async logoutAllDevices(userId: string) {
    await this.prisma.authRefreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async listSessions(userId: string) {
    const devices = await this.prisma.userDevice.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
    return devices.map((d) => ({
      deviceId: d.deviceId,
      deviceName: d.deviceName,
      platform: d.platform,
      trustedAt: d.trustedAt,
      lastSeenAt: d.lastSeenAt,
      biometricEnabled: d.biometricEnabled,
    }));
  }
}
