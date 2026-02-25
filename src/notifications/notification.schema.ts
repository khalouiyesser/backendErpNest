import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type NotificationDocument = Notification & Document;
export enum NotificationType { LOW_STOCK = 'low_stock', PAYMENT_DUE = 'payment_due', QUOTE_EXPIRING = 'quote_expiring', SYSTEM = 'system' }

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) message: string;
  @Prop({ type: String, enum: NotificationType, default: NotificationType.SYSTEM }) type: NotificationType;
  @Prop({ default: false }) isRead: boolean;
  @Prop() link: string;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true }) companyId: Types.ObjectId;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ companyId: 1, createdAt: -1 });
