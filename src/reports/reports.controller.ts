import { Controller, Get, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('Ventes')
  VentesReport(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getVentesReport(req.user.userId, { startDate, endDate });
  }

  @Get('purchases')
  purchasesReport(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getPurchasesReport(req.user.userId, { startDate, endDate });
  }

  @Get('charges')
  chargesReport(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getChargesReport(req.user.userId, { startDate, endDate });
  }

  @Get('stock')
  stockReport(@Request() req) {
    return this.reportsService.getStockReport(req.user.userId);
  }
}
