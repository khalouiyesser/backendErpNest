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





  // Synchronise les fournisseurs d'un produit :
// - ajoute le produit aux nouveaux fournisseurs sélectionnés
// - le retire des fournisseurs désélectionnés


  async syncProductToSuppliers(
      productId: string,
      productData: { name: string; unit?: string; purchasePrice?: number; tva?: number },
      newSupplierIds: string[],
      oldSupplierIds: string[],
  ): Promise<void> {
    const toAdd    = newSupplierIds.filter(id => !oldSupplierIds.includes(id));
    const toRemove = oldSupplierIds.filter(id => !newSupplierIds.includes(id));

    // Ajouter le produit aux nouveaux fournisseurs (si pas déjà présent)
    if (toAdd.length > 0) {
      await this.FournisseurModel.updateMany(
          {
            _id: { $in: toAdd.map(id => new Types.ObjectId(id)) },
            'products._id': { $ne: new Types.ObjectId(productId) },
          },
          {
            $push: {
              products: {
                _id: new Types.ObjectId(productId),
                name: productData.name,
                unit: productData.unit,
                purchasePrice: productData.purchasePrice,
                tva: productData.tva,
              },
            },
          },
      );
    }

    // Retirer le produit des fournisseurs désélectionnés
    if (toRemove.length > 0) {
      await this.FournisseurModel.updateMany(
          { _id: { $in: toRemove.map(id => new Types.ObjectId(id)) } },
          { $pull: { products: { _id: new Types.ObjectId(productId) } } },
      );
    }

    // Mettre à jour le produit dans les fournisseurs déjà liés (si nom/prix changé)
    const toUpdate = newSupplierIds.filter(id => oldSupplierIds.includes(id));
    if (toUpdate.length > 0) {
      await this.FournisseurModel.updateMany(
          {
            _id: { $in: toUpdate.map(id => new Types.ObjectId(id)) },
            'products._id': new Types.ObjectId(productId),
          },
          {
            $set: {
              'products.$.name':          productData.name,
              'products.$.unit':          productData.unit,
              'products.$.purchasePrice': productData.purchasePrice,
              'products.$.tva':           productData.tva,
            },
          },
      );
    }
  }

}
