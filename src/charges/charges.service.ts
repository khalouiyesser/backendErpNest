import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Charge, ChargeDocument } from './charge.schema';

@Injectable()
export class ChargesService {
  constructor(@InjectModel(Charge.name) private chargeModel: Model<ChargeDocument>) {}

  async create(dto: any, userId: string): Promise<ChargeDocument> {
    const charge = new this.chargeModel({ ...dto, userId: new Types.ObjectId(userId) });
    return charge.save();
  }

  async findAll(userId: string, query?: any): Promise<ChargeDocument[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query?.search) filter.$or = [{ description: { $regex: query.search, $options: 'i' } }, { source: { $regex: query.search, $options: 'i' } }];
    if (query?.type) filter.type = query.type;
    if (query?.startDate || query?.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = new Date(query.startDate);
      if (query.endDate) filter.date.$lte = new Date(query.endDate);
    }
    const sort: any = query?.sortBy ? { [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1 } : { date: -1 };
    return this.chargeModel.find(filter).sort(sort).exec();
  }

  async findOne(id: string, userId: string): Promise<ChargeDocument> {
    const c = await this.chargeModel.findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) });
    if (!c) throw new NotFoundException('Charge not found');
    return c;
  }

  async update(id: string, userId: string, dto: any): Promise<ChargeDocument> {
    const c = await this.chargeModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) }, dto, { new: true }
    );
    if (!c) throw new NotFoundException('Charge not found');
    return c;
  }

  async remove(id: string, userId: string): Promise<void> {
    const c = await this.chargeModel.findOneAndDelete({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) });
    if (!c) throw new NotFoundException('Charge not found');
  }
}
