import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vente } from '../ventes/vente.schema';
import { Purchase } from '../purchases/purchase.schema';
import { Charge } from '../charges/charge.schema';
import { Product } from '../products/product.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Vente.name) private venteModel: Model<any>,
    @InjectModel(Purchase.name) private purchaseModel: Model<any>,
    @InjectModel(Charge.name) private chargeModel: Model<any>,
    @InjectModel(Product.name) private productModel: Model<any>,
  ) {}

  private buildDateFilter(startDate?: string, endDate?: string) {
    const f: any = {};
    if (startDate) f.$gte = new Date(startDate);
    if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); f.$lte = e; }
    return Object.keys(f).length ? f : null;
  }

  async getSalesReport(companyId: string, startDate?: string, endDate?: string) {
    const cId = new Types.ObjectId(companyId);
    const dateF = this.buildDateFilter(startDate, endDate);
    const match: any = { companyId: cId };
    if (dateF) match.createdAt = dateF;
    const [sales, byStatus, byUser] = await Promise.all([
      this.venteModel.find(match).sort({ createdAt: -1 }).lean(),
      this.venteModel.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalTTC' } } }]),
      this.venteModel.aggregate([{ $match: match }, { $group: { _id: { by: '$createdByName' }, count: { $sum: 1 }, total: { $sum: '$totalTTC' } } }, { $sort: { total: -1 } }]),
    ]);
    const totals = sales.reduce((acc: any, s: any) => ({ total: acc.total + s.totalTTC, paid: acc.paid + s.amountPaid, remaining: acc.remaining + s.amountRemaining }), { total: 0, paid: 0, remaining: 0 });
    return { period: { startDate, endDate }, totals, count: sales.length, byStatus, byUser, sales };
  }

  async getPurchasesReport(companyId: string, startDate?: string, endDate?: string) {
    const cId = new Types.ObjectId(companyId);
    const dateF = this.buildDateFilter(startDate, endDate);
    const match: any = { companyId: cId };
    if (dateF) match.createdAt = dateF;
    const [purchases, byStatus] = await Promise.all([
      this.purchaseModel.find(match).sort({ createdAt: -1 }).lean(),
      this.purchaseModel.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalTTC' } } }]),
    ]);
    const totals = purchases.reduce((acc: any, p: any) => ({ total: acc.total + p.totalTTC, paid: acc.paid + p.amountPaid }), { total: 0, paid: 0 });
    return { period: { startDate, endDate }, totals, count: purchases.length, byStatus, purchases };
  }

  async getStockReport(companyId: string) {
    const cId = new Types.ObjectId(companyId);
    const [products, lowStockCount, outOfStockCount] = await Promise.all([
      this.productModel.find({ companyId: cId }).sort({ stockQuantity: 1 }).lean(),
      this.productModel.countDocuments({ companyId: cId, $expr: { $lte: ['$stockQuantity', '$stockThreshold'] } }),
      this.productModel.countDocuments({ companyId: cId, stockQuantity: 0 }),
    ]);
    const totalValue = products.reduce((s: number, p: any) => s + (p.stockQuantity * (p.purchasePrice || 0)), 0);
    return { products, count: products.length, lowStockCount, outOfStockCount, totalStockValue: totalValue };
  }

  async getChargesReport(companyId: string, startDate?: string, endDate?: string) {
    const cId = new Types.ObjectId(companyId);
    const dateF = this.buildDateFilter(startDate, endDate);
    const match: any = { companyId: cId };
    if (dateF) match.date = dateF;
    const [charges, byType] = await Promise.all([
      this.chargeModel.find(match).sort({ date: -1 }).lean(),
      this.chargeModel.aggregate([{ $match: match }, { $group: { _id: '$type', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
    ]);
    const total = charges.reduce((s: number, c: any) => s + c.amount, 0);
    return { period: { startDate, endDate }, total, count: charges.length, byType, charges };
  }
}
