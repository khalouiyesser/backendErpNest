import {
  Controller, Get, Post, Body, Patch,
  Param, Delete, Request, Query, UseGuards,
} from '@nestjs/common';
import { PaymentVenteService } from './payment-vente.service';
import { CreatePaymentVenteDto } from './dto/create-payment-vente.dto';
import { UpdatePaymentVenteDto } from './dto/update-payment-vente.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";

@ApiTags('Paiements Ventes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-vente')
export class PaymentVenteController {
  constructor(private readonly paymentVenteService: PaymentVenteService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un paiement vente' })
  create(@Body() dto: CreatePaymentVenteDto, @Request() req) {
    return this.paymentVenteService.create(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les paiements ventes' })
  findAll(
      @Request() req,
      @Query('search') search?: string,
      @Query('saleId') saleId?: string,
      @Query('clientId') clientId?: string,
  ) {
    return this.paymentVenteService.findAll(req.user.userId, { search, saleId, clientId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un paiement vente par ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.paymentVenteService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un paiement vente' })
  update(@Param('id') id: string, @Body() dto: UpdatePaymentVenteDto, @Request() req) {
    return this.paymentVenteService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un paiement vente' })
  remove(@Param('id') id: string, @Request() req) {
    return this.paymentVenteService.remove(id, req.user.userId);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Paiements ventes par client' })
  getByClient(@Param('clientId') clientId: string, @Request() req) {
    return this.paymentVenteService.getPaymentVenteByUserAndClient(req.user.userId, clientId);
  }
}