import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StockMovementDocument = StockMovement & Document;

export enum MovementType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
}

export enum MovementSource {
  PURCHASE = 'purchase',
  SALE = 'sale',
  MANUAL = 'manual',
  RETURN = 'return',
}

@Schema({ timestamps: true })
export class StockMovement {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ type: String, enum: MovementType, required: true })
  type: MovementType;

  @Prop({ type: String, enum: MovementSource, default: MovementSource.MANUAL })
  source: MovementSource;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  stockBefore: number;

  @Prop({ required: true })
  stockAfter: number;

  @Prop()
  referenceId: string; // Sale or Purchase ID

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
