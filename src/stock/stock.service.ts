import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StockMovement, StockMovementDocument, MovementType, MovementSource } from './stock-movement.schema';
import { ProductsService } from '../products/products.service';

@Injectable()
export class StockService {
  constructor(
    @InjectModel(StockMovement.name) private movementModel: Model<StockMovementDocument>,
    private productsService: ProductsService,
  ) {}

  async recordMovement(data: {
    productId: string;
    productName: string;
    type: MovementType;
    source: MovementSource;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    referenceId?: string;
    notes?: string;
    userId: string;
  }): Promise<StockMovementDocument> {
    const movement = new this.movementModel({
      ...data,
      productId: new Types.ObjectId(data.productId),
      userId: new Types.ObjectId(data.userId),
    });
    return movement.save();
  }

  async getMovements(userId: string, query?: { productId?: string; type?: string; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<StockMovementDocument[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query?.productId) filter.productId = new Types.ObjectId(query.productId);
    if (query?.type) filter.type = query.type;
    if (query?.search) filter.$or = [{ productName: { $regex: query.search, $options: 'i' } }];
    const sort: any = query?.sortBy ? { [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };
    return this.movementModel.find(filter).sort(sort).exec();
  }

  async adjustStock(productId: string, quantity: number, notes: string, userId: string): Promise<void> {
    const product = await this.productsService.findOne(productId, userId);
    const stockBefore = product.stockQuantity;
    const stockAfter = quantity;
    const diff = stockAfter - stockBefore;

    await this.productsService.update(productId, userId, { stockQuantity: quantity });
    await this.recordMovement({
      productId,
      productName: product.name,
      type: MovementType.ADJUSTMENT,
      source: MovementSource.MANUAL,
      quantity: Math.abs(diff),
      stockBefore,
      stockAfter,
      notes,
      userId,
    });
  }

  async getLowStockAlerts(userId: string) {
    return this.productsService.getLowStockProducts(userId);
  }
}
