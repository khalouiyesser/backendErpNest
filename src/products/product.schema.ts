import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type ProductDocument = Product & Document;
@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true }) name: string;
  @Prop({ default: 19 }) tva: number;
  @Prop({ default: 'unité' }) unit: string;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Fournisseur' }], default: [] }) supplierIds: Types.ObjectId[];
  @Prop({ default: 0 }) stockQuantity: number;
  @Prop({ default: 0 }) stockThreshold: number;
  @Prop({ default: 0 }) purchasePrice: number;
  @Prop({ default: 0 }) salePrice: number;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true }) companyId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) createdBy: Types.ObjectId;
  @Prop() createdByName: string;
}
export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ companyId: 1 });
