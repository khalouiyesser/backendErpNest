import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from './employee.schema';

@Injectable()
export class EmployeesService {
  constructor(@InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>) {}

  async create(dto: any, userId: string, userName: string, companyId: string) {
    const e = new this.employeeModel({ ...dto, companyId: new Types.ObjectId(companyId), createdBy: new Types.ObjectId(userId), createdByName: userName });
    return e.save();
  }

  async findAll(companyId: string, query?: any) {
    const filter: any = { companyId: new Types.ObjectId(companyId) };
    if (query?.search) filter.$or = [{ name: { $regex: query.search, $options: 'i' } }, { position: { $regex: query.search, $options: 'i' } }];
    return this.employeeModel.find(filter).sort({ name: 1 }).exec();
  }

  async findOne(id: string, companyId: string) {
    const e = await this.employeeModel.findOne({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!e) throw new NotFoundException('Employé introuvable');
    return e;
  }

  async update(id: string, companyId: string, dto: any) {
    const e = await this.employeeModel.findOneAndUpdate({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) }, dto, { new: true });
    if (!e) throw new NotFoundException('Employé introuvable');
    return e;
  }

  async remove(id: string, companyId: string) {
    const e = await this.employeeModel.findOneAndDelete({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!e) throw new NotFoundException('Employé introuvable');
  }

  async getSalaryTotal(companyId: string): Promise<number> {
    const result = await this.employeeModel.aggregate([{ $match: { companyId: new Types.ObjectId(companyId), isActive: true } }, { $group: { _id: null, total: { $sum: '$salary' } } }]);
    return result[0]?.total || 0;
  }
}
