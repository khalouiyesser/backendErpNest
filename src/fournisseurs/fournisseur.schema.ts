import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type FournisseurDocument = Fournisseur & Document;
@Schema({ _id: true })
export class ProductEmbedded { @Prop({ required: true }) name: string; @Prop({ default: 'unité' }) unit: string; @Prop({ default: 0 }) purchasePrice: number; @Prop({ default: 19 }) tva: number; }
export const ProductEmbeddedSchema = SchemaFactory.createForClass(ProductEmbedded);
@Schema({ timestamps: true })
export class Fournisseur {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) phone: string;
  @Prop() email: string;
  @Prop() notes: string;
  @Prop() address: string;
  @Prop({ default: 0 }) totalDebt: number;
  @Prop({ type: [ProductEmbeddedSchema], default: [] }) products: ProductEmbedded[];
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true }) companyId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) createdBy: Types.ObjectId;
  @Prop() createdByName: string;
}
export const FournisseurSchema = SchemaFactory.createForClass(Fournisseur);
FournisseurSchema.index({ phone: 1, companyId: 1 }, { unique: true });
