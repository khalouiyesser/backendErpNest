import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true }) name: string;
  @Prop() phone: string;
  @Prop() email: string;
  @Prop() position: string;
  @Prop({ default: 0 }) salary: number;
  @Prop() hireDate: Date;
  @Prop({ default: true }) isActive: boolean;
  @Prop() notes: string;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true }) companyId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) createdBy: Types.ObjectId;
  @Prop() createdByName: string;
}
export const EmployeeSchema = SchemaFactory.createForClass(Employee);
