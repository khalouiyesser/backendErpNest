import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
      @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductDto, userId: string): Promise<ProductDocument> {
    const product = new this.productModel({
      ...dto,
      FournisseurIds: dto.supplierIds?.map((id) => new Types.ObjectId(id)) || [],
      userId: new Types.ObjectId(userId),
    });
    return product.save();
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
    return this.productModel.find(filter).populate('FournisseurIds').sort(sort).exec();
  }

  async findOne(id: string, userId: string): Promise<ProductDocument> {
    const p = await this.productModel
        .findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) })
        .populate('FournisseurIds');
    if (!p) throw new NotFoundException(`Produit introuvable (id: ${id})`);
    return p;
  }

  async update(id: string, userId: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const update: any = { ...dto };
    // if (dto.FournisseurIds) {
    //   update.FournisseurIds = dto.FournisseurIds.map((sid) => new Types.ObjectId(sid));
    // }
    const p = await this.productModel
        .findOneAndUpdate(
            { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
            update,
            { new: true },
        )
        .populate('FournisseurIds');
    if (!p) throw new NotFoundException('Produit introuvable');
    return p;
  }

  async remove(id: string, userId: string): Promise<void> {
    const p = await this.productModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!p) throw new NotFoundException('Produit introuvable');
  }

  /**
   * Met à jour le stock.
   * Pour 'subtract', vérifie que le stock ne devient pas négatif.
   */
  async updateStock(
      productId: string,
      quantity: number,
      operation: 'add' | 'subtract',
  ): Promise<ProductDocument> {
    if (operation === 'subtract') {
      // Vérification préalable — protection stock négatif
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

    // Sécurité finale — jamais en dessous de 0
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
      FournisseurIds: new Types.ObjectId(supplierId),
    }).exec();
  }
}
