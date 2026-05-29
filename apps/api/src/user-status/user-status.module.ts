import { Global, Module } from '@nestjs/common';
import { UserStatusService } from './user-status.service';
import { AccountActiveGuard } from './guards/account-active.guard';
import { SpecialistOnlineGuard } from './guards/specialist-online.guard';
import { UserStatusController } from './user-status.controller';

@Global()
@Module({
  controllers: [UserStatusController],
  providers: [UserStatusService, AccountActiveGuard, SpecialistOnlineGuard],
  exports: [UserStatusService, AccountActiveGuard, SpecialistOnlineGuard],
})
export class UserStatusModule {}
