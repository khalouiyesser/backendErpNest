import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Purchase, PurchaseDocument } from '../purchases/purchase.schema';
import { Charge, ChargeDocument } from '../charges/charge.schema';
import {Vente, VenteDocument} from "../sales/vente.schema";

@Injectable()
export class AccountingService {
  constructor(
    @InjectModel(Vente.name) private saleModel: Model<VenteDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Charge.name) private chargeModel: Model<ChargeDocument>,
  ) {}

  async getAccountingSummary(userId: string, startDate?: Date, endDate?: Date) {
    const uid = new Types.ObjectId(userId);
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;
    const matchFilter: any = { userId: uid };
    if (startDate || endDate) matchFilter.createdAt = dateFilter;

    const [VentesAgg, purchasesAgg, charges] = await Promise.all([
      this.saleModel.aggregate([
        { $match: matchFilter },
        { $group: { _id: null, totalHT: { $sum: '$totalHT' }, totalTTC: { $sum: '$totalTTC' }, totalPaid: { $sum: '$amountPaid' } } },
      ]),
      this.purchaseModel.aggregate([
        { $match: matchFilter },
        { $group: { _id: null, totalHT: { $sum: '$totalHT' }, totalTTC: { $sum: '$totalTTC' }, totalPaid: { $sum: '$amountPaid' } } },
      ]),
      this.chargeModel.aggregate([
        { $match: { ...matchFilter, ...(startDate || endDate ? { date: dateFilter } : {}) } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const revenue = VentesAgg[0] || { totalHT: 0, totalTTC: 0, totalPaid: 0 };
    const purchases = purchasesAgg[0] || { totalHT: 0, totalTTC: 0, totalPaid: 0 };
    const totalCharges = charges[0]?.total || 0;

    const tvaCollected = revenue.totalTTC - revenue.totalHT;
    const tvaDeductible = purchases.totalTTC - purchases.totalHT;
    const tvaBalance = tvaCollected - tvaDeductible;

    const grossProfit = revenue.totalHT - purchases.totalHT;
    const netProfit = grossProfit - totalCharges;

    return {
      revenue: {
        totalHT: revenue.totalHT,
        totalTTC: revenue.totalTTC,
        totalPaid: revenue.totalPaid,
        outstanding: revenue.totalTTC - revenue.totalPaid,
      },
      purchases: {
        totalHT: purchases.totalHT,
        totalTTC: purchases.totalTTC,
        totalPaid: purchases.totalPaid,
        outstanding: purchases.totalTTC - purchases.totalPaid,
      },
      charges: { total: totalCharges },
      tva: {
        collected: tvaCollected,
        deductible: tvaDeductible,
        balance: tvaBalance,
        toPay: tvaBalance > 0 ? tvaBalance : 0,
        toRefund: tvaBalance < 0 ? Math.abs(tvaBalance) : 0,
      },
      profit: {
        gross: grossProfit,
        net: netProfit,
      },
    };
  }
}
