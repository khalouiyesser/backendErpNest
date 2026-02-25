import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type StockMovementDocument = StockMovement & Document;
export enum MovementType { IN = 'IN', OUT = 'OUT', ADJUSTMENT = 'ADJUSTMENT' }
export enum MovementSource { PURCHASE = 'purchase', SALE = 'sale', RETURN = 'return', ADJUSTMENT = 'adjustment' }

@Schema({ timestamps: true })
export class StockMovement {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true }) productId: Types.ObjectId;
  @Prop({ required: true }) productName: string;
  @Prop({ type: String, enum: MovementType, required: true }) type: MovementType;
  @Prop({ type: String, enum: MovementSource, required: true }) source: MovementSource;
  @Prop({ required: true }) quantity: number;
  @Prop({ required: true }) stockBefore: number;
  @Prop({ required: true }) stockAfter: number;
  @Prop() referenceId: string;
  @Prop() notes: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true }) companyId: Types.ObjectId;
}
export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
StockMovementSchema.index({ companyId: 1, createdAt: -1 });
