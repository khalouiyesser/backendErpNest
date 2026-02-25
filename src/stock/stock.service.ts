import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StockMovement, StockMovementDocument, MovementType } from './stock-movement.schema';
import { Product } from '../products/product.schema';
import { InjectModel as InjectProductModel } from '@nestjs/mongoose';

@Injectable()
export class StockService {
  constructor(@InjectModel(StockMovement.name) private movementModel: Model<StockMovementDocument>) {}

  async recordMovement(dto: { productId: string; productName: string; type: MovementType; source: any; quantity: number; stockBefore: number; stockAfter: number; referenceId?: string; notes?: string; userId: string; companyId: string }): Promise<StockMovementDocument> {
    const m = new this.movementModel({
      ...dto,
      productId: new Types.ObjectId(dto.productId),
      userId: dto.userId !== 'system' ? new Types.ObjectId(dto.userId) : undefined,
      companyId: new Types.ObjectId(dto.companyId),
    });
    return m.save();
  }

  async findAll(companyId: string, query?: any): Promise<StockMovementDocument[]> {
    const filter: any = { companyId: new Types.ObjectId(companyId) };
    if (query?.type) filter.type = query.type;
    if (query?.productId) filter.productId = new Types.ObjectId(query.productId);
    if (query?.startDate || query?.endDate) { filter.createdAt = {}; if (query.startDate) filter.createdAt.$gte = new Date(query.startDate); if (query.endDate) filter.createdAt.$lte = new Date(query.endDate); }
    return this.movementModel.find(filter).sort({ createdAt: -1 }).limit(200).exec();
  }
}
