import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VenteDocument = Vente & Document;



export class Ventes {
  productId: Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  tva: number;
  totalHT: number;
  totalTTC: number;
}

export class Payment {
  amount: number;
  date: Date;
  note: string;
}

export enum Ventestatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
}

@Schema({ timestamps: true })
export class Vente {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ required: true })
  clientName: string;

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
  items: Ventes[];

  @Prop({ required: true })
  totalHT: number;

  @Prop({ required: true })
  totalTTC: number;

  @Prop({ default: 0 })
  amountPaid: number;

  @Prop({ default: 0 })
  amountRemaining: number;

  @Prop({
    type: [{ amount: Number, date: Date, note: String }],
    default: [],
  })
  payments: Payment[];

  @Prop({ type: String, enum: Ventestatus, default: Ventestatus.PENDING })
  status: Ventestatus;


  @Prop()
  paymentMethod?: string;

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const Venteschema = SchemaFactory.createForClass(Vente);
