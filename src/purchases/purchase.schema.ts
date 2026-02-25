import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type PurchaseDocument = Purchase & Document;
export enum PurchaseStatus { PENDING='pending', PARTIAL='partial', PAID='paid' }
@Schema({ timestamps: true })
export class Purchase {
  @Prop({ type: Types.ObjectId, ref: 'Fournisseur', required: true }) FournisseurId: Types.ObjectId;
  @Prop({ required: true }) FournisseurName: string;
  @Prop({ type: [{ productId: { type: Types.ObjectId, ref: 'Product' }, productName: String, quantity: Number, unitPrice: Number, tva: Number, totalHT: Number, totalTTC: Number }], default: [] }) items: any[];
  @Prop({ required: true }) totalHT: number;
  @Prop({ required: true }) totalTTC: number;
  @Prop({ default: 0 }) amountPaid: number;
  @Prop({ default: 0 }) amountRemaining: number;
  @Prop({ type: String, enum: PurchaseStatus, default: PurchaseStatus.PENDING }) status: PurchaseStatus;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'PaymentAchat' }], default: [] }) payments: Types.ObjectId[];
  @Prop() paymentMethod: string;
  @Prop() notes: string;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true }) companyId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) createdBy: Types.ObjectId;
  @Prop() createdByName: string;
}
export const PurchaseSchema = SchemaFactory.createForClass(Purchase);
PurchaseSchema.index({ companyId: 1, createdAt: -1 });
