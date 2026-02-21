import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quote, QuoteDocument } from './quote.schema';

@Injectable()
export class QuotesService {
  constructor(@InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>) {}

  async create(dto: any, userId: string): Promise<QuoteDocument> {
    let totalHT = 0, totalTTC = 0;
    const items = (dto.items || []).map((item: any) => {
      const tva = item.tva || 0;
      const lineHT = item.quantity * item.unitPrice;
      const lineTTC = lineHT * (1 + tva / 100);
      totalHT += lineHT; totalTTC += lineTTC;
      return { ...item, productId: item.productId ? new Types.ObjectId(item.productId) : undefined, tva, totalHT: lineHT, totalTTC: lineTTC };
    });
    const quote = new this.quoteModel({ ...dto, items, totalHT, totalTTC, userId: new Types.ObjectId(userId) });
    return quote.save();
  }

  async findAll(userId: string, query?: any): Promise<QuoteDocument[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query?.search) filter.$or = [{ clientName: { $regex: query.search, $options: 'i' } }];
    if (query?.status) filter.status = query.status;
    const sort: any = query?.sortBy ? { [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };
    return this.quoteModel.find(filter).sort(sort).exec();
  }

  async findOne(id: string, userId: string): Promise<QuoteDocument> {
    const q = await this.quoteModel.findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) });
    if (!q) throw new NotFoundException('Quote not found');
    return q;
  }

  async update(id: string, userId: string, dto: any): Promise<QuoteDocument> {
    const q = await this.quoteModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) }, dto, { new: true }
    );
    if (!q) throw new NotFoundException('Quote not found');
    return q;
  }

  async remove(id: string, userId: string): Promise<void> {
    const q = await this.quoteModel.findOneAndDelete({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) });
    if (!q) throw new NotFoundException('Quote not found');
  }
}
