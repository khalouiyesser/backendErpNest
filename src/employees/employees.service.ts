import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from './employee.schema';

@Injectable()
export class EmployeesService {
  constructor(@InjectModel(Employee.name) private empModel: Model<EmployeeDocument>) {}
  async create(dto: any, userId: string) { return new this.empModel({ ...dto, userId: new Types.ObjectId(userId) }).save(); }
  async findAll(userId: string, query?: any) {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query?.search) filter.$or = [{ firstName: { $regex: query.search, $options: 'i' } }, { lastName: { $regex: query.search, $options: 'i' } }, { position: { $regex: query.search, $options: 'i' } }];
    if (query?.isActive !== undefined) filter.isActive = query.isActive;
    const sort: any = query?.sortBy ? { [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };
    return this.empModel.find(filter).sort(sort).exec();
  }
  async findOne(id: string, userId: string) {
    const e = await this.empModel.findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) });
    if (!e) throw new NotFoundException('Employee not found');
    return e;
  }
  async update(id: string, userId: string, dto: any) {
    const e = await this.empModel.findOneAndUpdate({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) }, dto, { new: true });
    if (!e) throw new NotFoundException('Employee not found');
    return e;
  }
  async remove(id: string, userId: string) {
    const e = await this.empModel.findOneAndDelete({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) });
    if (!e) throw new NotFoundException('Employee not found');
  }
}
