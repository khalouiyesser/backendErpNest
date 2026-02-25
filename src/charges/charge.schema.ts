import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type ChargeDocument = Charge & Document;
export enum ChargeType { RENT='rent', SALARY='salary', UTILITIES='utilities', EQUIPMENT='equipment', MARKETING='marketing', TAX='tax', INSURANCE='insurance', OTHER='other' }
@Schema({ timestamps: true })
export class Charge {
  @Prop({ required: true }) description: string;
  @Prop({ required: true }) amount: number;
  @Prop() amountHT: number;
  @Prop({ default: 0 }) tva: number;
  @Prop({ required: true }) date: Date;
  @Prop({ type: String, enum: ChargeType, default: ChargeType.OTHER }) type: ChargeType;
  @Prop() source: string;
  @Prop() imageUrl: string;
  @Prop() notes: string;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true }) companyId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) createdBy: Types.ObjectId;
  @Prop() createdByName: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) updatedBy: Types.ObjectId;
  @Prop() updatedByName: string;
}
export const ChargeSchema = SchemaFactory.createForClass(Charge);
ChargeSchema.index({ companyId: 1, date: -1 });
