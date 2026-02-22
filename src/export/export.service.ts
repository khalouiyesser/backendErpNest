import { Injectable } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');
import * as ExcelJS from 'exceljs';

const TND  = (v: number) => `${(v || 0).toFixed(3)} TND`;
const DATE = (d: any)    => (d ? new Date(d).toLocaleDateString('fr-TN') : '—');

const COMPANY = {
  name:    process.env.COMPANY_NAME    || 'Mon Entreprise',
  address: process.env.COMPANY_ADDRESS || 'Tunis, Tunisie',
  phone:   process.env.COMPANY_PHONE   || '+216 XX XXX XXX',
  mf:      process.env.COMPANY_MF      || 'MF-XXXXXXX/X/X/X/XXX',
  rne:     process.env.COMPANY_RNE     || '',
};

@Injectable()
export class ExportService {

  private _rowCount = 0;

  // ══════════════════════════════════════════════════════════════════
  //  FACTURE VENTE
  // ══════════════════════════════════════════════════════════════════
  async generateSaleInvoicePdf(sale: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.on('data',  (c: Buffer) => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this._rowCount = 0;
      this._drawInvoiceHeader(doc, `FACTURE N° ${sale._id?.toString().slice(-8).toUpperCase()}`, sale.createdAt);
      this._drawClientBlock(doc, sale.clientName, '');
      this._drawItemsTable(doc, sale.items || []);
      this._drawTotals(doc, sale);
      this._drawLegalFooter(doc);
      doc.end();
    });
  }

  // ══════════════════════════════════════════════════════════════════
  //  FACTURE ACHAT
  // ══════════════════════════════════════════════════════════════════
  async generatePurchaseInvoicePdf(purchase: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.on('data',  (c: Buffer) => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this._rowCount = 0;
      this._drawInvoiceHeader(doc, `BON DE COMMANDE N° ${purchase._id?.toString().slice(-8).toUpperCase()}`, purchase.createdAt);
      this._drawClientBlock(doc, purchase.FournisseurName || purchase.fournisseurName || '—', 'Fournisseur');
      this._drawItemsTable(doc, purchase.items || []);
      this._drawTotals(doc, purchase);
      this._drawLegalFooter(doc);
      doc.end();
    });
  }

  // ══════════════════════════════════════════════════════════════════
  //  BILAN CLIENT PDF
  // ══════════════════════════════════════════════════════════════════
  async generateClientBilanPdf(
      client: any,
      sales: any[],
      startDate: string,
      endDate: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.on('data',  (c: Buffer) => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this._rowCount = 0;

      this._drawInvoiceHeader(doc, 'BILAN CLIENT', new Date());
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#374151');
      doc.text(`Client : ${client.name}${client.firstName ? ' ' + client.firstName : ''}`, 50, doc.y);
      doc.text(`Téléphone : ${client.phone}`);
      if (client.email) doc.text(`Email : ${client.email}`);
      doc.text(`Période : ${DATE(startDate)} → ${DATE(endDate)}`);
      doc.moveDown();

      const totalTTC       = sales.reduce((s, v) => s + (v.totalTTC || 0), 0);
      const totalPaid      = sales.reduce((s, v) => s + (v.amountPaid || 0), 0);
      const totalRemaining = totalTTC - totalPaid;

      doc.fontSize(11).fillColor('#1e40af').font('Helvetica-Bold');
      doc.rect(50, doc.y, 495, 50).fill('#EFF6FF');
      const statsY = doc.y - 45;
      doc.fillColor('#1e40af').text(`CA Total: ${TND(totalTTC)}`,     60,  statsY + 10);
      doc.fillColor('#16a34a').text(`Payé: ${TND(totalPaid)}`,        230, statsY + 10);
      doc.fillColor('#dc2626').text(`Reste: ${TND(totalRemaining)}`,  380, statsY + 10);
      doc.font('Helvetica').fillColor('#374151');
      doc.moveDown(2.5);

      if (sales.length === 0) {
        doc.text('Aucune vente sur cette période.', { align: 'center' });
      } else {
        const headers = ['Date', 'Total TTC', 'Payé', 'Reste', 'Statut'];
        const colW    = [100, 110, 110, 110, 75];
        this._drawTableHeader(doc, headers, colW);
        for (const s of sales) {
          const lbl = ({ paid: 'Payé', partial: 'Partiel', pending: 'En attente' } as Record<string, string>)[s.status] ?? s.status;
          this._drawTableRow(doc, [DATE(s.createdAt), TND(s.totalTTC), TND(s.amountPaid), TND(s.amountRemaining), lbl], colW);
        }
      }

      this._drawLegalFooter(doc);
      doc.end();
    });
  }

  // ══════════════════════════════════════════════════════════════════
  //  BILAN CLIENT EXCEL
  // ══════════════════════════════════════════════════════════════════
  async generateClientBilanExcel(
      client: any,
      sales: any[],
      startDate: string,
      endDate: string,
  ): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = COMPANY.name;
    const ws = wb.addWorksheet('Bilan Client');

    ws.mergeCells('A1:F1');
    ws.getCell('A1').value     = `BILAN CLIENT — ${client.name}`;
    ws.getCell('A1').font      = { bold: true, size: 14, color: { argb: 'FF1E40AF' } };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.getCell('A2').value = `Période: ${DATE(startDate)} → ${DATE(endDate)}`;
    ws.getCell('A2').font  = { italic: true };

    const totalTTC  = sales.reduce((s, v) => s + (v.totalTTC || 0), 0);
    const totalPaid = sales.reduce((s, v) => s + (v.amountPaid || 0), 0);
    ws.getCell('A3').value = `CA Total: ${TND(totalTTC)} | Payé: ${TND(totalPaid)} | Reste: ${TND(totalTTC - totalPaid)}`;

    const headerRow = ws.addRow(['Date', 'Client', 'Total HT', 'TVA', 'Total TTC', 'Montant Payé', 'Reste', 'Statut']);
    headerRow.eachCell((cell) => {
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.alignment = { horizontal: 'center' };
      cell.border    = { bottom: { style: 'thin' } };
    });

    for (const s of sales) {
      const lbl = ({ paid: 'Payé', partial: 'Partiel', pending: 'En attente' } as Record<string, string>)[s.status] ?? s.status;
      const row = ws.addRow([
        s.createdAt ? new Date(s.createdAt) : '',
        client.name,
        s.totalHT || 0,
        (s.totalTTC || 0) - (s.totalHT || 0),
        s.totalTTC || 0,
        s.amountPaid || 0,
        s.amountRemaining || 0,
        lbl,
      ]);
      row.getCell(1).numFmt = 'dd/mm/yyyy';
      for (let i = 3; i <= 7; i++) row.getCell(i).numFmt = '#,##0.000';
    }

    ws.columns = [
      { width: 14 }, { width: 20 }, { width: 15 }, { width: 12 },
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 14 },
    ];

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  // ══════════════════════════════════════════════════════════════════
  //  RAPPORT VENTES PDF
  // ══════════════════════════════════════════════════════════════════
  async generateSalesReportPdf(sales: any[], startDate?: string, endDate?: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.on('data',  (c: Buffer) => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this._rowCount = 0;

      this._drawInvoiceHeader(doc, 'RAPPORT DES VENTES', new Date());
      if (startDate && endDate) {
        doc.moveDown(0.5).fontSize(10).fillColor('#6b7280')
            .text(`Période : ${DATE(startDate)} → ${DATE(endDate)}`, { align: 'center' });
      }

      const totalTTC  = sales.reduce((s, v) => s + (v.totalTTC || 0), 0);
      const totalPaid = sales.reduce((s, v) => s + (v.amountPaid || 0), 0);
      doc.moveDown().fontSize(11).fillColor('#374151')
          .text(`Total: ${TND(totalTTC)} | Encaissé: ${TND(totalPaid)} | Reste: ${TND(totalTTC - totalPaid)}`);
      doc.moveDown();

      const headers = ['Date', 'Client', 'Total TTC', 'Payé', 'Reste', 'Statut'];
      const colW    = [90, 120, 95, 80, 80, 80];
      this._drawTableHeader(doc, headers, colW);
      for (const s of sales) {
        const lbl = ({ paid: 'Payé', partial: 'Partiel', pending: 'En attente' } as Record<string, string>)[s.status] ?? s.status;
        this._drawTableRow(doc, [DATE(s.createdAt), s.clientName || '—', TND(s.totalTTC), TND(s.amountPaid), TND(s.amountRemaining), lbl], colW);
      }

      this._drawLegalFooter(doc);
      doc.end();
    });
  }

  // ══════════════════════════════════════════════════════════════════
  //  RAPPORT VENTES EXCEL
  // ══════════════════════════════════════════════════════════════════
  async generateSalesReportExcel(sales: any[], startDate?: string, endDate?: string): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = COMPANY.name;
    const ws = wb.addWorksheet('Rapport Ventes');

    ws.mergeCells('A1:I1');
    ws.getCell('A1').value     = 'RAPPORT DES VENTES';
    ws.getCell('A1').font      = { bold: true, size: 14, color: { argb: 'FF1E40AF' } };
    ws.getCell('A1').alignment = { horizontal: 'center' };
    if (startDate && endDate) {
      ws.getCell('A2').value = `Période: ${DATE(startDate)} → ${DATE(endDate)}`;
    }

    const hRow = ws.addRow(['Date', 'Client', 'Total HT (TND)', 'TVA (TND)', 'Total TTC (TND)', 'Payé (TND)', 'Reste (TND)', 'Mode', 'Statut']);
    hRow.eachCell((cell) => {
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.alignment = { horizontal: 'center' };
    });

    for (const s of sales) {
      const lbl = ({ paid: 'Payé', partial: 'Partiel', pending: 'En attente' } as Record<string, string>)[s.status] ?? s.status;
      const row = ws.addRow([
        s.createdAt ? new Date(s.createdAt) : '',
        s.clientName || '—',
        s.totalHT || 0,
        (s.totalTTC || 0) - (s.totalHT || 0),
        s.totalTTC || 0,
        s.amountPaid || 0,
        s.amountRemaining || 0,
        s.paymentMethod || '—',
        lbl,
      ]);
      row.getCell(1).numFmt = 'dd/mm/yyyy';
      for (let i = 3; i <= 7; i++) row.getCell(i).numFmt = '#,##0.000';
    }

    ws.addRow([]);
    const totalRow = ws.addRow([
      'TOTAL', '',
      sales.reduce((s, v) => s + (v.totalHT || 0), 0),
      sales.reduce((s, v) => s + ((v.totalTTC || 0) - (v.totalHT || 0)), 0),
      sales.reduce((s, v) => s + (v.totalTTC || 0), 0),
      sales.reduce((s, v) => s + (v.amountPaid || 0), 0),
      sales.reduce((s, v) => s + (v.amountRemaining || 0), 0),
    ]);
    totalRow.font = { bold: true };
    totalRow.eachCell((cell, i) => { if (i >= 3 && i <= 7) cell.numFmt = '#,##0.000'; });

    ws.columns = [
      { width: 14 }, { width: 22 }, { width: 16 }, { width: 13 },
      { width: 16 }, { width: 14 }, { width: 14 }, { width: 13 }, { width: 13 },
    ];

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  // ══════════════════════════════════════════════════════════════════
  //  RAPPORT ACHATS EXCEL
  // ══════════════════════════════════════════════════════════════════
  async generatePurchasesReportExcel(purchases: any[], startDate?: string, endDate?: string): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Rapport Achats');

    ws.mergeCells('A1:G1');
    ws.getCell('A1').value     = 'RAPPORT DES ACHATS';
    ws.getCell('A1').font      = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };
    if (startDate && endDate) {
      ws.getCell('A2').value = `Période: ${DATE(startDate)} → ${DATE(endDate)}`;
    }

    const hRow = ws.addRow(['Date', 'Fournisseur', 'Total HT (TND)', 'TVA (TND)', 'Total TTC (TND)', 'Payé (TND)', 'Reste (TND)']);
    hRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    });

    for (const p of purchases) {
      const row = ws.addRow([
        p.createdAt ? new Date(p.createdAt) : '',
        p.FournisseurName || p.fournisseurName || '—',
        p.totalHT || 0,
        (p.totalTTC || 0) - (p.totalHT || 0),
        p.totalTTC || 0,
        p.amountPaid || 0,
        p.amountRemaining || 0,
      ]);
      row.getCell(1).numFmt = 'dd/mm/yyyy';
      for (let i = 3; i <= 7; i++) row.getCell(i).numFmt = '#,##0.000';
    }

    ws.columns = [
      { width: 14 }, { width: 22 }, { width: 16 },
      { width: 13 }, { width: 16 }, { width: 14 }, { width: 14 },
    ];

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  // ══════════════════════════════════════════════════════════════════
  //  RAPPORT ACHATS PDF
  // ══════════════════════════════════════════════════════════════════
  async generatePurchasesReportPdf(purchases: any[], startDate?: string, endDate?: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.on('data',  (c: Buffer) => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this._rowCount = 0;

      this._drawInvoiceHeader(doc, 'RAPPORT DES ACHATS', new Date());
      if (startDate && endDate) {
        doc.moveDown(0.5).fontSize(10).fillColor('#6b7280')
            .text(`Période : ${DATE(startDate)} → ${DATE(endDate)}`, { align: 'center' });
      }
      doc.moveDown();

      const headers = ['Date', 'Fournisseur', 'Total TTC', 'Payé', 'Reste'];
      const colW    = [90, 150, 95, 80, 80];
      this._drawTableHeader(doc, headers, colW);
      for (const p of purchases) {
        this._drawTableRow(doc, [
          DATE(p.createdAt),
          p.FournisseurName || '—',
          TND(p.totalTTC),
          TND(p.amountPaid),
          TND(p.amountRemaining),
        ], colW);
      }

      this._drawLegalFooter(doc);
      doc.end();
    });
  }

  // ══════════════════════════════════════════════════════════════════
  //  RAPPORT STOCK EXCEL
  // ══════════════════════════════════════════════════════════════════
  async generateStockReportExcel(products: any[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Stock');

    ws.mergeCells('A1:H1');
    ws.getCell('A1').value     = `ÉTAT DU STOCK — ${new Date().toLocaleDateString('fr-TN')}`;
    ws.getCell('A1').font      = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    const hRow = ws.addRow(['Produit', 'Unité', 'Stock Actuel', 'Seuil Alerte', 'Statut', 'Prix Achat (TND)', 'Prix Vente (TND)', 'Valeur Stock (TND)']);
    hRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
    });

    for (const p of products) {
      const status = p.stockQuantity <= 0
          ? 'Rupture'
          : p.stockThreshold > 0 && p.stockQuantity <= p.stockThreshold
              ? 'Faible'
              : 'OK';
      const row = ws.addRow([
        p.name,
        p.unit || 'unité',
        p.stockQuantity || 0,
        p.stockThreshold || 0,
        status,
        p.purchasePrice || 0,
        p.salePrice || 0,
        (p.stockQuantity || 0) * (p.purchasePrice || 0),
      ]);
      if (p.stockQuantity <= 0) {
        row.getCell(5).font = { color: { argb: 'FFDC2626' }, bold: true };
      } else if (p.stockThreshold > 0 && p.stockQuantity <= p.stockThreshold) {
        row.getCell(5).font = { color: { argb: 'FFD97706' }, bold: true };
      }
      for (let i = 6; i <= 8; i++) row.getCell(i).numFmt = '#,##0.000';
    }

    ws.columns = [
      { width: 25 }, { width: 10 }, { width: 14 }, { width: 14 },
      { width: 12 }, { width: 18 }, { width: 17 }, { width: 18 },
    ];

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  // ══════════════════════════════════════════════════════════════════
  //  RAPPORT STOCK PDF
  // ══════════════════════════════════════════════════════════════════
  async generateStockReportPdf(products: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.on('data',  (c: Buffer) => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this._rowCount = 0;

      this._drawInvoiceHeader(doc, 'ÉTAT DU STOCK', new Date());
      doc.moveDown();

      const headers = ['Produit', 'Stock', 'Seuil', 'P.Vente', 'Valeur', 'Statut'];
      const colW    = [150, 65, 60, 75, 85, 65];
      this._drawTableHeader(doc, headers, colW);
      for (const p of products) {
        const status = p.stockQuantity <= 0
            ? 'RUPTURE'
            : p.stockThreshold > 0 && p.stockQuantity <= p.stockThreshold
                ? 'FAIBLE'
                : 'OK';
        this._drawTableRow(doc, [
          p.name,
          `${p.stockQuantity} ${p.unit || ''}`,
          String(p.stockThreshold || 0),
          TND(p.salePrice),
          TND((p.stockQuantity || 0) * (p.purchasePrice || 0)),
          status,
        ], colW);
      }

      this._drawLegalFooter(doc);
      doc.end();
    });
  }

  // ══════════════════════════════════════════════════════════════════
  //  RAPPORT CHARGES EXCEL
  // ══════════════════════════════════════════════════════════════════
  async generateChargesReportExcel(charges: any[], startDate?: string, endDate?: string): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Charges');

    ws.mergeCells('A1:E1');
    ws.getCell('A1').value     = 'RAPPORT DES CHARGES';
    ws.getCell('A1').font      = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };
    if (startDate && endDate) {
      ws.getCell('A2').value = `Période: ${DATE(startDate)} → ${DATE(endDate)}`;
    }

    const hRow = ws.addRow(['Date', 'Description', 'Catégorie', 'Montant (TND)', 'Notes']);
    hRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } };
    });

    for (const c of charges) {
      const row = ws.addRow([
        c.date ? new Date(c.date) : '',
        c.description || c.name || '—',
        c.category || '—',
        c.amount || 0,
        c.notes || '',
      ]);
      row.getCell(1).numFmt = 'dd/mm/yyyy';
      row.getCell(4).numFmt = '#,##0.000';
    }

    ws.columns = [
      { width: 14 }, { width: 30 }, { width: 18 }, { width: 16 }, { width: 25 },
    ];

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  // ══════════════════════════════════════════════════════════════════
  //  HELPERS PRIVÉS
  // ══════════════════════════════════════════════════════════════════
  private _drawInvoiceHeader(doc: any, title: string, date: any): void {
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af').text(COMPANY.name, 50, 50);
    doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
    doc.text(COMPANY.address);
    doc.text(`Tél: ${COMPANY.phone}`);
    if (COMPANY.mf) doc.text(`Matricule Fiscal: ${COMPANY.mf}`);
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e3a5f');
    doc.text(title, 50, 140, { align: 'center', width: 495 });
    doc.fontSize(10).font('Helvetica').fillColor('#374151');
    doc.text(`Date : ${DATE(date)}`, 50, 180, { align: 'right', width: 495 });
    doc.moveTo(50, 195).lineTo(545, 195).strokeColor('#CBD5E1').lineWidth(1).stroke();
    doc.moveDown(2);
  }

  private _drawClientBlock(doc: any, name: string, label = 'Client'): void {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#374151');
    doc.text(`${label || 'Client'} : ${name}`, 50, doc.y);
    doc.moveDown(0.5);
    doc.font('Helvetica');
  }

  private _drawItemsTable(doc: any, items: any[]): void {
    doc.moveDown();
    const headers = ['Désignation', 'Qté', 'Prix HT', 'TVA%', 'Total TTC'];
    const colW    = [200, 60, 80, 60, 90];
    this._drawTableHeader(doc, headers, colW);
    for (const item of items) {
      const ttc = item.totalTTC || (item.quantity * item.unitPrice * (1 + (item.tva || 0) / 100));
      this._drawTableRow(doc, [
        item.productName || item.name || '—',
        String(item.quantity),
        TND(item.unitPrice),
        `${item.tva || 0}%`,
        TND(ttc),
      ], colW);
    }
  }

  private _drawTotals(doc: any, document_: any): void {
    doc.moveDown(0.5);
    const x = 350;
    doc.fontSize(10).font('Helvetica').fillColor('#374151');
    doc.text('Total HT :', x, doc.y, { width: 100, align: 'left' });
    doc.text(TND(document_.totalHT || 0), x + 100, doc.y - 12, { width: 90, align: 'right' });
    const tva = (document_.totalTTC || 0) - (document_.totalHT || 0);
    doc.text('TVA :', x, doc.y + 2, { width: 100 });
    doc.text(TND(tva), x + 100, doc.y - 12, { width: 90, align: 'right' });
    doc.moveTo(x, doc.y + 2).lineTo(545, doc.y + 2).stroke();
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('Total TTC :', x, doc.y + 5, { width: 100 });
    doc.text(TND(document_.totalTTC || 0), x + 100, doc.y - 14, { width: 90, align: 'right' });
    doc.moveDown(0.5).fontSize(10).font('Helvetica').fillColor('#16a34a');
    doc.text('Montant payé :', x, doc.y, { width: 100 });
    doc.text(TND(document_.amountPaid || 0), x + 100, doc.y - 12, { width: 90, align: 'right' });
    if ((document_.amountRemaining || 0) > 0) {
      doc.fillColor('#dc2626');
      doc.text('Reste à payer :', x, doc.y + 2, { width: 100 });
      doc.text(TND(document_.amountRemaining), x + 100, doc.y - 12, { width: 90, align: 'right' });
    }
  }

  private _drawTableHeader(doc: any, headers: string[], colWidths: number[]): void {
    const rowH   = 22;
    const startY = doc.y;
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    let x        = 50;
    doc.rect(50, startY, totalW, rowH).fill('#1e40af');
    headers.forEach((h, i) => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF')
          .text(h, x + 4, startY + 7, { width: colWidths[i] - 8, align: 'center' });
      x += colWidths[i];
    });
    doc.y = startY + rowH;
    doc.fillColor('#374151').font('Helvetica');
  }

  private _drawTableRow(doc: any, cells: string[], colWidths: number[]): void {
    const rowH   = 20;
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    if (doc.y + rowH > doc.page.height - 80) {
      doc.addPage();
      doc.y = 50;
    }
    const startY = doc.y;
    let x        = 50;
    const bg     = this._rowCount % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
    doc.rect(50, startY, totalW, rowH).fill(bg);
    cells.forEach((cell, i) => {
      doc.fontSize(8).fillColor('#374151').font('Helvetica')
          .text(cell || '—', x + 4, startY + 6, { width: colWidths[i] - 8, align: 'center', lineBreak: false });
      x += colWidths[i];
    });
    doc.rect(50, startY, totalW, rowH).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
    doc.y = startY + rowH;
    this._rowCount++;
  }

  private _drawLegalFooter(doc: any): void {
    const y = doc.page.height - 60;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
    doc.fontSize(8).fillColor('#9CA3AF').font('Helvetica');
    doc.text(
        `Document généré le ${new Date().toLocaleDateString('fr-TN')} par ${COMPANY.name} — ` +
        `Conformément au Code de la TVA Tunisien et aux exigences fiscales en vigueur.`,
        50, y + 8, { width: 495, align: 'center' },
    );
    if (COMPANY.mf) {
      doc.text(`Matricule Fiscal : ${COMPANY.mf}`, 50, y + 20, { width: 495, align: 'center' });
    }
  }
}