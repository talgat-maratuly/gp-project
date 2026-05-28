import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountType, OtpChannel, PartnerRole, PartnerStatus, PartnerType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MobileOtpSendDto } from './dto/mobile-otp-send.dto';
import { MobileOtpVerifyDto } from './dto/mobile-otp-verify.dto';
import { MobileRefreshDto } from './dto/mobile-refresh.dto';
import {
  generateOtpCode,
  hashOtp,
  hashRefreshToken,
  newFamilyId,
  newRefreshToken,
  normalizePhone,
  phoneToEmail,
} from './mobile-auth.util';

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
  ) {}

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

  private async signAccess(user: { id: string; email: string; role: Role }) {
    return this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, typ: 'access' },
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
    dto: { deviceId: string; deviceName?: string; platform?: string; rememberDevice?: boolean; enableBiometric?: boolean },
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
    } else {
      await this.dispatchOtp(phone, code, dto.channel);
    }

    return {
      ok: true,
      expiresInSec: OTP_TTL_MS / 1000,
      ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {}),
    };
  }

  private async dispatchOtp(phone: string, code: string, channel: OtpChannel) {
    // Production: plug SMS/WhatsApp provider via env
    const webhook = process.env.OTP_WEBHOOK_URL;
    if (webhook) {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, channel }),
      }).catch(() => {});
    }
  }

  async verifyOtp(dto: MobileOtpVerifyDto) {
    let phone: string;
    try {
      phone = normalizePhone(dto.phone);
    } catch {
      throw new BadRequestException('Некорректный номер телефона');
    }

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

    const desiredRole = dto.desiredRole === Role.PARTNER ? Role.PARTNER : Role.CLIENT;
    const desiredAccountType = dto.accountType || AccountType.INDIVIDUAL;

    let user = await this.prisma.user.findFirst({
      where: { phone },
      include: { clientProfile: true, partnerProfile: true },
    });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const email = phoneToEmail(phone);
      const passwordHash = await bcrypt.hash(newRefreshToken(), 10);
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
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          name: dto.name?.trim() || 'Клиент GP',
          phone,
          role: desiredRole,
          regionId,
          ...(desiredRole === Role.CLIENT
            ? {
                clientProfile: { create: { accountType: AccountType.INDIVIDUAL, city } },
              }
            : {
                partnerProfile: {
                  create: {
                    regionId,
                    status: PartnerStatus.DRAFT,
                    accountType: desiredAccountType,
                    partnerRole: PartnerRole.SPECIALIST,
                    partnerType: PartnerType.OTHER,
                    fullName: dto.name?.trim() || 'Серіктес',
                    companyName: dto.name?.trim() || 'Серіктес',
                    company: dto.name?.trim() || 'Серіктес',
                    city,
                    directions: [],
                    balance: 10000,
                  },
                },
              }),
        },
        include: { clientProfile: true, partnerProfile: true },
      });
    } else if (user.role !== desiredRole) {
      throw new UnauthorizedException('Бұл телефон басқа рөлге тіркелген');
    }

    await this.upsertDevice(user.id, dto);
    const { refreshToken, expiresAt } = await this.issueSession(
      user.id,
      dto.deviceId,
      dto.deviceName,
      dto.platform,
    );
    const accessToken = await this.signAccess(user);

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: this.accessExpiresSec(),
      refreshExpiresAt: expiresAt.toISOString(),
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      needsApplication: user.role === Role.PARTNER && user.partnerProfile?.status !== PartnerStatus.APPROVED,
      partnerStatus: user.partnerProfile?.status || null,
    };
  }

  async refresh(dto: MobileRefreshDto) {
    const tokenHash = hashRefreshToken(dto.refreshToken);
    const row = await this.prisma.authRefreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { clientProfile: true } } },
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

    const { refreshToken, expiresAt } = await this.issueSession(
      row.userId,
      dto.deviceId,
      row.deviceName || undefined,
      row.platform || undefined,
      row.familyId,
    );
    const accessToken = await this.signAccess(row.user);

    await this.prisma.userDevice.updateMany({
      where: { userId: row.userId, deviceId: dto.deviceId },
      data: { lastSeenAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: this.accessExpiresSec(),
      refreshExpiresAt: expiresAt.toISOString(),
      user: {
        id: row.user.id,
        name: row.user.name,
        phone: row.user.phone,
        role: row.user.role,
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
