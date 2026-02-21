import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true }) firstName: string;
  @Prop({ required: true }) lastName: string;
  @Prop({ required: true }) phone: string;
  @Prop() email: string;
  @Prop() position: string;
  @Prop() department: string;
  @Prop({ default: 0 }) salary: number;
  @Prop() hireDate: Date;
  @Prop({ default: true }) isActive: boolean;
  @Prop() notes: string;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
}
export const EmployeeSchema = SchemaFactory.createForClass(Employee);
