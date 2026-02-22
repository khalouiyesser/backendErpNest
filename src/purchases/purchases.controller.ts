import {
  Controller, Get, Post, Body, Param, Delete,
  UseGuards, Query, Request, Res, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportService } from '../export/export.service';

@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(
      private readonly purchasesService: PurchasesService,
      private readonly exportService: ExportService,
  ) {}

  @Post()
  create(@Body() dto: CreatePurchaseDto, @Request() req) {
    return this.purchasesService.create(dto, req.user.userId);
  }

  @Get()
  findAll(
      @Request() req,
      @Query('search') search?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'asc' | 'desc',
      @Query('status') status?: string,
  ) {
    return this.purchasesService.findAll(req.user.userId, { search, sortBy, sortOrder, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.purchasesService.findOne(id, req.user.userId);
  }

  // ── Bon de commande PDF ───────────────────────────────────────────────────
  @Get(':id/invoice')
  async getInvoice(@Param('id') id: string, @Request() req, @Res() res: Response) {
    const purchase = await this.purchasesService.findOne(id, req.user.userId);
    const pdfBuffer = await this.exportService.generatePurchaseInvoicePdf(purchase);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bon-achat-${id}.pdf"`,
    });
    res.status(HttpStatus.OK).end(pdfBuffer);
  }

  @Post(':id/payments')
  addPayment(
      @Param('id') id: string,
      @Body() body: { amount: number; note?: string },
      @Request() req,
  ) {
    return this.purchasesService.addPayment(id, req.user.userId, body.amount, body.note);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.purchasesService.remove(id, req.user.userId);
  }
}
