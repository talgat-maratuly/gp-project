import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MobileAuthService } from './mobile-auth.service';
import { MobileOtpSendDto } from './dto/mobile-otp-send.dto';
import { MobileOtpVerifyDto } from './dto/mobile-otp-verify.dto';
import { MobileRefreshDto } from './dto/mobile-refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth-mobile')
@Controller('auth/mobile')
export class MobileAuthController {
  constructor(private mobile: MobileAuthService) {}

  @Post('otp/send')
  sendOtp(@Body() dto: MobileOtpSendDto) {
    return this.mobile.sendOtp(dto);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: MobileOtpVerifyDto) {
    return this.mobile.verifyOtp(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: MobileRefreshDto) {
    return this.mobile.refresh(dto);
  }

  @Post('logout')
  logout(@Body() body: { refreshToken: string }) {
    return this.mobile.logout(body.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  logoutAll(@CurrentUser() user: { id: string }) {
    return this.mobile.logoutAllDevices(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  sessions(@CurrentUser() user: { id: string }) {
    return this.mobile.listSessions(user.id);
  }
}
