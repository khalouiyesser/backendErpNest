import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateVenteDto } from './dto/create-sale.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {VentesService} from "./ventes.service";

@ApiTags('Ventes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ventes')
export class VenteController {
  constructor(private readonly VenteService: VentesService) {}

  @Post()
  create(@Body() dto: CreateVenteDto, @Request() req) {
    return this.VenteService.create(dto, req.user.userId);
  }


  @Get()
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('status') status?: string,
  ) {
    return this.VenteService.findAll(req.user.userId, { search, sortBy, sortOrder, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.VenteService.findOne(id, req.user.userId);
  }

  @Post(':id/payments')
  addPayment(@Param('id') id: string, @Body() dto: AddPaymentDto, @Request() req) {
    return this.VenteService.addPayment(id, req.user.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.VenteService.remove(id, req.user.userId);
  }
}
