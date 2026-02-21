import { Controller, Get, Post, Body, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

class AdjustStockDto {
  @IsNotEmpty() @IsString() productId: string;
  @IsNumber() @Min(0) quantity: number;
  @IsOptional() @IsString() notes?: string;
}

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('movements')
  getMovements(
    @Request() req,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.stockService.getMovements(req.user.userId, { productId, type, search, sortBy, sortOrder });
  }

  @Get('alerts')
  getLowStockAlerts(@Request() req) {
    return this.stockService.getLowStockAlerts(req.user.userId);
  }

  @Post('adjust')
  adjustStock(@Body() dto: AdjustStockDto, @Request() req) {
    return this.stockService.adjustStock(dto.productId, dto.quantity, dto.notes || '', req.user.userId);
  }
}
