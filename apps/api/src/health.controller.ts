import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health/health.service';

@Controller()
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get('health')
  ping() {
    return { status: 'ok', service: 'gp-api' };
  }

  @Get('health/full')
  fullHealth() {
    return this.healthService.full();
  }
}
