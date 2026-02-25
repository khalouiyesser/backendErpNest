import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Stock')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Mouvements de stock' })
  findAll(@Request() req, @Query('type') type?: string, @Query('productId') productId?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.stockService.findAll(req.user.companyId, { type, productId, startDate, endDate });
  }
}
