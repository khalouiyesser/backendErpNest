import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quote, QuoteDocument, QuoteStatus } from './quote.schema';

@Injectable()
export class QuotesService {
  constructor(@InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>) {}

  async create(dto: any, userId: string, userName: string, companyId: string): Promise<QuoteDocument> {
    let totalHT = 0, totalTTC = 0;
    const items = (dto.items || []).map((item: any) => {
      const tva = item.tva || 0;
      const lineHT = item.quantity * item.unitPrice;
      const lineTTC = lineHT * (1 + tva / 100);
      totalHT += lineHT; totalTTC += lineTTC;
      return { ...item, productId: item.productId ? new Types.ObjectId(item.productId) : undefined, tva, totalHT: lineHT, totalTTC: lineTTC };
    });
    const quote = new this.quoteModel({ ...dto, items, totalHT, totalTTC, companyId: new Types.ObjectId(companyId), createdBy: new Types.ObjectId(userId), createdByName: userName });
    return quote.save();
  }

  async findAll(companyId: string, query?: any): Promise<QuoteDocument[]> {
    const filter: any = { companyId: new Types.ObjectId(companyId) };
    if (query?.search) filter.$or = [{ clientName: { $regex: query.search, $options: 'i' } }, { createdByName: { $regex: query.search, $options: 'i' } }];
    if (query?.status) filter.status = query.status;
    return this.quoteModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, companyId: string): Promise<QuoteDocument> {
    const q = await this.quoteModel.findOne({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!q) throw new NotFoundException('Devis introuvable');
    return q;
  }

  async update(id: string, companyId: string, dto: any): Promise<QuoteDocument> {
    const q = await this.quoteModel.findOneAndUpdate({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) }, dto, { new: true });
    if (!q) throw new NotFoundException('Devis introuvable');
    return q;
  }

  async remove(id: string, companyId: string): Promise<void> {
    const q = await this.quoteModel.findOneAndDelete({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!q) throw new NotFoundException('Devis introuvable');
  }

  async convertToSale(id: string, companyId: string): Promise<any> {
    const quote = await this.findOne(id, companyId);
    if (quote.status === QuoteStatus.REJECTED || quote.status === QuoteStatus.EXPIRED)
      throw new BadRequestException('Ce devis est rejeté ou expiré');
    if (!quote.clientId) throw new BadRequestException('Assignez un client avant de convertir');
    await this.update(id, companyId, { status: QuoteStatus.ACCEPTED });
    return {
      message: 'Devis accepté. Utilisez ces données pour créer la vente.',
      saleData: { clientId: quote.clientId?.toString(), clientName: quote.clientName, items: quote.items, totalHT: quote.totalHT, totalTTC: quote.totalTTC, notes: quote.notes, quoteId: (quote._id as any).toString() },
    };
  }
}
