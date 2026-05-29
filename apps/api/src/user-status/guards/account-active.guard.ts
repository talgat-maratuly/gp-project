import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserStatusService } from '../user-status.service';

/** Account Status = ACTIVE (барлық қорғалған endpoint) */
@Injectable()
export class AccountActiveGuard implements CanActivate {
  constructor(private userStatus: UserStatusService) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    this.userStatus.assertAccountActive(user);
    return true;
  }
}
