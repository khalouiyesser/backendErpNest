import { Controller, Get, Query, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ExportService } from '../export/export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService, private readonly exportService: ExportService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Rapport des ventes' })
  getSales(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getSalesReport(req.user.companyId, startDate, endDate);
  }

  @Get('purchases')
  @ApiOperation({ summary: 'Rapport des achats' })
  getPurchases(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getPurchasesReport(req.user.companyId, startDate, endDate);
  }

  @Get('stock')
  @ApiOperation({ summary: 'Rapport de stock' })
  getStock(@Request() req) { return this.reportsService.getStockReport(req.user.companyId); }

  @Get('charges')
  @ApiOperation({ summary: 'Rapport des charges' })
  getCharges(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getChargesReport(req.user.companyId, startDate, endDate);
  }

  @Get('sales/export/pdf')
  @ApiOperation({ summary: 'Exporter rapport ventes PDF' })
  async exportSalesPdf(@Request() req, @Res() res: Response, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const report = await this.reportsService.getSalesReport(req.user.companyId, startDate, endDate);
    const buffer = await this.exportService.generateSalesReportPdf(report, req.user.companyId);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="rapport-ventes.pdf"' });
    return res.status(HttpStatus.OK).end(buffer);
  }

  @Get('sales/export/xlsx')
  @ApiOperation({ summary: 'Exporter rapport ventes Excel' })
  async exportSalesExcel(@Request() req, @Res() res: Response, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const report = await this.reportsService.getSalesReport(req.user.companyId, startDate, endDate);
    const buffer = await this.exportService.generateSalesReportExcel(report, req.user.companyId);
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="rapport-ventes.xlsx"' });
    return res.status(HttpStatus.OK).end(buffer);
  }
}
