import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type PaymentAchatDocument = PaymentAchat & Document;

@Schema({ timestamps: true })
export class PaymentAchat {
  @Prop({ type: Types.ObjectId, ref: 'Fournisseur', required: true }) fournisseurId: Types.ObjectId;
  @Prop({ required: true }) amount: number;
  @Prop() note: string;
  @Prop({ type: Types.ObjectId, ref: 'Purchase', required: true }) achatId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true }) companyId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
}
export const PaymentAchatSchema = SchemaFactory.createForClass(PaymentAchat);
