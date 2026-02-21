import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PurchaseDocument = Purchase & Document;


@Schema({ timestamps: true })
export class Purchase {
  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true })
  supplierName: string;

  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, ref: 'Product' },
        productName: String,
        quantity: Number,
        unitPrice: Number,
        tva: Number,
        totalHT: Number,
        totalTTC: Number,
      },
    ],
    default: [],
  })
  items: any[];

  @Prop({ required: true })
  totalHT: number;

  @Prop({ required: true })
  totalTTC: number;

  @Prop({ default: 0 })
  amountPaid: number;

  @Prop({ default: 0 })
  amountRemaining: number;

  // ⚡ Faire la relation vers PaymentAchat
  @Prop({ type: [{ type: Types.ObjectId, ref: 'PaymentAchat' }], default: [] })
  payments: Types.ObjectId[]; // liste de PaymentAchat


  @Prop()
  paymentMethod : string;

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);
