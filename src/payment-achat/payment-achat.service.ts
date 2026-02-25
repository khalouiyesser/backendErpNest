import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentAchat, PaymentAchatDocument } from './entities/payment-achat.entity';

@Injectable()
export class PaymentAchatService {
  constructor(@InjectModel(PaymentAchat.name) private model: Model<PaymentAchatDocument>) {}

  async createFromAchat(userId: string, fournisseurId: string, amount: number, achatId: string, companyId: string): Promise<PaymentAchatDocument> {
    const p = new this.model({ userId: new Types.ObjectId(userId), fournisseurId: new Types.ObjectId(fournisseurId), amount, achatId: new Types.ObjectId(achatId), companyId: new Types.ObjectId(companyId) });
    return p.save();
  }

  async findAll(companyId: string): Promise<PaymentAchatDocument[]> {
    return this.model.find({ companyId: new Types.ObjectId(companyId) }).sort({ createdAt: -1 }).exec();
  }

  async remove(id: string, companyId: string): Promise<void> {
    await this.model.findOneAndDelete({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
  }
}
