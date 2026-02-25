import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Return, ReturnDocument, ReturnStatus } from './return.schema';

@Injectable()
export class ReturnsService {
  constructor(@InjectModel(Return.name) private returnModel: Model<ReturnDocument>) {}

  async create(dto: any, userId: string, userName: string, companyId: string): Promise<ReturnDocument> {
    const totalRefund = (dto.items || []).reduce((s: number, i: any) => s + (i.totalTTC || 0), 0);
    const r = new this.returnModel({ ...dto, totalRefund, saleId: new Types.ObjectId(dto.saleId), clientId: dto.clientId ? new Types.ObjectId(dto.clientId) : undefined, companyId: new Types.ObjectId(companyId), createdBy: new Types.ObjectId(userId), createdByName: userName });
    return r.save();
  }

  async findAll(companyId: string, query?: any): Promise<ReturnDocument[]> {
    const filter: any = { companyId: new Types.ObjectId(companyId) };
    if (query?.status) filter.status = query.status;
    if (query?.search) filter.clientName = { $regex: query.search, $options: 'i' };
    return this.returnModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, companyId: string): Promise<ReturnDocument> {
    const r = await this.returnModel.findOne({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!r) throw new NotFoundException('Retour introuvable');
    return r;
  }

  async updateStatus(id: string, companyId: string, status: ReturnStatus): Promise<ReturnDocument> {
    const r = await this.returnModel.findOneAndUpdate({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) }, { status }, { new: true });
    if (!r) throw new NotFoundException('Retour introuvable');
    return r;
  }

  async remove(id: string, companyId: string): Promise<void> {
    const r = await this.returnModel.findOneAndDelete({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!r) throw new NotFoundException('Retour introuvable');
  }
}
