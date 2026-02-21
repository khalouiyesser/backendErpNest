import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Purchase, PurchaseDocument } from './purchase.schema';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { ProductsService } from '../products/products.service';
import { FournisseursService } from '../Fournisseurs/Fournisseurs.service';
import { PaymentAchatService } from '../payment-achat/payment-achat.service';
import { PaymentAchatDocument } from '../payment-achat/entities/payment-achat.entity';

@Injectable()
export class PurchasesService {
  constructor(
      @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
      private productsService: ProductsService,
      private FournisseursService: FournisseursService,
      private paymentAchatService: PaymentAchatService,
  ) {}

  async create(dto: CreatePurchaseDto, userId: string): Promise<PurchaseDocument> {
    const Fournisseur = await this.FournisseursService.findOne(dto.FournisseurId, userId);

    let totalHT = 0;
    let totalTTC = 0;

    const items = dto.items.map(item => {
      const tva = item.tva || 0;
      const lineHT = item.quantity * item.unitPrice;
      const lineTTC = lineHT * (1 + tva / 100);
      totalHT += lineHT;
      totalTTC += lineTTC;

      return {
        productId: new Types.ObjectId(item.productId),
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        tva,
        totalHT: lineHT,
        totalTTC: lineTTC,
      };
    });

    const initialPayment = dto.initialPayment || 0;
    const amountRemaining = totalTTC - initialPayment;

    const purchase = new this.purchaseModel({
      FournisseurId: new Types.ObjectId(dto.FournisseurId),
      FournisseurName: Fournisseur.name,
      items,
      totalHT,
      totalTTC,
      amountPaid: initialPayment,
      amountRemaining,
      payments: [],
      notes: dto.notes,
      userId: new Types.ObjectId(userId),
    });

    const savedPurchase = await purchase.save();

    // Création automatique du paiement si initialPayment > 0
    if (initialPayment > 0) {
      const savedPayment = await this.paymentAchatService.createFromAchat(
          userId,
          dto.FournisseurId,
          initialPayment,
          savedPurchase._id.toString(),
      );

      savedPurchase.payments.push(savedPayment._id);
      await savedPurchase.save();

      await this.FournisseursService.updateDebt(dto.FournisseurId, amountRemaining);
    } else {
      await this.FournisseursService.updateDebt(dto.FournisseurId, amountRemaining);
    }

    // Mettre à jour le stock
    for (const item of dto.items) {
      await this.productsService.updateStock(item.productId, item.quantity, 'add');
    }

    return savedPurchase;
  }

  async findAll(userId: string, query?: any): Promise<PurchaseDocument[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query?.search) filter.$or = [{ FournisseurName: { $regex: query.search, $options: 'i' } }];
    if (query?.status) filter.status = query.status;
    const sort: any = query?.sortBy
        ? { [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1 }
        : { createdAt: -1 };
    return this.purchaseModel.find(filter).sort(sort).populate('payments').exec();
  }

  async findOne(id: string, userId: string): Promise<PurchaseDocument> {
    const purchase = await this.purchaseModel
        .findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) })
        .populate('payments');
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async addPayment(id: string, userId: string, amount: number, note?: string): Promise<PurchaseDocument> {
    const purchase = await this.findOne(id, userId);
    if (amount > purchase.amountRemaining) throw new BadRequestException('Payment exceeds remaining balance');

    // Utiliser PaymentAchatService pour créer le paiement
    const savedPayment = await this.paymentAchatService.createFromAchat(
        userId,
        purchase.FournisseurId.toString(),
        amount,
        purchase._id.toString(),
    );

    // Mettre à jour purchase
    purchase.payments.push(savedPayment._id);
    purchase.amountPaid += amount;
    purchase.amountRemaining -= amount;

    await this.FournisseursService.updateDebt(purchase.FournisseurId.toString(), -amount);

    return purchase.save();
  }

  async remove(id: string, userId: string): Promise<void> {
    const purchase = await this.purchaseModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!purchase) throw new NotFoundException('Purchase not found');

    // Supprimer les paiements associés via PaymentAchatService
    for (const paymentId of purchase.payments) {
      await this.paymentAchatService.remove(paymentId.toString(), userId);
    }

    // Mise à jour stock
    for (const item of purchase.items) {
      await this.productsService.updateStock(item.productId.toString(), item.quantity, 'subtract');
    }

    await this.purchaseModel.findByIdAndDelete(id);
  }


  async getAchatByFournisseur(userId: string, fournisseurId: string) {



    const purchases = await this.purchaseModel
        .find({
          FournisseurId: new Types.ObjectId(fournisseurId),
          userId:        new Types.ObjectId(userId),
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    let totalDebt = 0;
    let totalPaid = 0;

    for (const p of purchases) {
      const ttc  = (p as any).totalTTC      || 0;
      const paid = (p as any).amountPaid    || 0;
      totalPaid += paid;
      if ((p as any).status !== 'paid') {
        totalDebt += ttc - paid;
      }
    }

    return {
      totalDebt,
      totalPaid,
      recentPurchases: purchases,   // tous les achats, pas seulement les 10 premiers
    };
  }


}
