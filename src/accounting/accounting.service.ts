import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vente } from '../ventes/vente.schema';
import { Purchase } from '../purchases/purchase.schema';
import { Charge } from '../charges/charge.schema';

@Injectable()
export class AccountingService {
  constructor(
    @InjectModel(Vente.name) private venteModel: Model<any>,
    @InjectModel(Purchase.name) private purchaseModel: Model<any>,
    @InjectModel(Charge.name) private chargeModel: Model<any>,
  ) {}

  async getSummary(companyId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); dateFilter.$lte = e; }
    const cId = new Types.ObjectId(companyId);
    const dateQ = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [venteAgg, purchaseAgg, chargeAgg, tvaCollected, tvaDeductible] = await Promise.all([
      this.venteModel.aggregate([{ $match: { companyId: cId, ...dateQ } }, { $group: { _id: null, totalTTC: { $sum: '$totalTTC' }, totalPaid: { $sum: '$amountPaid' }, totalRemaining: { $sum: '$amountRemaining' }, totalHT: { $sum: '$totalHT' }, count: { $sum: 1 } } }]),
      this.purchaseModel.aggregate([{ $match: { companyId: cId, ...dateQ } }, { $group: { _id: null, totalTTC: { $sum: '$totalTTC' }, totalPaid: { $sum: '$amountPaid' }, totalHT: { $sum: '$totalHT' }, count: { $sum: 1 } } }]),
      this.chargeModel.aggregate([{ $match: { companyId: cId, ...dateQ } }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
      this.venteModel.aggregate([{ $match: { companyId: cId, ...dateQ } }, { $unwind: '$items' }, { $group: { _id: null, tva: { $sum: { $multiply: ['$items.totalHT', { $divide: ['$items.tva', 100] }] } } } }]),
      this.purchaseModel.aggregate([{ $match: { companyId: cId, ...dateQ } }, { $unwind: '$items' }, { $group: { _id: null, tva: { $sum: { $multiply: ['$items.totalHT', { $divide: ['$items.tva', 100] }] } } } }]),
    ]);

    const ventes = venteAgg[0] || { totalTTC: 0, totalPaid: 0, totalRemaining: 0, totalHT: 0, count: 0 };
    const purchases = purchaseAgg[0] || { totalTTC: 0, totalPaid: 0, totalHT: 0, count: 0 };
    const totalCharges = chargeAgg.reduce((s: number, c: any) => s + c.total, 0);
    const chargesByType = Object.fromEntries(chargeAgg.map((c: any) => [c._id, c.total]));
    const tvaColl = tvaCollected[0]?.tva || 0;
    const tvaDed = tvaDeductible[0]?.tva || 0;

    return {
      period: { startDate, endDate },
      revenue: { totalHT: ventes.totalHT, totalTTC: ventes.totalTTC, totalPaid: ventes.totalPaid, totalRemaining: ventes.totalRemaining, invoiceCount: ventes.count },
      purchases: { totalHT: purchases.totalHT, totalTTC: purchases.totalTTC, totalPaid: purchases.totalPaid, count: purchases.count },
      charges: { total: totalCharges, byType: chargesByType },
      tva: { collected: tvaColl, deductible: tvaDed, balance: tvaColl - tvaDed },
      profit: { grossProfit: ventes.totalHT - purchases.totalHT, netProfit: ventes.totalHT - purchases.totalHT - totalCharges },
    };
  }

  async getMonthlyBreakdown(companyId: string, year: number) {
    const cId = new Types.ObjectId(companyId);
    const [ventesMonthly, purchasesMonthly] = await Promise.all([
      this.venteModel.aggregate([{ $match: { companyId: cId, createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } }, { $group: { _id: { month: { $month: '$createdAt' } }, revenue: { $sum: '$totalTTC' }, paid: { $sum: '$amountPaid' } } }]),
      this.purchaseModel.aggregate([{ $match: { companyId: cId, createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } }, { $group: { _id: { month: { $month: '$createdAt' } }, purchases: { $sum: '$totalTTC' } } }]),
    ]);
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const v = ventesMonthly.find((x: any) => x._id.month === m);
      const p = purchasesMonthly.find((x: any) => x._id.month === m);
      return { month: m, revenue: v?.revenue || 0, paid: v?.paid || 0, purchases: p?.purchases || 0 };
    });
    return { year, months };
  }
}
