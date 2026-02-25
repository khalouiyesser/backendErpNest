import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Accounting')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Résumé comptable avec TVA et bénéfice' })
  getSummary(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.accountingService.getSummary(req.user.companyId, startDate, endDate);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Ventilation mensuelle' })
  getMonthly(@Request() req, @Query('year') year?: string) {
    return this.accountingService.getMonthlyBreakdown(req.user.companyId, parseInt(year) || new Date().getFullYear());
  }
}
