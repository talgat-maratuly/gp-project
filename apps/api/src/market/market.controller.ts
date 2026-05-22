import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('market')
@Controller('market')
export class MarketController {
  constructor(private prisma: PrismaService) {}

  @Get('products')
  @ApiQuery({ name: 'linkedServiceType', required: false })
  @ApiQuery({ name: 'partnerId', required: false })
  products(
    @Query('linkedServiceType') linkedServiceType?: string,
    @Query('partnerId') partnerId?: string,
  ) {
    return this.prisma.product.findMany({
      where: {
        ...(linkedServiceType ? { linkedServiceType } : {}),
        ...(partnerId ? { partnerId } : {}),
        inStock: true,
      },
      include: { partner: { include: { user: true } } },
      orderBy: { name: 'asc' },
    });
  }
}
