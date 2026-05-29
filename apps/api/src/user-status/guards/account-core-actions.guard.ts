import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserStatusService } from '../user-status.service';

/** ACTIVE қажет: тапсырыс, қабылдау, т.б. SUSPENDED login істей алады */
@Injectable()
export class AccountCoreActionsGuard implements CanActivate {
  constructor(private userStatus: UserStatusService) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    this.userStatus.assertCanPerformCoreActions(user);
    return true;
  }
}
