import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MobileAuthController } from './mobile-auth.controller';
import { MobileAuthService } from './mobile-auth.service';
import { OtpDeliveryService } from './otp-delivery.service';
import { EgovLegalVerificationService } from './egov-legal-verification.service';
import { JwtStrategy } from './jwt.strategy';
import { PartnersModule } from '../partners/partners.module';
import { getJwtExpiresIn, getJwtSecret } from './jwt.config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getJwtExpiresIn() },
    }),
    PartnersModule,
  ],
  controllers: [AuthController, MobileAuthController],
  providers: [
    AuthService,
    MobileAuthService,
    OtpDeliveryService,
    EgovLegalVerificationService,
    JwtStrategy,
  ],
  exports: [AuthService, MobileAuthService, JwtModule, PassportModule],
})
export class AuthModule {}
