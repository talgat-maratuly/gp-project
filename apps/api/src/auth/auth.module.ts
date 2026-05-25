import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MobileAuthController } from './mobile-auth.controller';
import { MobileAuthService } from './mobile-auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PartnersModule } from '../partners/partners.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
    PartnersModule,
  ],
  controllers: [AuthController, MobileAuthController],
  providers: [AuthService, MobileAuthService, JwtStrategy],
  exports: [AuthService, MobileAuthService, JwtModule, PassportModule],
})
export class AuthModule {}
