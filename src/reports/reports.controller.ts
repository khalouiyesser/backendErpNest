import {
  Controller,
  Get,
  UseGuards,
  Query,
  Request,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportService } from '../export/export.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportService: ExportService,
  ) {}

  // ── Data endpoints ─────────────────────────────────────────────────────────
  @Get('sales')
  salesReport(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getVentesReport(req.user.userId, { startDate, endDate });
  }

  @Get('purchases')
  purchasesReport(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getPurchasesReport(req.user.userId, { startDate, endDate });
  }

  @Get('charges')
  chargesReport(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getChargesReport(req.user.userId, { startDate, endDate });
  }

  @Get('stock')
  stockReport(@Request() req) {
    return this.reportsService.getStockReport(req.user.userId);
  }

  // ── Export endpoints ───────────────────────────────────────────────────────
  @Get('export/sales')
  async exportSales(
    @Request() req,
    @Query('format') format: 'pdf' | 'xlsx' = 'pdf',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const data = await this.reportsService.getVentesReport(req.user.userId, { startDate, endDate });

    if (format === 'xlsx') {
      const buffer = await this.exportService.generateSalesReportExcel(data as any[], startDate, endDate);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rapport-ventes.xlsx"`,
      });
      return res.status(HttpStatus.OK).end(buffer);
    }

    const buffer = await this.exportService.generateSalesReportPdf(data as any[], startDate, endDate);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="rapport-ventes.pdf"` });
    return res.status(HttpStatus.OK).end(buffer);
  }

  @Get('export/purchases')
  async exportPurchases(
    @Request() req,
    @Query('format') format: 'pdf' | 'xlsx' = 'pdf',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const data = await this.reportsService.getPurchasesReport(req.user.userId, { startDate, endDate });

    if (format === 'xlsx') {
      const buffer = await this.exportService.generatePurchasesReportExcel(data as any[], startDate, endDate);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rapport-achats.xlsx"`,
      });
      return res.status(HttpStatus.OK).end(buffer);
    }

    const buffer = await this.exportService.generatePurchasesReportPdf(data as any[], startDate, endDate);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="rapport-achats.pdf"` });
    return res.status(HttpStatus.OK).end(buffer);
  }

  @Get('export/stock')
  async exportStock(
    @Request() req,
    @Query('format') format: 'pdf' | 'xlsx' = 'pdf',
    @Res() res?: Response,
  ) {
    const data = await this.reportsService.getStockReport(req.user.userId);

    if (format === 'xlsx') {
      const buffer = await this.exportService.generateStockReportExcel(data as any[]);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rapport-stock.xlsx"`,
      });
      return res.status(HttpStatus.OK).end(buffer);
    }

    const buffer = await this.exportService.generateStockReportPdf(data as any[]);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="rapport-stock.pdf"` });
    return res.status(HttpStatus.OK).end(buffer);
  }

  @Get('export/charges')
  async exportCharges(
    @Request() req,
    @Query('format') format: 'pdf' | 'xlsx' = 'pdf',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const data = await this.reportsService.getChargesReport(req.user.userId, { startDate, endDate });

    if (format === 'xlsx') {
      const buffer = await this.exportService.generateChargesReportExcel(data as any[], startDate, endDate);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rapport-charges.xlsx"`,
      });
      return res.status(HttpStatus.OK).end(buffer);
    }

    res.status(400).json({ message: 'PDF charges not implemented, use xlsx' });
  }
}
