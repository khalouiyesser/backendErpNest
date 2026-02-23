// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Types } from 'mongoose';
// import {Product} from "../products/product.schema";
//
// export type FournisseurDocument = Fournisseur & Document;
//
// @Schema({ timestamps: true })
// export class Fournisseur {
//   @Prop({ required: true })
//   name: string;
//
//   @Prop({ required: true })
//   phone: string;
//
//   @Prop()
//   email: string;
//
//   @Prop()
//   notes : string
//
//   @Prop()
//   address: string;
//
//   @Prop({ default: 0 })
//   totalDebt: number;
//
//   @Prop({ type: Types.ObjectId, ref: 'User', required: true })
//   userId: Types.ObjectId;
//
//   @Prop({  required: true })
//   produits : Product[];
//
//
// }
//
// export const FournisseurSchema = SchemaFactory.createForClass(Fournisseur);
// FournisseurSchema.index({ phone: 1, userId: 1 }, { unique: true });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ✅ Sous-schéma produit embarqué
@Schema({ _id: true })
export class ProductEmbedded {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 'unité' })
  unit: string;

  @Prop({ default: 0 })
  purchasePrice: number;

  @Prop({ default: 19 })
  tva: number;
}
export const ProductEmbeddedSchema = SchemaFactory.createForClass(ProductEmbedded);

export type FournisseurDocument = Fournisseur & Document;

@Schema({ timestamps: true })
export class Fournisseur {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email: string;

  @Prop()
  notes: string;

  @Prop()
  address: string;

  @Prop({ default: 0 })
  totalDebt: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // ✅ Tableau de produits embarqués (plus required, default vide)
  @Prop({ type: [ProductEmbeddedSchema], default: [] })
  products: ProductEmbedded[];
}

export const FournisseurSchema = SchemaFactory.createForClass(Fournisseur);
FournisseurSchema.index({ phone: 1, userId: 1 }, { unique: true });