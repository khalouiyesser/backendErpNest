import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateVenteDto } from './dto/create-sale.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { ProductsService } from '../products/products.service';
import { ClientsService } from '../clients/clients.service';
import { PaymentVenteService } from '../payment-vente/payment-vente.service';
import { Vente, VenteDocument, Ventestatus } from './vente.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.schema';
import { StockService } from '../stock/stock.service';
import { MovementType, MovementSource } from '../stock/stock-movement.schema';

@Injectable()
export class VentesService {
  constructor(
    @InjectModel(Vente.name) private saleModel: Model<VenteDocument>,
    private productsService: ProductsService,
    @Inject(forwardRef(() => ClientsService))
    private clientsService: ClientsService,
    private paymentVenteService: PaymentVenteService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => StockService))
    private stockService: StockService,
  ) {}

  async create(dto: CreateVenteDto, userId: string): Promise<VenteDocument> {
    const client = await this.clientsService.findOne(dto.clientId, userId);

    // ── Vérifier le stock AVANT de créer la vente ──────────────────────────
    for (const item of dto.items) {
      const product = await this.productsService.findOne(item.productId, userId);
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Stock insuffisant pour "${product.name}". ` +
          `Disponible: ${product.stockQuantity} ${product.unit}, demandé: ${item.quantity}`,
        );
      }
    }

    let totalHT = 0;
    let totalTTC = 0;

    const items = dto.items.map((item) => {
      const tva = item.tva ?? 0;
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
    let status = Ventestatus.PENDING;
    if (initialPayment >= totalTTC) status = Ventestatus.PAID;
    else if (initialPayment > 0) status = Ventestatus.PARTIAL;

    const payments =
      initialPayment > 0
        ? [{ amount: initialPayment, date: new Date(), note: 'Paiement initial' }]
        : [];

    const sale = new this.saleModel({
      clientId: new Types.ObjectId(dto.clientId),
      clientName: client.name,
      items,
      totalHT,
      totalTTC,
      amountPaid: initialPayment,
      amountRemaining,
      payments,
      status,
      notes: dto.notes,
      paymentMethod: dto.paymentMethod,
      userId: new Types.ObjectId(userId),
    });

    const saved = await sale.save();

    if (initialPayment > 0) {
      await this.paymentVenteService.createFromVente(
        userId,
        dto.clientId,
        initialPayment,
        saved._id.toString(),
        'Paiement initial',
      );
    }

    // ── Mettre à jour le stock + enregistrer les mouvements ────────────────
    for (const item of dto.items) {
      const product = await this.productsService.findOne(item.productId, userId);
      const stockBefore = product.stockQuantity;
      const stockAfter = stockBefore - item.quantity;

      await this.productsService.updateStock(item.productId, item.quantity, 'subtract');

      // Enregistrer le mouvement de stock
      await this.stockService.recordMovement({
        productId: item.productId,
        productName: item.productName,
        type: MovementType.OUT,
        source: MovementSource.SALE,
        quantity: item.quantity,
        stockBefore,
        stockAfter,
        referenceId: saved._id.toString(),
        notes: `Vente #${saved._id}`,
        userId,
      });

      // ── Vérifier rupture de stock APRÈS la vente ─────────────────────────
      if (stockAfter <= 0) {
        await this.notificationsService.create({
          title: '🚨 Rupture de stock',
          message: `Le produit "${item.productName}" est en rupture de stock (stock = ${stockAfter}).`,
          type: NotificationType.LOW_STOCK,
          link: '/products',
          userId,
        });
      } else if (product.stockThreshold > 0 && stockAfter <= product.stockThreshold) {
        await this.notificationsService.create({
          title: '⚠️ Stock faible',
          message: `Le produit "${item.productName}" est proche du seuil minimal (${stockAfter}/${product.stockThreshold}).`,
          type: NotificationType.LOW_STOCK,
          link: '/products',
          userId,
        });
      }
    }

    return saved;
  }

  async findAll(
    userId: string,
    query?: {
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      status?: string;
    },
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
    if (!sale) throw new NotFoundException('Vente introuvable');
    return sale;
  }

  async findByClient(
    clientId: string,
    userId: string,
    limit = 100,
  ): Promise<VenteDocument[]> {
    return this.saleModel
      .find({
        clientId: new Types.ObjectId(clientId),
        userId: new Types.ObjectId(userId),
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async addPayment(
    id: string,
    userId: string,
    dto: AddPaymentDto,
  ): Promise<VenteDocument> {
    const sale = await this.findOne(id, userId);

    if (dto.amount > sale.amountRemaining + 0.001) {
      throw new BadRequestException(
        `Le montant (${dto.amount}) dépasse le reste à payer (${sale.amountRemaining})`,
      );
    }

    const newAmountPaid = sale.amountPaid + dto.amount;
    const newAmountRemaining = Math.max(0, sale.totalTTC - newAmountPaid);
    let status: Ventestatus;
    if (newAmountRemaining <= 0) status = Ventestatus.PAID;
    else if (newAmountPaid > 0) status = Ventestatus.PARTIAL;
    else status = Ventestatus.PENDING;

    const updated = await this.saleModel.findByIdAndUpdate(
      id,
      {
        $push: {
          payments: {
            amount: dto.amount,
            date: new Date(),
            note: dto.note || '',
            method: (dto as any).method || 'cash',
          },
        },
        $set: { amountPaid: newAmountPaid, amountRemaining: newAmountRemaining, status },
      },
      { new: true },
    );
    return updated;
  }

  async removePayment(
    id: string,
    paymentId: string,
    userId: string,
  ): Promise<VenteDocument> {
    const sale = await this.findOne(id, userId);
    const payment = (sale.payments as any[]).find(
      (p) => p._id?.toString() === paymentId,
    );
    if (!payment) throw new NotFoundException('Paiement introuvable');

    const newAmountPaid = sale.amountPaid - payment.amount;
    const newAmountRemaining = sale.totalTTC - newAmountPaid;
    let status: Ventestatus;
    if (newAmountPaid <= 0) status = Ventestatus.PENDING;
    else if (newAmountRemaining <= 0) status = Ventestatus.PAID;
    else status = Ventestatus.PARTIAL;

    const updated = await this.saleModel.findByIdAndUpdate(
      id,
      {
        $pull: { payments: { _id: new Types.ObjectId(paymentId) } },
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
    if (!sale) throw new NotFoundException('Vente introuvable');

    for (const item of sale.items) {
      const product = await this.productsService.findOne(
        item.productId.toString(),
        userId,
      ).catch(() => null);
      const stockBefore = product?.stockQuantity ?? 0;
      const stockAfter = stockBefore + item.quantity;

      await this.productsService.updateStock(
        item.productId.toString(),
        item.quantity,
        'add',
      );

      if (product) {
        await this.stockService.recordMovement({
          productId: item.productId.toString(),
          productName: item.productName,
          type: MovementType.IN,
          source: MovementSource.RETURN,
          quantity: item.quantity,
          stockBefore,
          stockAfter,
          referenceId: id,
          notes: `Annulation vente #${id}`,
          userId,
        });
      }
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

  // ── Pour les exports ───────────────────────────────────────────────────────
  async findForExport(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<VenteDocument[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    return this.saleModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findByClientForExport(
    clientId: string,
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<VenteDocument[]> {
    const filter: any = {
      clientId: new Types.ObjectId(clientId),
      userId: new Types.ObjectId(userId),
    };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    return this.saleModel.find(filter).sort({ createdAt: -1 }).exec();
  }
}
