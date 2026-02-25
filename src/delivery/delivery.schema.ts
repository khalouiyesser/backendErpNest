import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type DeliveryDocument = Delivery & Document;
export enum DeliveryStatus { PENDING = 'pending', DELIVERED = 'delivered', CANCELLED = 'cancelled' }

@Schema({ timestamps: true })
export class Delivery {
  @Prop({ type: Types.ObjectId, ref: 'Vente', required: true }) saleId: Types.ObjectId;
  @Prop({ required: true }) clientName: string;
  @Prop() clientPhone: string;
  @Prop() deliveryAddress: string;
  @Prop() notes: string;
  @Prop({ type: [{ productId: { type: Types.ObjectId, ref: 'Product' }, productName: String, quantity: Number }], default: [] }) items: any[];
  @Prop({ type: String, enum: DeliveryStatus, default: DeliveryStatus.PENDING }) status: DeliveryStatus;
  @Prop() deliveredAt: Date;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true }) companyId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) createdBy: Types.ObjectId;
  @Prop() createdByName: string;
}
export const DeliverySchema = SchemaFactory.createForClass(Delivery);
