import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentVente, PaymentVenteDocument } from './entities/payment-vente.entity';

@Injectable()
export class PaymentVenteService {
  constructor(@InjectModel(PaymentVente.name) private model: Model<PaymentVenteDocument>) {}

  async createFromVente(userId: string, clientId: string, amount: number, venteId: string, note: string, companyId: string): Promise<PaymentVenteDocument> {
    const p = new this.model({ userId: new Types.ObjectId(userId), clientId: new Types.ObjectId(clientId), amount, venteId: new Types.ObjectId(venteId), note, companyId: new Types.ObjectId(companyId) });
    return p.save();
  }

  async findAll(companyId: string): Promise<PaymentVenteDocument[]> {
    return this.model.find({ companyId: new Types.ObjectId(companyId) }).sort({ createdAt: -1 }).exec();
  }

  async findByClient(clientId: string, companyId: string): Promise<PaymentVenteDocument[]> {
    return this.model.find({ clientId: new Types.ObjectId(clientId), companyId: new Types.ObjectId(companyId) }).sort({ createdAt: -1 }).exec();
  }
}
