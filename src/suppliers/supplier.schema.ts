import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupplierDocument = Supplier & Document;

@Schema({ timestamps: true })
export class Supplier {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email: string;

  @Prop()
  notes : string

  @Prop()
  address: string;

  @Prop({ default: 0 })
  totalDebt: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
SupplierSchema.index({ phone: 1, userId: 1 }, { unique: true });
