import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Purchase, PurchaseDocument } from '../purchases/purchase.schema';
import { Product, ProductDocument } from '../products/product.schema';
import { Client, ClientDocument } from '../clients/client.schema';
import {Vente, VenteDocument} from "../ventes/vente.schema";

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Vente.name) private saleModel: Model<VenteDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
  ) {}

  async getDashboard(userId: string) {
    const uid = new Types.ObjectId(userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRevenue,
      monthRevenue,
      totalPurchases,
      monthPurchases,
      totalClients,
      activeClients,
      totalProducts,
      lowStockCount,
      topClients,
      recentVentes,
      monthlyVentes,
    ] = await Promise.all([
      this.saleModel.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: null, total: { $sum: '$totalTTC' }, paid: { $sum: '$amountPaid' } } },
      ]),
      this.saleModel.aggregate([
        { $match: { userId: uid, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalTTC' }, paid: { $sum: '$amountPaid' } } },
      ]),
      this.purchaseModel.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: null, total: { $sum: '$totalTTC' } } },
      ]),
      this.purchaseModel.aggregate([
        { $match: { userId: uid, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalTTC' } } },
      ]),
      this.clientModel.countDocuments({ userId: uid }),
      this.clientModel.countDocuments({ userId: uid, isActive: true }),
      this.productModel.countDocuments({ userId: uid }),
      this.productModel.countDocuments({
        userId: uid,
        $expr: { $and: [{ $gt: ['$stockThreshold', 0] }, { $lte: ['$stockQuantity', '$stockThreshold'] }] },
      }),
      // Top clients by revenue
      this.saleModel.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: '$clientId', clientName: { $first: '$clientName' }, revenue: { $sum: '$totalTTC' } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      // Recent Ventes
      this.saleModel.find({ userId: uid }).sort({ createdAt: -1 }).limit(5),
      // Monthly Ventes for chart (last 6 months)
      this.saleModel.aggregate([
        { $match: { userId: uid, createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$totalTTC' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    return {
      overview: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalRevenuePaid: totalRevenue[0]?.paid || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        monthRevenuePaid: monthRevenue[0]?.paid || 0,
        totalPurchases: totalPurchases[0]?.total || 0,
        monthPurchases: monthPurchases[0]?.total || 0,
        totalClients,
        activeClients,
        totalProducts,
        lowStockCount,
      },
      topClients,
      recentVentes,
      monthlyVentes,
    };
  }
}
