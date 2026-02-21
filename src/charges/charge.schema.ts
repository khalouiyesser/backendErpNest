import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChargeDocument = Charge & Document;

export enum ChargeType {
  RENT = 'rent',
  SALARY = 'salary',
  UTILITIES = 'utilities',
  EQUIPMENT = 'equipment',
  MARKETING = 'marketing',
  TAX = 'tax',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Charge {
  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: String, enum: ChargeType, default: ChargeType.OTHER })
  type: ChargeType;

  @Prop()
  source: string; // Invoice number / reference

  @Prop()
  imageUrl: string; // Uploaded invoice image

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const ChargeSchema = SchemaFactory.createForClass(Charge);
