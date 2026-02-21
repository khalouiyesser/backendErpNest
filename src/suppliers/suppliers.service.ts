import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Supplier, SupplierDocument } from './supplier.schema';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
  ) {}

  async create(dto: CreateSupplierDto, userId: string): Promise<SupplierDocument> {
    const existing = await this.supplierModel.findOne({ phone: dto.phone, userId: new Types.ObjectId(userId) });
    if (existing) throw new ConflictException('Phone already exists for this supplier');
    const supplier = new this.supplierModel({ ...dto, userId: new Types.ObjectId(userId) });
    return supplier.save();
  }

  async findAll(userId: string, query?: { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<SupplierDocument[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }
    const sort: any = query?.sortBy ? { [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };
    return this.supplierModel.find(filter).sort(sort).exec();
  }

  async findOne(id: string, userId: string): Promise<SupplierDocument> {
    const s = await this.supplierModel.findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) });
    if (!s) throw new NotFoundException('Supplier not found');
    return s;
  }

  async update(id: string, userId: string, dto: UpdateSupplierDto): Promise<SupplierDocument> {
    const s = await this.supplierModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      dto, { new: true }
    );
    if (!s) throw new NotFoundException('Supplier not found');
    return s;
  }

  async remove(id: string, userId: string): Promise<void> {
    const s = await this.supplierModel.findOneAndDelete({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) });
    if (!s) throw new NotFoundException('Supplier not found');
  }

  async updateDebt(supplierId: string, amount: number): Promise<void> {
    await this.supplierModel.findByIdAndUpdate(supplierId, { $inc: { totalDebt: amount } });
  }
}
