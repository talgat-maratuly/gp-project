import { Global, Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacRegionService } from './rbac-region.service';
import { PortalRolesGuard } from './guards/portal-roles.guard';
import { PermissionGuard } from './guards/permission.guard';
import { RbacController } from './rbac.controller';

@Global()
@Module({
  controllers: [RbacController],
  providers: [RbacService, RbacRegionService, PortalRolesGuard, PermissionGuard],
  exports: [RbacService, RbacRegionService, PortalRolesGuard, PermissionGuard],
})
export class RbacModule {}
