import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CreateVenteDto } from './dto/create-sale.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VentesService } from './ventes.service';
import { ExportService } from '../export/export.service';

@ApiTags('Ventes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ventes')
export class VenteController {
  constructor(
    private readonly VenteService: VentesService,
    private readonly exportService: ExportService,
  ) {}

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
    return this.VenteService.findAll(req.user.userId, {
      search,
      sortBy,
      sortOrder,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.VenteService.findOne(id, req.user.userId);
  }

  @Post(':id/payments')
  addPayment(
    @Param('id') id: string,
    @Body() dto: AddPaymentDto,
    @Request() req,
  ) {
    return this.VenteService.addPayment(id, req.user.userId, dto);
  }

  @Delete(':id/payments/:paymentId')
  removePayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Request() req,
  ) {
    return this.VenteService.removePayment(id, paymentId, req.user.userId);
  }

  // ── Facture PDF ────────────────────────────────────────────────────────────
  @Get(':id/invoice')
  async getInvoice(
    @Param('id') id: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const sale = await this.VenteService.findOne(id, req.user.userId);
    const pdfBuffer = await this.exportService.generateSaleInvoicePdf(sale);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture-vente-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.status(HttpStatus.OK).end(pdfBuffer);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.VenteService.remove(id, req.user.userId);
  }
}
