import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { Company } from '../company/company.schema';

@Injectable()
export class ExportService {
  constructor(@InjectModel(Company.name) private companyModel: Model<any>) {}

  // ══════════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════════
  private async getCompany(companyId: string): Promise<any> {
    if (!companyId) return null;
    return this.companyModel.findById(companyId).lean();
  }

  private fmt(n: number): string {
    return (n || 0).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' TND';
  }

  private fmtDate(d: Date | string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // ── PDF Header avec données company ───────────────────────────────────────
  private async addPdfHeader(doc: typeof PDFDocument, company: any, title: string) {
    doc.rect(0, 0, doc.page.width, 100).fill('#1e3a5f');

    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
       .text(company?.name || 'ERP System', 40, 20);

    if (company?.address) doc.fontSize(9).font('Helvetica').text(company.address, 40, 42);
    if (company?.phone) doc.text(`Tél: ${company.phone}`, 40, 54);
    if (company?.email) doc.text(`Email: ${company.email}`, 40, 66);
    if (company?.matriculeFiscal) doc.text(`MF: ${company.matriculeFiscal}`, 40, 78);

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff')
       .text(title, 0, 35, { align: 'right', width: doc.page.width - 40 });

    doc.moveDown(3);
    doc.fillColor('#000000');
  }

  // ── PDF Footer ────────────────────────────────────────────────────────────
  private addPdfFooter(doc: typeof PDFDocument, company: any) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      const y = doc.page.height - 50;
      doc.rect(0, y - 10, doc.page.width, 50).fill('#f0f4f8');
      doc.fontSize(8).fillColor('#666')
         .text(`${company?.name || 'ERP'} — Généré le ${new Date().toLocaleDateString('fr-TN')}`, 40, y, { align: 'left' })
         .text(`Page ${i + 1}/${pageCount}`, 0, y, { align: 'right', width: doc.page.width - 40 });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  FACTURE VENTE PDF
  // ══════════════════════════════════════════════════════════
  async generateSaleInvoicePdf(sale: any, companyId: string): Promise<Buffer> {
    const company = await this.getCompany(companyId);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, bufferPages: true, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', d => buffers.push(d));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      this.addPdfHeader(doc, company, 'FACTURE').then(() => {
        // Info facture + client
        const infoY = doc.y;
        doc.fontSize(10).font('Helvetica');
        doc.text(`N° Facture: ${sale._id?.toString().slice(-6).toUpperCase()}`, 40, infoY);
        doc.text(`Date: ${this.fmtDate(sale.createdAt)}`, 40);
        doc.text(`Vendeur: ${sale.createdByName || '—'}`, 40);
        doc.moveDown(0.5);

        doc.rect(350, infoY, 210, 65).fill('#f0f4f8');
        doc.fillColor('#000').font('Helvetica-Bold').text('FACTURER À', 360, infoY + 5);
        doc.font('Helvetica').text(sale.clientName || '—', 360, infoY + 20);

        // Tableau items
        doc.moveDown(2);
        const tableTop = doc.y;
        const cols = [40, 200, 310, 380, 450, 510];
        const headers = ['#', 'Désignation', 'Qté', 'PU HT', 'TVA%', 'Total TTC'];
        doc.rect(40, tableTop, doc.page.width - 80, 22).fill('#1e3a5f');
        headers.forEach((h, i) => {
          doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9).text(h, cols[i], tableTop + 6, { width: (cols[i+1] || 560) - cols[i] });
        });
        doc.fillColor('#000').font('Helvetica').fontSize(9);

        (sale.items || []).forEach((item: any, idx: number) => {
          const rowY = tableTop + 22 + idx * 20;
          if (idx % 2 === 0) doc.rect(40, rowY, doc.page.width - 80, 20).fill('#f9fafb');
          doc.fillColor('#000')
             .text(`${idx + 1}`, cols[0], rowY + 5)
             .text(item.productName || '', cols[1], rowY + 5, { width: 100 })
             .text(`${item.quantity} ${item.unit || ''}`.trim(), cols[2], rowY + 5)
             .text(this.fmt(item.unitPrice), cols[3], rowY + 5)
             .text(`${item.tva || 0}%`, cols[4], rowY + 5)
             .text(this.fmt(item.totalTTC), cols[5], rowY + 5);
        });

        // Totaux
        const totY = tableTop + 22 + (sale.items?.length || 0) * 20 + 15;
        doc.rect(350, totY, 210, 80).stroke('#1e3a5f');
        doc.fontSize(10).font('Helvetica')
           .text('Total HT:', 360, totY + 8).text(this.fmt(sale.totalHT), 480, totY + 8)
           .text('TVA:', 360, totY + 25).text(this.fmt(sale.totalTTC - sale.totalHT), 480, totY + 25);
        doc.font('Helvetica-Bold').fontSize(11)
           .text('Total TTC:', 360, totY + 45).text(this.fmt(sale.totalTTC), 480, totY + 45)
           .text('Payé:', 360, totY + 62).text(this.fmt(sale.amountPaid), 480, totY + 62);
        if (sale.amountRemaining > 0) {
          doc.fillColor('#cc0000').text('Reste:', 360, totY + 78).text(this.fmt(sale.amountRemaining), 480, totY + 78);
          doc.fillColor('#000');
        }

        if (sale.notes) {
          doc.moveDown(6).fontSize(9).font('Helvetica-Bold').text('Notes:').font('Helvetica').text(sale.notes);
        }

        this.addPdfFooter(doc, company);
        doc.end();
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  FACTURE VENTE EXCEL
  // ══════════════════════════════════════════════════════════
  async generateSaleInvoiceExcel(sale: any, companyId: string): Promise<Buffer> {
    const company = await this.getCompany(companyId);
    const wb = new ExcelJS.Workbook();
    wb.creator = company?.name || 'ERP';
    wb.created = new Date();
    const ws = wb.addWorksheet('Facture');

    // Company header
    ws.mergeCells('A1:G1');
    const headerCell = ws.getCell('A1');
    headerCell.value = company?.name || 'ERP System';
    headerCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.mergeCells('A2:G2');
    ws.getCell('A2').value = `${company?.address || ''} | Tél: ${company?.phone || ''} | ${company?.email || ''}`;
    ws.getCell('A2').alignment = { horizontal: 'center' };

    if (company?.matriculeFiscal) {
      ws.mergeCells('A3:G3');
      ws.getCell('A3').value = `MF: ${company.matriculeFiscal}`;
      ws.getCell('A3').alignment = { horizontal: 'center' };
    }

    ws.addRow([]);
    ws.mergeCells('A5:G5');
    ws.getCell('A5').value = `FACTURE N° ${sale._id?.toString().slice(-6).toUpperCase()}`;
    ws.getCell('A5').font = { bold: true, size: 14 };
    ws.getCell('A5').alignment = { horizontal: 'center' };

    ws.addRow(['Client:', sale.clientName, '', 'Date:', this.fmtDate(sale.createdAt)]);
    ws.addRow(['Vendeur:', sale.createdByName || '—']);
    ws.addRow([]);

    // Tableau
    const tableRow = ws.addRow(['#', 'Désignation', 'Quantité', 'PU HT', 'TVA%', 'HT', 'TTC']);
    tableRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } };
      cell.alignment = { horizontal: 'center' };
    });

    (sale.items || []).forEach((item: any, idx: number) => {
      const r = ws.addRow([idx+1, item.productName, item.quantity, item.unitPrice, `${item.tva}%`, item.totalHT, item.totalTTC]);
      if (idx % 2 === 0) r.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }; });
    });

    ws.addRow([]);
    ws.addRow(['', '', '', '', '', 'Total HT:', sale.totalHT]);
    ws.addRow(['', '', '', '', '', 'TVA:', sale.totalTTC - sale.totalHT]);
    const totRow = ws.addRow(['', '', '', '', '', 'Total TTC:', sale.totalTTC]);
    totRow.getCell(7).font = { bold: true };
    ws.addRow(['', '', '', '', '', 'Payé:', sale.amountPaid]);
    if (sale.amountRemaining > 0) {
      const remRow = ws.addRow(['', '', '', '', '', 'Reste:', sale.amountRemaining]);
      remRow.getCell(7).font = { bold: true, color: { argb: 'FFCC0000' } };
    }

    ws.columns = [{ width: 5 }, { width: 30 }, { width: 12 }, { width: 15 }, { width: 10 }, { width: 20 }, { width: 20 }];
    return (wb.xlsx.writeBuffer() as unknown) as Promise<Buffer>;
  }

  // ══════════════════════════════════════════════════════════
  //  DEVIS PDF
  // ══════════════════════════════════════════════════════════
  async generateQuotePdf(quote: any, companyId: string): Promise<Buffer> {
    const company = await this.getCompany(companyId);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, bufferPages: true, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', d => buffers.push(d));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      this.addPdfHeader(doc, company, 'DEVIS').then(() => {
        doc.fontSize(10).font('Helvetica');
        doc.text(`Devis N°: ${quote._id?.toString().slice(-6).toUpperCase()}`, 40);
        doc.text(`Client: ${quote.clientName || '—'}`, 40);
        doc.text(`Créé par: ${quote.createdByName || '—'}`, 40);
        doc.text(`Date: ${this.fmtDate(quote.createdAt)}`, 40);
        if (quote.validUntil) doc.text(`Valable jusqu'au: ${this.fmtDate(quote.validUntil)}`, 40);

        doc.moveDown(1);
        const tableTop = doc.y;
        const cols = [40, 200, 310, 380, 450, 510];
        const headers = ['#', 'Désignation', 'Qté', 'PU HT', 'TVA%', 'Total TTC'];
        doc.rect(40, tableTop, doc.page.width - 80, 22).fill('#1e3a5f');
        headers.forEach((h, i) => doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9).text(h, cols[i], tableTop + 6, { width: (cols[i+1] || 560) - cols[i] }));
        doc.fillColor('#000').font('Helvetica').fontSize(9);

        (quote.items || []).forEach((item: any, idx: number) => {
          const rowY = tableTop + 22 + idx * 20;
          if (idx % 2 === 0) doc.rect(40, rowY, doc.page.width - 80, 20).fill('#f9fafb');
          doc.fillColor('#000').text(`${idx+1}`, cols[0], rowY+5).text(item.productName||'', cols[1], rowY+5, {width:100}).text(`${item.quantity}`, cols[2], rowY+5).text(this.fmt(item.unitPrice), cols[3], rowY+5).text(`${item.tva||0}%`, cols[4], rowY+5).text(this.fmt(item.totalTTC), cols[5], rowY+5);
        });

        const totY = tableTop + 22 + (quote.items?.length || 0) * 20 + 15;
        doc.rect(350, totY, 210, 60).stroke('#1e3a5f');
        doc.fontSize(10).font('Helvetica').text('Total HT:', 360, totY+8).text(this.fmt(quote.totalHT), 480, totY+8).font('Helvetica-Bold').fontSize(12).text('Total TTC:', 360, totY+30).text(this.fmt(quote.totalTTC), 480, totY+30);
        if (quote.notes) doc.moveDown(6).fontSize(9).font('Helvetica-Bold').text('Notes:').font('Helvetica').text(quote.notes);
        this.addPdfFooter(doc, company);
        doc.end();
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  ACHAT PDF
  // ══════════════════════════════════════════════════════════
  async generatePurchasePdf(purchase: any, companyId: string): Promise<Buffer> {
    const company = await this.getCompany(companyId);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, bufferPages: true });
      const buffers: Buffer[] = [];
      doc.on('data', d => buffers.push(d));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      this.addPdfHeader(doc, company, 'BON DE COMMANDE').then(() => {
        doc.fontSize(10).font('Helvetica');
        doc.text(`N°: ${purchase._id?.toString().slice(-6).toUpperCase()}`, 40);
        doc.text(`Fournisseur: ${purchase.FournisseurName || '—'}`, 40);
        doc.text(`Créé par: ${purchase.createdByName || '—'}`, 40);
        doc.text(`Date: ${this.fmtDate(purchase.createdAt)}`, 40);
        doc.text(`Statut: ${purchase.status?.toUpperCase() || '—'}`, 40);
        doc.moveDown(1);
        const tableTop = doc.y;
        const cols = [40, 200, 310, 380, 450, 510];
        const headers = ['#', 'Produit', 'Qté', 'PU HT', 'TVA%', 'Total TTC'];
        doc.rect(40, tableTop, doc.page.width - 80, 22).fill('#1e3a5f');
        headers.forEach((h, i) => doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9).text(h, cols[i], tableTop+6, { width: (cols[i+1]||560)-cols[i] }));
        doc.fillColor('#000').font('Helvetica').fontSize(9);
        (purchase.items||[]).forEach((item: any, idx: number) => {
          const rowY = tableTop + 22 + idx * 20;
          if (idx%2===0) doc.rect(40, rowY, doc.page.width-80, 20).fill('#f9fafb');
          doc.fillColor('#000').text(`${idx+1}`, cols[0], rowY+5).text(item.productName||'', cols[1], rowY+5, {width:100}).text(`${item.quantity}`, cols[2], rowY+5).text(this.fmt(item.unitPrice), cols[3], rowY+5).text(`${item.tva||0}%`, cols[4], rowY+5).text(this.fmt(item.totalTTC), cols[5], rowY+5);
        });
        const totY = tableTop + 22 + (purchase.items?.length||0)*20+15;
        doc.rect(350, totY, 210, 80).stroke('#1e3a5f');
        doc.fontSize(10).font('Helvetica').text('Total HT:', 360, totY+8).text(this.fmt(purchase.totalHT), 480, totY+8).text('Total TTC:', 360, totY+25).text(this.fmt(purchase.totalTTC), 480, totY+25).text('Payé:', 360, totY+45).text(this.fmt(purchase.amountPaid), 480, totY+45);
        if (purchase.amountRemaining>0) doc.fillColor('#cc0000').text('Reste:', 360, totY+62).text(this.fmt(purchase.amountRemaining), 480, totY+62);
        this.addPdfFooter(doc, company);
        doc.end();
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  BILAN CLIENT PDF
  // ══════════════════════════════════════════════════════════
  async generateClientBilanPdf(client: any, sales: any[], startDate: string, endDate: string, companyId: string): Promise<Buffer> {
    const company = await this.getCompany(companyId);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, bufferPages: true });
      const buffers: Buffer[] = [];
      doc.on('data', d => buffers.push(d));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      this.addPdfHeader(doc, company, 'RELEVÉ CLIENT').then(() => {
        doc.fontSize(12).font('Helvetica-Bold').text(`Client: ${client.name}`);
        doc.fontSize(10).font('Helvetica').text(`Tél: ${client.phone || '—'}  |  Email: ${client.email || '—'}`);
        if (startDate || endDate) doc.text(`Période: ${startDate ? this.fmtDate(startDate) : '—'} → ${endDate ? this.fmtDate(endDate) : '—'}`);
        doc.moveDown(1);

        const totalTTC = sales.reduce((s: number, v: any) => s + v.totalTTC, 0);
        const totalPaid = sales.reduce((s: number, v: any) => s + v.amountPaid, 0);
        const totalRemaining = sales.reduce((s: number, v: any) => s + v.amountRemaining, 0);
        doc.rect(40, doc.y, doc.page.width - 80, 55).fill('#f0f4f8');
        const summaryY = doc.y;
        doc.fillColor('#000').font('Helvetica-Bold').text(`Total facturé: ${this.fmt(totalTTC)}`, 60, summaryY + 8);
        doc.text(`Total payé: ${this.fmt(totalPaid)}`, 60, summaryY + 24);
        doc.fillColor(totalRemaining > 0 ? '#cc0000' : '#007700').text(`Solde: ${this.fmt(totalRemaining)}`, 60, summaryY + 40);
        doc.fillColor('#000').moveDown(3);

        const tableTop = doc.y;
        const cols = [40, 130, 260, 350, 430, 510];
        doc.rect(40, tableTop, doc.page.width - 80, 20).fill('#1e3a5f');
        ['Date', 'N°', 'Montant TTC', 'Payé', 'Reste', 'Statut'].forEach((h, i) => doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8).text(h, cols[i], tableTop+5, { width:(cols[i+1]||560)-cols[i] }));
        doc.fillColor('#000').font('Helvetica').fontSize(8);
        sales.forEach((s: any, idx: number) => {
          const rowY = tableTop + 20 + idx * 18;
          if (idx%2===0) doc.rect(40, rowY, doc.page.width - 80, 18).fill('#f9fafb');
          doc.fillColor('#000').text(this.fmtDate(s.createdAt), cols[0], rowY+4).text(s._id?.toString().slice(-6).toUpperCase(), cols[1], rowY+4).text(this.fmt(s.totalTTC), cols[2], rowY+4).text(this.fmt(s.amountPaid), cols[3], rowY+4);
          doc.fillColor(s.amountRemaining > 0 ? '#cc0000' : '#007700').text(this.fmt(s.amountRemaining), cols[4], rowY+4);
          doc.fillColor('#000').text(s.status?.toUpperCase(), cols[5], rowY+4);
        });
        this.addPdfFooter(doc, company);
        doc.end();
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  BILAN CLIENT EXCEL
  // ══════════════════════════════════════════════════════════
  async generateClientBilanExcel(client: any, sales: any[], startDate: string, endDate: string, companyId: string): Promise<Buffer> {
    const company = await this.getCompany(companyId);
    const wb = new ExcelJS.Workbook();
    wb.creator = company?.name || 'ERP';
    const ws = wb.addWorksheet('Relevé');

    ws.mergeCells('A1:F1');
    ws.getCell('A1').value = `${company?.name || 'ERP'} — RELEVÉ CLIENT`;
    ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } };
    ws.getCell('A1').alignment = { horizontal: 'center' };
    ws.getRow(1).height = 28;

    ws.addRow(['Client:', client.name, '', 'Tél:', client.phone || '—']);
    if (startDate || endDate) ws.addRow(['Période:', `${startDate || '—'} → ${endDate || '—'}`]);
    ws.addRow([]);

    const totRow = ws.addRow(['Total TTC:', sales.reduce((s: number, v: any) => s + v.totalTTC, 0), 'Payé:', sales.reduce((s: number, v: any) => s + v.amountPaid, 0), 'Solde:', sales.reduce((s: number, v: any) => s + v.amountRemaining, 0)]);
    totRow.eachCell(c => { c.font = { bold: true }; });
    ws.addRow([]);

    const headerRow = ws.addRow(['Date', 'N° Facture', 'Total TTC', 'Payé', 'Reste', 'Statut']);
    headerRow.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } }; });

    sales.forEach((s: any, idx: number) => {
      const r = ws.addRow([this.fmtDate(s.createdAt), s._id?.toString().slice(-6).toUpperCase(), s.totalTTC, s.amountPaid, s.amountRemaining, s.status]);
      if (idx%2===0) r.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }; });
      if (s.amountRemaining > 0) r.getCell(5).font = { color: { argb: 'FFCC0000' } };
    });

    ws.columns = [{ width: 15 }, { width: 15 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 12 }];
    return (wb.xlsx.writeBuffer() as unknown) as Promise<Buffer>;
  }

  // ══════════════════════════════════════════════════════════
  //  RAPPORT VENTES PDF
  // ══════════════════════════════════════════════════════════
  async generateSalesReportPdf(report: any, companyId: string): Promise<Buffer> {
    const company = await this.getCompany(companyId);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, bufferPages: true });
      const buffers: Buffer[] = [];
      doc.on('data', d => buffers.push(d));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      this.addPdfHeader(doc, company, 'RAPPORT DES VENTES').then(() => {
        if (report.period?.startDate || report.period?.endDate) {
          doc.fontSize(10).font('Helvetica').text(`Période: ${this.fmtDate(report.period.startDate)} → ${this.fmtDate(report.period.endDate)}`);
        }
        doc.moveDown(0.5);
        doc.rect(40, doc.y, doc.page.width-80, 55).fill('#f0f4f8');
        const sy = doc.y;
        doc.fillColor('#000').font('Helvetica-Bold').fontSize(11)
           .text(`Total TTC: ${this.fmt(report.totals?.total)}`, 60, sy+8)
           .text(`Total Payé: ${this.fmt(report.totals?.paid)}`, 60, sy+25)
           .text(`Total Reste: ${this.fmt(report.totals?.remaining)}`, 60, sy+42)
           .text(`Nombre de ventes: ${report.count}`, 300, sy+8);
        doc.moveDown(4);

        const tableTop = doc.y;
        const cols = [40, 130, 260, 350, 430, 500];
        doc.rect(40, tableTop, doc.page.width-80, 20).fill('#1e3a5f');
        ['Date', 'Client', 'TTC', 'Payé', 'Reste', 'Vendeur'].forEach((h,i) => doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8).text(h, cols[i], tableTop+5, {width:(cols[i+1]||560)-cols[i]}));
        doc.fillColor('#000').font('Helvetica').fontSize(8);
        (report.sales||[]).forEach((s: any, idx: number) => {
          const rowY = tableTop+20+idx*18;
          if (idx%2===0) doc.rect(40, rowY, doc.page.width-80, 18).fill('#f9fafb');
          doc.fillColor('#000').text(this.fmtDate(s.createdAt), cols[0], rowY+4).text(s.clientName||'—', cols[1], rowY+4, {width:120}).text(this.fmt(s.totalTTC), cols[2], rowY+4).text(this.fmt(s.amountPaid), cols[3], rowY+4);
          doc.fillColor(s.amountRemaining>0?'#cc0000':'#007700').text(this.fmt(s.amountRemaining), cols[4], rowY+4);
          doc.fillColor('#000').text(s.createdByName||'—', cols[5], rowY+4, {width:70});
        });
        this.addPdfFooter(doc, company);
        doc.end();
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  RAPPORT VENTES EXCEL
  // ══════════════════════════════════════════════════════════
  async generateSalesReportExcel(report: any, companyId: string): Promise<Buffer> {
    const company = await this.getCompany(companyId);
    const wb = new ExcelJS.Workbook();
    wb.creator = company?.name || 'ERP';
    const ws = wb.addWorksheet('Rapport Ventes');

    ws.mergeCells('A1:G1');
    ws.getCell('A1').value = `${company?.name || 'ERP'} — RAPPORT DES VENTES`;
    ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } };
    ws.getCell('A1').alignment = { horizontal: 'center' };
    ws.getRow(1).height = 28;

    ws.addRow(['Période:', `${report.period?.startDate || '—'} → ${report.period?.endDate || '—'}`, '', 'Ventes:', report.count]);
    ws.addRow(['Total TTC:', report.totals?.total, 'Payé:', report.totals?.paid, 'Reste:', report.totals?.remaining]);
    ws.addRow([]);

    const headerRow = ws.addRow(['Date', 'Client', 'Total TTC', 'Payé', 'Reste', 'Statut', 'Vendeur']);
    headerRow.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } }; });

    (report.sales||[]).forEach((s: any, idx: number) => {
      const r = ws.addRow([this.fmtDate(s.createdAt), s.clientName, s.totalTTC, s.amountPaid, s.amountRemaining, s.status, s.createdByName]);
      if (idx%2===0) r.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }; });
      if (s.amountRemaining > 0) r.getCell(5).font = { color: { argb: 'FFCC0000' } };
    });

    ws.columns = [{width:15},{width:25},{width:18},{width:18},{width:18},{width:12},{width:20}];
    return (wb.xlsx.writeBuffer() as unknown) as Promise<Buffer>;
  }
}
