import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AccountType, PartnerOfferingStatus, Role } from '@prisma/client';
import {
  normalizePartnerDocuments,
  validateClientRegistration,
  validatePartnerRegistration,
} from '../common/account-type.util';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { RegisterPartnerDto } from './dto/register-partner.dto';
import { LoginDto } from './dto/login.dto';
import {
  deriveDirectionsFromSubservices,
  expandDirectionsToSubservices,
} from '../common/partner-offerings.util';
import { isFurnitureExecutorAccessId } from '../common/furniture-executor.util';
import { PartnersService } from '../partners/partners.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private partners: PartnersService,
  ) {}

  private async signToken(user: { id: string; email: string; role: Role }) {
    return {
      accessToken: await this.jwt.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async registerClient(dto: RegisterClientDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email уже зарегистрирован');

    const accountType = dto.accountType || AccountType.INDIVIDUAL;
    validateClientRegistration({
      accountType,
      name: dto.name,
      companyName: dto.companyName,
      bin: dto.bin,
      legalAddress: dto.legalAddress,
    });

    const displayName =
      accountType === AccountType.LEGAL_ENTITY
        ? (dto.contactPerson?.trim() || dto.name?.trim())
        : dto.name.trim();

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: displayName,
        phone: dto.phone,
        role: Role.CLIENT,
        clientProfile: {
          create: {
            accountType,
            companyName: dto.companyName?.trim() || null,
            bin: dto.bin?.trim() || null,
            legalAddress: dto.legalAddress?.trim() || null,
            contactPerson: dto.contactPerson?.trim() || null,
          },
        },
      },
      include: { clientProfile: true },
    });
    return this.signToken(user);
  }

  async registerPartner(dto: RegisterPartnerDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email уже зарегистрирован');

    let subIds: string[];
    if (dto.subserviceIds?.length) {
      subIds = this.partners.validateSubserviceIds(dto.subserviceIds);
    } else if (dto.directions?.length) {
      subIds = expandDirectionsToSubservices(dto.directions);
    } else {
      throw new BadRequestException('Укажите подуслуги (subserviceIds) или направления (directions)');
    }

    const directions = deriveDirectionsFromSubservices(subIds);
    const hasFurnitureAccess = subIds.some((id) => isFurnitureExecutorAccessId(id));
    if (!directions.length && !hasFurnitureAccess) {
      throw new BadRequestException('Не удалось определить направления по подуслугам');
    }

    const accountType = dto.accountType || AccountType.INDIVIDUAL;
    const documents = normalizePartnerDocuments(dto.documents) ?? [];
    validatePartnerRegistration({
      accountType,
      name: dto.name,
      company: dto.company,
      bin: dto.bin,
      legalAddress: dto.legalAddress,
      idDocumentNumber: dto.idDocumentNumber,
      documents,
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name.trim(),
        phone: dto.phone,
        role: Role.PARTNER,
        partnerProfile: {
          create: {
            accountType,
            company:
              accountType === AccountType.LEGAL_ENTITY
                ? dto.company!.trim()
                : dto.company?.trim() || dto.name.trim(),
            bin: dto.bin?.trim() || null,
            legalAddress: dto.legalAddress?.trim() || null,
            idDocumentNumber: dto.idDocumentNumber?.trim() || null,
            documents: documents.length ? documents : undefined,
            city: dto.city?.trim() || 'Уральск',
            referralCode: dto.referralCode?.trim() || undefined,
            directions,
            balance: 10000,
          },
        },
      },
      include: { partnerProfile: true },
    });

    const partnerProfileId = user.partnerProfile!.id;
    const offeringStatus =
      process.env.NODE_ENV === 'production'
        ? PartnerOfferingStatus.PENDING_MODERATION
        : PartnerOfferingStatus.ACTIVE;
    await this.prisma.partnerServiceOffering.createMany({
      data: subIds.map((subserviceId) => ({
        partnerId: partnerProfileId,
        subserviceId,
        status: offeringStatus,
      })),
    });
    await this.partners.syncDirectionsFromOfferings(partnerProfileId);
    await this.partners.syncServiceAccessFromOfferings(partnerProfileId);

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
