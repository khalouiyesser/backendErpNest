import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Company, CompanyDocument } from '../company/company.schema';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    private configService: ConfigService,
  ) {}

  // ── Vérification et décrémentation du quota OCR (400/mois par company) ──
  private async checkAndDecrementOcr(companyId: string): Promise<void> {
    const company = await this.companyModel.findById(companyId);
    if (!company) throw new BadRequestException('Company introuvable');

    const now = new Date();
    if (!company.ocrResetAt || this.isNewMonth(company.ocrResetAt, now)) {
      company.ocrAttemptsLeft = company.ocrLimitPerMonth || 400;
      company.ocrResetAt = now;
      await company.save();
    }

    if (company.ocrAttemptsLeft <= 0) {
      throw new BadRequestException(
        `Quota OCR mensuel épuisé (${company.ocrLimitPerMonth}/mois). Se réinitialise le 1er du mois.`,
      );
    }

    company.ocrAttemptsLeft -= 1;
    await company.save();
  }

  // ── Appel OCR Space API (commun) ─────────────────────────────────────────
  private async callOcrSpace(formPayload: Record<string, string>): Promise<string> {
    const apiKey = this.configService.get<string>('OCR_SPACE_API_KEY');

    // Utilisation de fetch natif (Node 18+) ou fallback XMLHttpRequest-style via URLSearchParams
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(formPayload)) params.append(k, v);
    params.append('apikey', apiKey);
    params.append('language', 'fre');
    params.append('isOverlayRequired', 'false');
    params.append('detectOrientation', 'true');
    params.append('scale', 'true');
    params.append('OCREngine', '2');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: params,
    });

    if (!response.ok) throw new BadRequestException(`OCR API HTTP error: ${response.status}`);

    const data: any = await response.json();
    if (data.IsErroredOnProcessing) {
      throw new BadRequestException(`OCR error: ${(data.ErrorMessage || []).join(', ')}`);
    }

    return data.ParsedResults?.[0]?.ParsedText || '';
  }

  // ── Analyse depuis URL ────────────────────────────────────────────────────
  async analyzeFromUrl(imageUrl: string, companyId: string): Promise<any> {
    await this.checkAndDecrementOcr(companyId);
    try {
      const text = await this.callOcrSpace({ url: imageUrl });
      return this.extractChargeFields(text);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`OCR URL failed: ${err.message}`);
      throw new BadRequestException("Impossible d'analyser le document. Vérifiez l'URL.");
    }
  }

  // ── Analyse depuis base64 ─────────────────────────────────────────────────
  async analyzeFromBase64(base64: string, mimeType: string, companyId: string): Promise<any> {
    await this.checkAndDecrementOcr(companyId);
    try {
      const text = await this.callOcrSpace({ base64Image: `data:${mimeType};base64,${base64}` });
      return this.extractChargeFields(text);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`OCR base64 failed: ${err.message}`);
      throw new BadRequestException("Impossible d'analyser l'image.");
    }
  }

  // ── Extraction intelligente des champs d'une charge ──────────────────────
  private extractChargeFields(text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Montant TTC
    let amount: number | null = null;
    const amountPatterns = [
      /(?:total\s*ttc|montant\s*ttc|net\s*à\s*payer|total\s*général|total\s*facture)[:\s]*([0-9]+[.,][0-9]+)/i,
      /(?:total|montant)[:\s]*([0-9]+[.,][0-9]+)\s*(?:tnd|dt|dinar)?/i,
      /([0-9]+[.,][0-9]{3})\s*(?:tnd|dt)/i,
    ];
    for (const p of amountPatterns) {
      const m = text.match(p);
      if (m) { amount = parseFloat(m[1].replace(',', '.')); break; }
    }

    // Montant HT
    let amountHT: number | null = null;
    for (const p of [/(?:total\s*ht|montant\s*ht|base\s*ht)[:\s]*([0-9]+[.,][0-9]+)/i]) {
      const m = text.match(p);
      if (m) { amountHT = parseFloat(m[1].replace(',', '.')); break; }
    }

    // TVA
    let tva: number | null = null;
    const tvaMatch = text.match(/tva\s*(?:à|au|de)?\s*([0-9]+)\s*%/i);
    if (tvaMatch) tva = parseInt(tvaMatch[1]);
    else if (text.match(/19\s*%/)) tva = 19;
    else if (text.match(/7\s*%/)) tva = 7;

    // Date
    let date: string | null = null;
    for (const p of [/(?:date[:\s]*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i, /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/]) {
      const m = text.match(p);
      if (m) {
        try {
          const parts = m[1].split(/[\/\-\.]/);
          if (parts.length === 3) {
            const [a, b, c] = parts;
            date = c.length === 4 ? `${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}` : m[1];
          }
        } catch { date = m[1]; }
        break;
      }
    }

    // Référence facture
    let source: string | null = null;
    const sourceMatch = text.match(/(?:facture\s*n[°o]?|invoice\s*#?|bon\s*n[°o]?)[:\s]*([A-Z0-9\-\/]+)/i);
    if (sourceMatch) source = sourceMatch[1].trim();

    // Description
    let description = '';
    for (const p of [/(?:objet|désignation|description|libellé)[:\s]*(.+)/i]) {
      const m = text.match(p);
      if (m) { description = m[1].trim().substring(0, 100); break; }
    }
    if (!description && lines.length > 0) {
      description = (lines.find(l => l.length > 10 && !/^\d/.test(l)) || lines[0]).substring(0, 100);
    }

    // Type de charge
    let type = 'other';
    const lower = text.toLowerCase();
    if (/loyer|location|bail/.test(lower)) type = 'rent';
    else if (/salaire|paie|rémunération/.test(lower)) type = 'salary';
    else if (/electricité|eau|gaz|téléphone|internet|sonede|steg/.test(lower)) type = 'utilities';
    else if (/équipement|matériel|mobilier|informatique/.test(lower)) type = 'equipment';
    else if (/publicité|marketing|communication/.test(lower)) type = 'marketing';
    else if (/assurance/.test(lower)) type = 'insurance';
    else if (/taxe|impôt|tva|patente/.test(lower)) type = 'tax';

    return {
      rawText: text,
      suggestion: { description: description || 'Charge (OCR)', amount, date, source, type, tva, amountHT },
    };
  }

  async getOcrStatus(companyId: string) {
    const company = await this.companyModel.findById(companyId).lean();
    if (!company) throw new BadRequestException('Company introuvable');
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysLeft = Math.ceil((nextMonth.getTime() - now.getTime()) / 86400000);
    return {
      ocrAttemptsLeft: company.ocrAttemptsLeft,
      ocrLimitPerMonth: company.ocrLimitPerMonth,
      ocrResetAt: company.ocrResetAt,
      nextResetInDays: daysLeft,
    };
  }

  private isNewMonth(lastReset: Date, now: Date): boolean {
    return lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
  }
}
