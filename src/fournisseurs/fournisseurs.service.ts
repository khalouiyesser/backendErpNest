import { Injectable, NotFoundException, ConflictException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Fournisseur, FournisseurDocument } from './fournisseur.schema';

@Injectable()
export class FournisseursService {
  constructor(@InjectModel(Fournisseur.name) private fournisseurModel: Model<FournisseurDocument>) {}

  async create(dto: any, userId: string, userName: string, companyId: string): Promise<FournisseurDocument> {
    const existing = await this.fournisseurModel.findOne({ phone: dto.phone, companyId: new Types.ObjectId(companyId) });
    if (existing) throw new ConflictException('Ce fournisseur existe déjà (même téléphone)');
    const f = new this.fournisseurModel({ ...dto, companyId: new Types.ObjectId(companyId), createdBy: new Types.ObjectId(userId), createdByName: userName });
    return f.save();
  }

  async findAll(companyId: string, query?: any): Promise<FournisseurDocument[]> {
    const filter: any = { companyId: new Types.ObjectId(companyId) };
    if (query?.search) filter.$or = [{ name: { $regex: query.search, $options: 'i' } }, { phone: { $regex: query.search, $options: 'i' } }];
    const sort: any = query?.sortBy ? { [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };
    return this.fournisseurModel.find(filter).sort(sort).exec();
  }

  async findOne(id: string, companyId: string): Promise<FournisseurDocument> {
    const f = await this.fournisseurModel.findOne({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!f) throw new NotFoundException('Fournisseur introuvable');
    return f;
  }

  async update(id: string, companyId: string, dto: any, userId: string, userName: string): Promise<FournisseurDocument> {
    const f = await this.fournisseurModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) },
      { ...dto, updatedBy: new Types.ObjectId(userId), updatedByName: userName },
      { new: true },
    );
    if (!f) throw new NotFoundException('Fournisseur introuvable');
    return f;
  }

  async remove(id: string, companyId: string): Promise<void> {
    const f = await this.fournisseurModel.findOneAndDelete({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!f) throw new NotFoundException('Fournisseur introuvable');
  }

  async updateDebt(id: string, amount: number, companyId: string): Promise<void> {
    await this.fournisseurModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) },
      { $inc: { totalDebt: amount } },
    );
  }
}
