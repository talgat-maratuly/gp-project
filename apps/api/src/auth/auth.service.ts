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
import { createHash, randomBytes } from 'crypto';
import {
  AccountType,
  PartnerRole,
  PartnerStatus,
  PartnerType,
  PasswordResetChannel,
  Role,
} from '@prisma/client';
import {
  normalizePartnerDocuments,
  validatePartnerRegistration,
} from '../common/account-type.util';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterPartnerDto } from './dto/register-partner.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PartnersService } from '../partners/partners.service';
import { RbacService, UserWithProfiles } from '../rbac/rbac.service';
import { PortalRole } from '@prisma/client';
import { generateOtpCode, hashOtp, normalizePhone } from './mobile-auth.util';

const RESET_OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const RESET_COOLDOWN_MS = 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger('GP:AUTH');

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private partners: PartnersService,
    private rbac: RbacService,
  ) {}

  private async signToken(user: UserWithProfiles) {
    const roles = this.rbac.resolvePortalRoles(user);
    return {
      accessToken: await this.jwt.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
        roles,
        regionId: user.regionId ?? null,
        franchiseId: user.franchiseId ?? null,
      }),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        roles,
        regionId: user.regionId ?? null,
        franchiseId: user.franchiseId ?? null,
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
        portalRoles: [PortalRole.CLIENT],
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
      include: { clientProfile: true, partnerProfile: true },
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
        region: { select: { id: true, code: true, name: true } },
        clientProfile: true,
        partnerProfile: { include: { serviceOfferings: { orderBy: { createdAt: 'asc' } } } },
      },
    });
    if (!user) return null;
    const { passwordHash: _, ...safe } = user;
    return {
      ...safe,
      roles: this.rbac.resolvePortalRoles(user),
    };
  }

  private hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private newResetToken() {
    return randomBytes(32).toString('base64url');
  }

  private async resolveUserForReset(dto: { email?: string; phone?: string }) {
    const email = dto.email?.trim().toLowerCase();
    let phone: string | undefined;
    if (dto.phone?.trim()) {
      try {
        phone = normalizePhone(dto.phone);
      } catch {
        throw new BadRequestException('Некорректный номер телефона');
      }
    }
    if (!email && !phone) {
      throw new BadRequestException('Укажите email или телефон');
    }
    const user = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : await this.prisma.user.findFirst({ where: { phone } });
    return { user, email, phone };
  }

  /** Всегда ok — не раскрываем наличие аккаунта */
  async forgotPassword(dto: ForgotPasswordDto) {
    const { user, email, phone } = await this.resolveUserForReset(dto);
    if (!user) {
      return { ok: true, message: 'Если аккаунт найден, код отправлен' };
    }

    const channel = email ? PasswordResetChannel.EMAIL : PasswordResetChannel.PHONE;
    const lookup = email ? { email } : { phone: phone! };
    const recent = await this.prisma.passwordResetChallenge.findFirst({
      where: { ...lookup, createdAt: { gt: new Date(Date.now() - RESET_COOLDOWN_MS) }, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      throw new BadRequestException('Подождите минуту перед повторной отправкой');
    }

    const otp = generateOtpCode();
    const resetToken = this.newResetToken();
    await this.prisma.passwordResetChallenge.create({
      data: {
        channel,
        email: email || null,
        phone: phone || null,
        userId: user.id,
        otpHash: hashOtp(otp),
        resetTokenHash: this.hashResetToken(resetToken),
        expiresAt: new Date(Date.now() + RESET_OTP_TTL_MS),
      },
    });

    const devPayload = { email, phone, otp, resetToken };
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`password-reset dev ${JSON.stringify(devPayload)}`);
    } else {
      const webhook = process.env.PASSWORD_RESET_WEBHOOK_URL || process.env.OTP_WEBHOOK_URL;
      if (webhook) {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, phone, otp, channel }),
        }).catch(() => {});
      }
    }

    return {
      ok: true,
      channel: channel.toLowerCase(),
      expiresInSec: RESET_OTP_TTL_MS / 1000,
      message: 'Если аккаунт найден, код отправлен',
      ...(process.env.NODE_ENV !== 'production' ? { devCode: otp, devResetToken: resetToken } : {}),
    };
  }

  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const { user, email, phone } = await this.resolveUserForReset(dto);
    if (!user) throw new BadRequestException('Неверный код');

    const challenge = await this.prisma.passwordResetChallenge.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
        ...(email ? { email } : { phone }),
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge?.otpHash || challenge.otpHash !== hashOtp(dto.otp.trim())) {
      throw new BadRequestException('Неверный или просроченный код');
    }

    const resetToken = this.newResetToken();
    await this.prisma.passwordResetChallenge.update({
      where: { id: challenge.id },
      data: {
        resetTokenHash: this.hashResetToken(resetToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    return {
      ok: true,
      resetToken,
      ...(process.env.NODE_ENV !== 'production' ? { devResetToken: resetToken } : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashResetToken(dto.resetToken.trim());
    const challenge = await this.prisma.passwordResetChallenge.findFirst({
      where: {
        resetTokenHash: tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!challenge?.userId) {
      throw new BadRequestException('Ссылка или код восстановления недействительны');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: challenge.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { ok: true, message: 'Пароль обновлён' };
  }
}
