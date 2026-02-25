import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type UserDocument = User & Document;


export enum UserRole
{
  SYSTEM_ADMIN = 'system_admin',
  ADMIN_COMPANY = 'admin_company',
  RESOURCE = 'resource'
}


@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;
  @Prop({ required: true })
  password: string;
  @Prop()
  phone: string;
  @Prop({ type: String, enum: UserRole, default: UserRole.RESOURCE })
  role: UserRole;
  @Prop({ type: Types.ObjectId, ref: 'Company' })
  companyId: Types.ObjectId;
  @Prop() position: string;
  @Prop({ default: true })
  isActive: boolean;
  @Prop({ default: false })
  mustChangePassword: boolean;
  @Prop({ default: 'light' })
  theme: string;
  @Prop()
  avatarUrl: string;
  @Prop({ type: Date })
  lastLoginAt: Date;
  @Prop({ default: 0 })
  failedLoginAttempts: number;
  @Prop({ type: Date })
  lockedUntil: Date;
  @Prop()
  passwordResetToken: string;
  @Prop()
  ocrAttemptsLeft: number;
  @Prop()
  ocrAttemptsResetAt: Date;
  @Prop({ type: Date })
  passwordResetExpires: Date;
}
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ companyId: 1 });
