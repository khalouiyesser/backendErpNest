import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {Fournisseur, FournisseurDocument} from "./fournisseur.schema";
import {CreateFournisseurDto} from "./dto/create-supplier.dto";
import {UpdateFournisseurDto} from "./dto/update-supplier.dto";


@Injectable()
export class FournisseursService {
  constructor(
    @InjectModel(Fournisseur.name) private FournisseurModel: Model<FournisseurDocument>,
  ) {}

  async create(dto: CreateFournisseurDto, userId: string): Promise<FournisseurDocument> {
    const existing = await this.FournisseurModel.findOne({ phone: dto.phone, userId: new Types.ObjectId(userId) });
    if (existing) throw new ConflictException('Phone already exists for this Fournisseur');
    const Fournisseur = new this.FournisseurModel({ ...dto, userId: new Types.ObjectId(userId) });
    return Fournisseur.save();
  }

  async findAll(userId: string, query?: { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<FournisseurDocument[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }
    const sort: any = query?.sortBy ? { [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };
    return this.FournisseurModel.find(filter).sort(sort).exec();
  }

  async findOne(id: string, userId: string): Promise<FournisseurDocument> {
    const s = await this.FournisseurModel.findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) });
    if (!s) throw new NotFoundException('Fournisseur not found');
    return s;
  }

  async update(id: string, userId: string, dto: UpdateFournisseurDto): Promise<FournisseurDocument> {
    const s = await this.FournisseurModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      dto, { new: true }
    );
    if (!s) throw new NotFoundException('Fournisseur not found');
    return s;
  }

  async remove(id: string, userId: string): Promise<void> {
    const s = await this.FournisseurModel.findOneAndDelete({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) });
    if (!s) throw new NotFoundException('Fournisseur not found');
  }

  async updateDebt(FournisseurId: string, amount: number): Promise<void> {
    await this.FournisseurModel.findByIdAndUpdate(FournisseurId, { $inc: { totalDebt: amount } });
  }
}
