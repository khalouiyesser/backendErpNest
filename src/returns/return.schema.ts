import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type ReturnDocument = Return & Document;
export enum ReturnStatus { PENDING = 'pending', APPROVED = 'approved', REFUNDED = 'refunded', REJECTED = 'rejected' }

@Schema({ timestamps: true })
export class Return {
  @Prop({ type: Types.ObjectId, ref: 'Vente', required: true }) saleId: Types.ObjectId;
  @Prop({ required: true }) clientName: string;
  @Prop({ type: Types.ObjectId, ref: 'Client' }) clientId: Types.ObjectId;
  @Prop({ required: true }) reason: string;
  @Prop({ type: [{ productId: { type: Types.ObjectId, ref: 'Product' }, productName: String, quantity: Number, unitPrice: Number, totalTTC: Number }], default: [] }) items: any[];
  @Prop({ required: true, default: 0 }) totalRefund: number;
  @Prop({ type: String, enum: ReturnStatus, default: ReturnStatus.PENDING }) status: ReturnStatus;
  @Prop() notes: string;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true }) companyId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) createdBy: Types.ObjectId;
  @Prop() createdByName: string;
}
export const ReturnSchema = SchemaFactory.createForClass(Return);
