import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  tva: number; // TVA percentage e.g. 19

  @Prop({ default: 'unité' })
  unit: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Supplier' }], default: [] })
  supplierIds: Types.ObjectId[];

  @Prop({ default: 0 })
  stockQuantity: number;

  @Prop({ default: 0 })
  stockThreshold: number; // Low stock alert threshold

  @Prop({ default: 0 })
  purchasePrice: number;

  @Prop({ default: 0 })
  salePrice: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
