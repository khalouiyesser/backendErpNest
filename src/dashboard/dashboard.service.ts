import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vente } from '../ventes/vente.schema';
import { Purchase } from '../purchases/purchase.schema';
import { Client } from '../clients/client.schema';
import { Product } from '../products/product.schema';
import { Charge } from '../charges/charge.schema';
import { Notification } from '../notifications/notification.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Vente.name) private venteModel: Model<any>,
    @InjectModel(Purchase.name) private purchaseModel: Model<any>,
    @InjectModel(Client.name) private clientModel: Model<any>,
    @InjectModel(Product.name) private productModel: Model<any>,
    @InjectModel(Charge.name) private chargeModel: Model<any>,
    @InjectModel(Notification.name) private notifModel: Model<any>,
  ) {}

  async getKpis(companyId: string) {
    const cId = new Types.ObjectId(companyId);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);

    const [ventesTotal, ventesMonth, purchasesTotal, clientsTotal, productsLowStock, chargesMonth, unreadNotifs, recentSales, topClients] = await Promise.all([
      this.venteModel.aggregate([{ $match: { companyId: cId } }, { $group: { _id: null, total: { $sum: '$totalTTC' }, paid: { $sum: '$amountPaid' }, remaining: { $sum: '$amountRemaining' } } }]),
      this.venteModel.aggregate([{ $match: { companyId: cId, createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$totalTTC' }, count: { $sum: 1 } } }]),
      this.purchaseModel.aggregate([{ $match: { companyId: cId } }, { $group: { _id: null, total: { $sum: '$totalTTC' }, debt: { $sum: '$amountRemaining' } } }]),
      this.clientModel.countDocuments({ companyId: cId, isActive: true }),
      this.productModel.find({ companyId: cId, $expr: { $lte: ['$stockQuantity', '$stockThreshold'] } }).limit(10).lean(),
      this.chargeModel.aggregate([{ $match: { companyId: cId, date: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      this.notifModel.countDocuments({ companyId: cId, isRead: false }),
      this.venteModel.find({ companyId: cId }).sort({ createdAt: -1 }).limit(5).lean(),
      this.venteModel.aggregate([{ $match: { companyId: cId } }, { $group: { _id: '$clientId', clientName: { $first: '$clientName' }, total: { $sum: '$totalTTC' } } }, { $sort: { total: -1 } }, { $limit: 5 }]),
    ]);

    const v = ventesTotal[0] || { total: 0, paid: 0, remaining: 0 };
    const vm = ventesMonth[0] || { total: 0, count: 0 };
    const p = purchasesTotal[0] || { total: 0, debt: 0 };
    return {
      revenue: { total: v.total, paid: v.paid, remaining: v.remaining },
      revenueThisMonth: { total: vm.total, count: vm.count },
      purchases: { total: p.total, debt: p.debt },
      clients: { active: clientsTotal },
      lowStockProducts: productsLowStock,
      chargesThisMonth: chargesMonth[0]?.total || 0,
      unreadNotifications: unreadNotifs,
      recentSales,
      topClients,
    };
  }
}
