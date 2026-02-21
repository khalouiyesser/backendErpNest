import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

class AddPurchasePaymentDto {
  @IsNumber() @Min(0.01) amount: number;
  @IsOptional() @IsString() note?: string;
}

@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Body() dto: CreatePurchaseDto, @Request() req) {
    return this.purchasesService.create(dto, req.user.userId);
  }

  @Get()
  findAll(@Request() req, @Query('search') search?: string, @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: 'asc' | 'desc', @Query('status') status?: string) {
    return this.purchasesService.findAll(req.user.userId, { search, sortBy, sortOrder, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.purchasesService.findOne(id, req.user.userId);
  }

  @Post(':id/payments')
  addPayment(@Param('id') id: string, @Body() dto: AddPurchasePaymentDto, @Request() req) {
    return this.purchasesService.addPayment(id, req.user.userId, dto.amount, dto.note);
  }



  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.purchasesService.remove(id, req.user.userId);
  }
}
