import {BadRequestException, forwardRef, Inject, Injectable, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FournisseursService } from '../fournisseurs/fournisseurs.service';

@Injectable()
export class ProductsService {
  constructor(
      @InjectModel(Product.name) private productModel: Model<ProductDocument>,
      @Inject(forwardRef(() => FournisseursService)) // ✅ obligatoire avec forwardRef
      private readonly fournisseursService: FournisseursService, // ✅ injecté
  ) {}

  async create(dto: CreateProductDto, userId: string): Promise<ProductDocument> {
    const product = new this.productModel({
      ...dto,
      supplierIds: (dto.supplierIds || []).map(id => new Types.ObjectId(id)), // ✅ corrigé
      userId: new Types.ObjectId(userId),
    });
    const saved = await product.save();

    // ✅ Synchroniser dans les fournisseurs dès la création
    if ((dto.supplierIds || []).length > 0) {
      await this.fournisseursService.syncProductToSuppliers(
          saved._id.toString(),
          { name: dto.name, unit: dto.unit, purchasePrice: dto.purchasePrice, tva: dto.tva },
          dto.supplierIds.map(s => s.toString()),
          [],
      );
    }

    return saved;
  }

  async findAll(
      userId: string,
      query?: { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' },
  ): Promise<ProductDocument[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { unit: { $regex: query.search, $options: 'i' } },
      ];
    }
    const sort: any = query?.sortBy
        ? { [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1 }
        : { createdAt: -1 };

    return this.productModel
        .find(filter)
        .populate('supplierIds') // ✅ corrigé
        .sort(sort)
        .exec();
  }

  async findOne(id: string, userId: string): Promise<ProductDocument> {
    const p = await this.productModel
        .findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) })
        .populate('supplierIds'); // ✅ corrigé
    if (!p) throw new NotFoundException(`Produit introuvable (id: ${id})`);
    return p;
  }

  async update(id: string, userId: string, dto: UpdateProductDto): Promise<ProductDocument> {
    // ✅ Récupérer l'ancien état pour calculer le delta fournisseurs
    const old = await this.productModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!old) throw new NotFoundException('Produit introuvable');

    const oldSupplierIds = (old.supplierIds || []).map(s => s.toString());
    const newSupplierIds = (dto.supplierIds || []).map(s => s.toString());

    const update: any = { ...dto };
    if (dto.supplierIds) {
      update.supplierIds = dto.supplierIds.map(id => new Types.ObjectId(id)); // ✅ corrigé
    }

    const updated = await this.productModel
        .findOneAndUpdate(
            { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
            update,
            { new: true },
        )
        .populate('supplierIds'); // ✅ corrigé

    if (!updated) throw new NotFoundException('Produit introuvable');

    // ✅ Synchroniser dans les documents fournisseurs
    await this.fournisseursService.syncProductToSuppliers(
        id,
        {
          name:          dto.name          ?? old.name,
          unit:          dto.unit          ?? old.unit,
          purchasePrice: dto.purchasePrice ?? old.purchasePrice,
          tva:           dto.tva           ?? old.tva,
        },
        newSupplierIds,
        oldSupplierIds,
    );

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const p = await this.productModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!p) throw new NotFoundException('Produit introuvable');

    const oldSupplierIds = (p.supplierIds || []).map(s => s.toString());
    await this.productModel.findByIdAndDelete(id);

    // ✅ Retirer le produit de tous ses fournisseurs à la suppression
    if (oldSupplierIds.length > 0) {
      await this.fournisseursService.syncProductToSuppliers(
          id,
          { name: p.name, unit: p.unit, purchasePrice: p.purchasePrice, tva: p.tva },
          [],
          oldSupplierIds,
      );
    }
  }

  async updateStock(
      productId: string,
      quantity: number,
      operation: 'add' | 'subtract',
  ): Promise<ProductDocument> {
    if (operation === 'subtract') {
      const product = await this.productModel.findById(productId);
      if (!product) throw new NotFoundException(`Produit introuvable (id: ${productId})`);
      if (product.stockQuantity < quantity) {
        throw new BadRequestException(
            `Stock insuffisant pour "${product.name}". ` +
            `Disponible: ${product.stockQuantity} ${product.unit}, requis: ${quantity}`,
        );
      }
    }

    const inc = operation === 'add' ? quantity : -quantity;
    const p = await this.productModel.findByIdAndUpdate(
        productId,
        { $inc: { stockQuantity: inc } },
        { new: true },
    );

    if (p && p.stockQuantity < 0) {
      await this.productModel.findByIdAndUpdate(productId, { stockQuantity: 0 });
      p.stockQuantity = 0;
    }

    return p;
  }

  async getLowStockProducts(userId: string): Promise<ProductDocument[]> {
    return this.productModel.find({
      userId: new Types.ObjectId(userId),
      $expr: { $lte: ['$stockQuantity', '$stockThreshold'] },
      stockThreshold: { $gt: 0 },
    });
  }

  async getOutOfStockProducts(userId: string): Promise<ProductDocument[]> {
    return this.productModel.find({
      userId: new Types.ObjectId(userId),
      stockQuantity: { $lte: 0 },
    });
  }

  async findBySupplier(supplierId: string, userId: string): Promise<ProductDocument[]> {
    return this.productModel.find({
      userId: new Types.ObjectId(userId),
      supplierIds: new Types.ObjectId(supplierId), // ✅ corrigé
    }).exec();
  }
}