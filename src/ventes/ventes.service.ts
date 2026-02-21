import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateVenteDto } from './dto/create-sale.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { ProductsService } from '../products/products.service';
import { ClientsService } from '../clients/clients.service';
import {PaymentAchatService} from "../payment-achat/payment-achat.service";
import {PaymentVenteService} from "../payment-vente/payment-vente.service";
import {Vente, VenteDocument, Ventestatus} from "./vente.schema";

@Injectable()
export class VentesService {
  constructor(
      @InjectModel(Vente.name) private saleModel: Model<VenteDocument>,
      private productsService: ProductsService,
      @Inject(forwardRef(() => ClientsService))
      private clientsService: ClientsService,
      @Inject(forwardRef(() => ClientsService))
      private paymentVenteService: PaymentVenteService,
  ) {}



  async create(dto: CreateVenteDto, userId: string): Promise<VenteDocument> {
    const client = await this.clientsService.findOne(dto.clientId, userId);

    let totalHT = 0;
    let totalTTC = 0;
    const items = dto.items.map((item) => {
      const tva = item.tva || 0;
      const lineHT = item.quantity * item.unitPrice;
      const lineTTC = lineHT * (1 + tva / 100);
      totalHT += lineHT;
      totalTTC += lineTTC;
      return {
        productId:   new Types.ObjectId(item.productId),
        productName: item.productName,
        quantity:    item.quantity,
        unitPrice:   item.unitPrice,
        tva,
        totalHT:  lineHT,
        totalTTC: lineTTC,
      };
    });

    const initialPayment  = dto.initialPayment || 0;
    const amountRemaining = totalTTC - initialPayment;
    let status = Ventestatus.PENDING;
    if (initialPayment >= totalTTC) status = Ventestatus.PAID;
    else if (initialPayment > 0)    status = Ventestatus.PARTIAL;

    const payments = initialPayment > 0
        ? [{ amount: initialPayment, date: new Date(), note: 'Initial payment' }]
        : [];

    const sale = new this.saleModel({
      clientId:        new Types.ObjectId(dto.clientId),
      clientName:      client.name,
      items,
      totalHT,
      totalTTC,
      amountPaid: initialPayment,
      amountRemaining,
      payments,
      status,
      notes:  dto.notes,
      userId: new Types.ObjectId(userId),
    });

    // ✅ Sauvegarder d'abord pour avoir le _id
    const saved = await sale.save();

    // ✅ Créer le PaymentVente externe avec saleId correct
    if (initialPayment > 0) {
      await this.paymentVenteService.createFromVente(
          userId,
          dto.clientId,
          initialPayment,
          saved._id.toString(), // ✅ saleId disponible après save()
          'Initial payment',
      );
    }

    // ✅ Mettre à jour le stock
    for (const item of dto.items) {
      await this.productsService.updateStock(item.productId, item.quantity, 'subtract');
    }

    return saved;
  }

  async findAll(
      userId: string,
      query?: { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; status?: string },
  ): Promise<VenteDocument[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query?.search) {
      filter.$or = [{ clientName: { $regex: query.search, $options: 'i' } }];
    }
    if (query?.status) filter.status = query.status;
    const sort: any = query?.sortBy
        ? { [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1 }
        : { createdAt: -1 };
    return this.saleModel.find(filter).sort(sort).exec();
  }

  async findOne(id: string, userId: string): Promise<VenteDocument> {
    const sale = await this.saleModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  // ✅ Nouvelle méthode pour récupérer les achats d'un client
  async findByClient(clientId: string, userId: string, limit = 10): Promise<VenteDocument[]> {
    return this.saleModel
        .find({
          clientId: new Types.ObjectId(clientId),
          userId: new Types.ObjectId(userId),
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
  }

  async addPayment(id: string, userId: string, dto: AddPaymentDto): Promise<VenteDocument> {
    const sale = await this.findOne(id, userId);

    if (dto.amount > sale.amountRemaining) {
      throw new BadRequestException(
          `Payment amount exceeds remaining balance (${sale.amountRemaining})`,
      );
    }

    const newAmountPaid = sale.amountPaid + dto.amount;
    const newAmountRemaining = sale.totalTTC - newAmountPaid;
    let status: Ventestatus;
    if (newAmountRemaining <= 0) status = Ventestatus.PAID;
    else if (newAmountPaid > 0) status = Ventestatus.PARTIAL;
    else status = Ventestatus.PENDING;

    const updated = await this.saleModel.findByIdAndUpdate(
        id,
        {
          $push: { payments: { amount: dto.amount, date: new Date(), note: dto.note || '' } },
          $set: { amountPaid: newAmountPaid, amountRemaining: newAmountRemaining, status },
        },
        { new: true },
    );
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const sale = await this.saleModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!sale) throw new NotFoundException('Sale not found');

    for (const item of sale.items) {
      await this.productsService.updateStock(item.productId.toString(), item.quantity, 'add');
    }

    await this.saleModel.findByIdAndDelete(id);
  }

  async getStatsByClient(clientId: string, userId: string) {
    return this.saleModel.aggregate([
      {
        $match: {
          clientId: new Types.ObjectId(clientId),
          userId: new Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalTTC' },
          totalPaid: { $sum: '$amountPaid' },
          count: { $sum: 1 },
        },
      },
    ]);
  }
}