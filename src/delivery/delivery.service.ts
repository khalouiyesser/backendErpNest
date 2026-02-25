import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Delivery, DeliveryDocument, DeliveryStatus } from './delivery.schema';

@Injectable()
export class DeliveryService {
  constructor(@InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>) {}

  async create(dto: any, userId: string, userName: string, companyId: string): Promise<DeliveryDocument> {
    const d = new this.deliveryModel({ ...dto, saleId: new Types.ObjectId(dto.saleId), companyId: new Types.ObjectId(companyId), createdBy: new Types.ObjectId(userId), createdByName: userName });
    return d.save();
  }

  async findAll(companyId: string, query?: any): Promise<DeliveryDocument[]> {
    const filter: any = { companyId: new Types.ObjectId(companyId) };
    if (query?.status) filter.status = query.status;
    if (query?.search) filter.clientName = { $regex: query.search, $options: 'i' };
    return this.deliveryModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, companyId: string): Promise<DeliveryDocument> {
    const d = await this.deliveryModel.findOne({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!d) throw new NotFoundException('Bon de livraison introuvable');
    return d;
  }

  async markDelivered(id: string, companyId: string): Promise<DeliveryDocument> {
    const d = await this.deliveryModel.findOneAndUpdate({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) }, { status: DeliveryStatus.DELIVERED, deliveredAt: new Date() }, { new: true });
    if (!d) throw new NotFoundException('Bon de livraison introuvable');
    return d;
  }

  async cancel(id: string, companyId: string): Promise<DeliveryDocument> {
    const d = await this.deliveryModel.findOneAndUpdate({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) }, { status: DeliveryStatus.CANCELLED }, { new: true });
    if (!d) throw new NotFoundException('Bon de livraison introuvable');
    return d;
  }

  async remove(id: string, companyId: string): Promise<void> {
    const d = await this.deliveryModel.findOneAndDelete({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!d) throw new NotFoundException('Bon de livraison introuvable');
  }
}
