import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true })
export class Client {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string; // Tunisian format +216XXXXXXXX

  @Prop()
  email: string;

  @Prop()
  sector: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  creditLimit: number;

  @Prop({ default: 0 })
  creditUsed: number;


  @Prop({ default: "" })
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

// Compound unique index: phone unique per user
ClientSchema.index({ phone: 1, userId: 1 }, { unique: true });
