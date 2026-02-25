import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  async create(dto: any, userId: string, userName: string, companyId: string): Promise<ProductDocument> {
    const p = new this.productModel({ ...dto, companyId: new Types.ObjectId(companyId), createdBy: new Types.ObjectId(userId), createdByName: userName });
    return p.save();
  }

  async findAll(companyId: string, query?: any): Promise<ProductDocument[]> {
    const filter: any = { companyId: new Types.ObjectId(companyId) };
    if (query?.search) filter.$or = [{ name: { $regex: query.search, $options: 'i' } }];
    if (query?.lowStock === 'true') filter.$expr = { $lte: ['$stockQuantity', '$stockThreshold'] };
    const sort: any = query?.sortBy ? { [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1 } : { name: 1 };
    return this.productModel.find(filter).sort(sort).exec();
  }

  async findOne(id: string, companyId: string): Promise<ProductDocument> {
    const p = await this.productModel.findOne({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!p) throw new NotFoundException('Produit introuvable');
    return p;
  }

  async update(id: string, companyId: string, dto: any, userId: string, userName: string): Promise<ProductDocument> {
    const p = await this.productModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) },
      { ...dto, updatedBy: new Types.ObjectId(userId), updatedByName: userName },
      { new: true },
    );
    if (!p) throw new NotFoundException('Produit introuvable');
    return p;
  }

  async remove(id: string, companyId: string): Promise<void> {
    const p = await this.productModel.findOneAndDelete({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!p) throw new NotFoundException('Produit introuvable');
  }

  async updateStock(id: string, quantity: number, operation: 'add'|'subtract', companyId: string): Promise<void> {
    const inc = operation === 'add' ? quantity : -quantity;
    await this.productModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) },
      { $inc: { stockQuantity: inc } },
    );
  }
}
