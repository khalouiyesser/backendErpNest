import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Deliveries')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}
  @Post() create(@Body() dto: any, @Request() req) { return this.deliveryService.create(dto, req.user.userId, req.user.name, req.user.companyId); }
  @Get() findAll(@Request() req, @Query('search') search?: string, @Query('status') status?: string) { return this.deliveryService.findAll(req.user.companyId, { search, status }); }
  @Get(':id') findOne(@Param('id') id: string, @Request() req) { return this.deliveryService.findOne(id, req.user.companyId); }
  @Patch(':id/deliver') @ApiOperation({ summary: 'Marquer comme livré' }) markDelivered(@Param('id') id: string, @Request() req) { return this.deliveryService.markDelivered(id, req.user.companyId); }
  @Patch(':id/cancel') cancel(@Param('id') id: string, @Request() req) { return this.deliveryService.cancel(id, req.user.companyId); }
  @Delete(':id') remove(@Param('id') id: string, @Request() req) { return this.deliveryService.remove(id, req.user.companyId); }
}
