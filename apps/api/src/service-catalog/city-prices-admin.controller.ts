import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CityPricesService } from './city-prices.service';
import { CreateCityPriceDto, UpdateCityPriceDto } from './service-catalog.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGION_ADMIN)
@Controller('admin/city-prices')
export class CityPricesAdminController {
  constructor(private prices: CityPricesService) {}

  @Get()
  @ApiQuery({ name: 'serviceCode', required: false })
  @ApiQuery({ name: 'cityId', required: false })
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'oblastId', required: false })
  list(
    @Query('serviceCode') serviceCode?: string,
    @Query('cityId') cityId?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('oblastId') oblastId?: string,
  ) {
    return this.prices.list({
      serviceCode: serviceCode?.trim() || undefined,
      cityId: cityId?.trim() || undefined,
      franchiseId: franchiseId?.trim() || undefined,
      oblastId: oblastId?.trim() || undefined,
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.prices.get(id);
  }

  @Post()
  create(@Body() dto: CreateCityPriceDto) {
    return this.prices.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCityPriceDto) {
    return this.prices.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prices.remove(id);
  }
}
