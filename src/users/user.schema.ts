import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRIAL = 'trial',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: String, enum: SubscriptionStatus, default: SubscriptionStatus.TRIAL })
  subscriptionStatus: SubscriptionStatus;

  @Prop()
  subscriptionExpiresAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  mustChangePassword: boolean;

  @Prop({ default: 5 })
  ocrAttemptsLeft: number;

  @Prop({ type: Date, default: null })
  ocrAttemptsResetAt: Date;

  // Business settings
  @Prop()
  businessName: string;

  @Prop()
  taxId: string;

  @Prop()
  address: string;

  @Prop({ default: 'light' })
  theme: string;

  @Prop({ default: '#2563EB' })
  primaryColor: string;

  @Prop()
  fiscalRegime: string;

  @Prop()
  activityType: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
