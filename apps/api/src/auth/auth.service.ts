import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AccountType, PartnerRole, PartnerStatus, PartnerType, Role } from '@prisma/client';
import {
  normalizePartnerDocuments,
  validatePartnerRegistration,
} from '../common/account-type.util';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterPartnerDto } from './dto/register-partner.dto';
import { LoginDto } from './dto/login.dto';
import { PartnersService } from '../partners/partners.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('GP:AUTH');

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private partners: PartnersService,
  ) {}

  private async signToken(user: { id: string; email: string; role: Role; regionId?: string | null }) {
    return {
      accessToken: await this.jwt.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
        regionId: user.regionId ?? null,
      }),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        regionId: user.regionId ?? null,
      },
    };
  }

  private async assertActiveRegion(regionId: string) {
    const region = await this.prisma.region.findUnique({ where: { id: regionId } });
    if (!region?.isActive) {
      throw new NotFoundException('Регион не найден или неактивен');
    }
    return region;
  }

  private async ensureDefaultRegion() {
    const existing =
      (await this.prisma.region.findFirst({ where: { isActive: true, code: 'uralsk' } })) ??
      (await this.prisma.region.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } }));
    if (existing) return existing;
    this.logger.warn('Нет активных регионов — создаём uralsk (MVP fallback)');
    return this.prisma.region.create({
      data: { id: 'region_uralsk', code: 'uralsk', name: 'Уральск', isActive: true },
    });
  }

  private async resolveDefaultRegion() {
    return this.ensureDefaultRegion();
  }

  /** MVP: автогенерация email/phone/password, регион по умолчанию */
  async registerClient(dto: RegisterClientDto) {
    const ts = Date.now();
    const email = (dto.email?.trim() || `test_${ts}@gp.local`).toLowerCase();
    const password = dto.password?.length && dto.password.length >= 6 ? dto.password : '123456';
    const phone = dto.phone?.trim() || `test_phone_${ts}`;

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email уже зарегистрирован');

    const accountType = dto.accountType || AccountType.INDIVIDUAL;
    const baseName = dto.name?.trim() || dto.contactPerson?.trim() || dto.companyName?.trim() || 'Тест GP';
    let companyName = dto.companyName?.trim();
    let bin = dto.bin?.trim();
    let legalAddress = dto.legalAddress?.trim();
    let contactPerson = dto.contactPerson?.trim();

    if (accountType === AccountType.LEGAL_ENTITY) {
      companyName = companyName || baseName;
      bin = bin || '000000000000';
      legalAddress = legalAddress || 'Уральск (тест MVP)';
      contactPerson = contactPerson || baseName;
    } else if (!baseName) {
      throw new BadRequestException('Укажите имя');
    }

    const displayName =
      accountType === AccountType.LEGAL_ENTITY ? contactPerson! : baseName;

    const region = dto.regionId
      ? await this.assertActiveRegion(dto.regionId)
      : await this.resolveDefaultRegion();
    const cityLabel = dto.city?.trim() || region.name;

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: displayName,
        phone,
        role: Role.CLIENT,
        regionId: region.id,
        clientProfile: {
          create: {
            accountType,
            companyName: companyName || null,
            bin: bin || null,
            legalAddress: legalAddress || null,
            contactPerson: contactPerson || null,
            city: cityLabel,
          },
        },
      },
      include: { clientProfile: true },
    });
    return this.signToken(user);
  }

  /** MVP: автогенерация email/phone/password, регион по умолчанию; partnerRole обязателен */
  async registerPartner(dto: RegisterPartnerDto) {
    const ts = Date.now();
    const email = (dto.email?.trim() || `test_partner_${ts}@gp.local`).toLowerCase();
    const password = dto.password?.length && dto.password.length >= 6 ? dto.password : '123456';
    const phone = dto.phone?.trim() || `test_phone_${ts}`;
    const displayName = dto.name?.trim() || dto.company?.trim() || 'Тест партнёр GP';

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email уже зарегистрирован');

    const accountType = dto.accountType || AccountType.INDIVIDUAL;
    const region = dto.regionId
      ? await this.assertActiveRegion(dto.regionId)
      : await this.resolveDefaultRegion();
    const cityLabel = dto.city?.trim() || region.name;
    const companyName =
      accountType === AccountType.LEGAL_ENTITY
        ? dto.company?.trim() || displayName
        : dto.company?.trim() || displayName;

    const partnerRole = dto.partnerRole;
    const partnerType =
      dto.partnerType ??
      (partnerRole === PartnerRole.SHOP ? PartnerType.SHOP : PartnerType.OTHER);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: displayName,
        phone,
        role: Role.PARTNER,
        regionId: region.id,
        partnerProfile: {
          create: {
            regionId: region.id,
            status: PartnerStatus.DRAFT,
            accountType,
            partnerRole,
            partnerType,
            companyName,
            company: companyName,
            fullName: displayName,
            bin: dto.bin?.trim() || null,
            legalAddress: dto.legalAddress?.trim() || null,
            idDocumentNumber: dto.idDocumentNumber?.trim() || null,
            documents: normalizePartnerDocuments(dto.documents)?.length
              ? normalizePartnerDocuments(dto.documents)
              : undefined,
            city: cityLabel,
            referralCode: dto.referralCode?.trim() || undefined,
            directions: [],
            balance: 10000,
          },
        },
      },
      include: { partnerProfile: true },
    });

    return this.signToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { clientProfile: true, partnerProfile: true },
    });
    if (!user) throw new UnauthorizedException('Неверный email или пароль');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Неверный email или пароль');
    this.logger.log(`login ok email=${user.email} role=${user.role}`);
    return this.signToken(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        clientProfile: true,
        partnerProfile: { include: { serviceOfferings: { orderBy: { createdAt: 'asc' } } } },
      },
    });
    if (!user) return null;
    const { passwordHash: _, ...safe } = user;
    return safe;
  }
}
