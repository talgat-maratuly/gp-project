import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SpecialistRequestsService } from '../specialist-requests.service';

/** Кем дегенде бір APPROVED өтінімсіз — тапсырыс көре/қабылдай алмайды */
@Injectable()
export class SpecialistRequestApprovedGuard implements CanActivate {
  constructor(private specialistRequests: SpecialistRequestsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;
    if (!userId) return false;

    await this.specialistRequests.assertSpecialistCanViewOrders(userId);
    return true;
  }
}
