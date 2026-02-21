import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentVente, PaymentVenteDocument } from './entities/payment-vente.entity';
import { CreatePaymentVenteDto } from './dto/create-payment-vente.dto';
import { UpdatePaymentVenteDto } from './dto/update-payment-vente.dto';

@Injectable()
export class PaymentVenteService {

  constructor(
      @InjectModel(PaymentVente.name)
      private paymentVenteModel: Model<PaymentVenteDocument>,
  ) {}

  // ── Créer un paiement vente ─────────────────────────────────────────────────
  async create(createDto: CreatePaymentVenteDto, userId: string): Promise<PaymentVenteDocument> {
    const created = new this.paymentVenteModel({
      ...createDto,
      userId:   new Types.ObjectId(userId),
      clientId: new Types.ObjectId(createDto.clientId),
    });
    return created.save();
  }

  // ── Créer depuis une vente (usage interne depuis VenteService) ──────────────
  // service
  async createFromVente(
      userId: string,
      clientId: string,
      amount: number,
      saleId?: string,   // ← optionnel
      note?: string,
  ): Promise<PaymentVenteDocument> {
    const created = new this.paymentVenteModel({
      userId:   new Types.ObjectId(userId),
      clientId: new Types.ObjectId(clientId),
      ...(saleId && { saleId: new Types.ObjectId(saleId) }), // ← ajouté seulement si présent
      amount,
      date: new Date(),
      note: note || 'Initial payment',
    });
    return created.save();
  }

  // ── Lister les paiements ventes ─────────────────────────────────────────────
  async findAll(
      userId: string,
      filters?: { search?: string; saleId?: string; clientId?: string },
  ): Promise<PaymentVenteDocument[]> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters?.search) {
      query.note = { $regex: filters.search, $options: 'i' };
    }
    if (filters?.saleId) {
      query.saleId = new Types.ObjectId(filters.saleId);
    }
    if (filters?.clientId) {
      query.clientId = new Types.ObjectId(filters.clientId);
    }

    return this.paymentVenteModel.find(query).sort({ date: -1 }).exec();
  }

  // ── Trouver un paiement par ID ──────────────────────────────────────────────
  async findOne(id: string, userId: string): Promise<PaymentVenteDocument> {
    const paiement = await this.paymentVenteModel.findById(id);
    if (!paiement) throw new NotFoundException('Paiement non trouvé');
    if (paiement.userId.toString() !== userId) throw new ForbiddenException();
    return paiement;
  }

  // ── Modifier un paiement ────────────────────────────────────────────────────
  async update(
      id: string,
      userId: string,
      updateDto: UpdatePaymentVenteDto,
  ): Promise<PaymentVenteDocument> {
    const paiement = await this.paymentVenteModel.findById(id);
    if (!paiement) throw new NotFoundException('Paiement non trouvé');
    if (paiement.userId.toString() !== userId) throw new ForbiddenException();

    if (updateDto.amount !== undefined) paiement.amount = updateDto.amount;
    if (updateDto.note   !== undefined) paiement.note   = updateDto.note;
    if (updateDto.date   !== undefined) paiement.date   = new Date(updateDto.date);

    return paiement.save();
  }

  // ── Supprimer un paiement ───────────────────────────────────────────────────
  async remove(id: string, userId: string): Promise<{ message: string }> {
    const paiement = await this.paymentVenteModel.findById(id);
    if (!paiement) throw new NotFoundException('Paiement non trouvé');
    if (paiement.userId.toString() !== userId) throw new ForbiddenException();

    await paiement.deleteOne();
    return { message: 'Paiement supprimé avec succès' };
  }

  // ── Paiements par client ────────────────────────────────────────────────────
  async getPaymentVenteByUserAndClient(
      userId: string,
      clientId: string,
  ): Promise<PaymentVenteDocument[]> {
    return this.paymentVenteModel
        .find({
          userId:   new Types.ObjectId(userId),
          clientId: new Types.ObjectId(clientId),
        })
        .sort({ date: -1 })
        .exec();
  }

  // ── Paiements par vente ─────────────────────────────────────────────────────
  async getPaymentVenteBySaleId(
      userId: string,
      saleId: string,
  ): Promise<PaymentVenteDocument[]> {
    return this.paymentVenteModel
        .find({
          userId: new Types.ObjectId(userId),
          saleId: new Types.ObjectId(saleId),
        })
        .sort({ date: -1 })
        .exec();
  }

  // ── Stats agrégées par client ───────────────────────────────────────────────
  async getStatsByClient(userId: string, clientId: string) {
    return this.paymentVenteModel.aggregate([
      {
        $match: {
          userId:   new Types.ObjectId(userId),
          clientId: new Types.ObjectId(clientId),
        },
      },
      {
        $group: {
          _id:        null,
          totalPaid:  { $sum: '$amount' },
          count:      { $sum: 1 },
          lastPayment: { $max: '$date' },
        },
      },
    ]);
  }
}