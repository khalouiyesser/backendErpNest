import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuoteDocument = Quote & Document;

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// Devis
@Schema({ timestamps: true })
export class Quote {
  @Prop({ required: true })
  clientName: string; // Can be prospect (no existing client required)

  @Prop()
  clientPhone: string;

  @Prop()
  clientEmail: string;

  @Prop({ type: Types.ObjectId, ref: 'Client' })
  clientId: Types.ObjectId; // Optional - can be a prospect

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

  @Prop({ type: String, enum: QuoteStatus, default: QuoteStatus.DRAFT })
  status: QuoteStatus;

  @Prop()
  validUntil: Date;

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
