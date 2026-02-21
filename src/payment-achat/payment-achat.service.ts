import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePaymentAchatDto } from './dto/create-payment-achat.dto';
import { UpdatePaymentAchatDto } from './dto/update-payment-achat.dto';
import { PaymentAchat, PaymentAchatDocument } from './entities/payment-achat.entity';

@Injectable()
export class PaymentAchatService {
  constructor(
      @InjectModel(PaymentAchat.name)
      private paymentAchatModel: Model<PaymentAchatDocument>,
  ) {}

  async create(createDto: CreatePaymentAchatDto, userId: string) {
    const created = new this.paymentAchatModel({
      ...createDto,
      userId: new Types.ObjectId(userId),
    });
    return created.save();
  }


  async createFromAchat(
      userId: string,
      fournisseurId: string,
      amount: number,
      purchaseId: string,
  ): Promise<PaymentAchatDocument> { // ⚡ important
    const created = new this.paymentAchatModel({
      userId: new Types.ObjectId(userId),
      fournisseurId: new Types.ObjectId(fournisseurId),
      amount,
      purchaseId: new Types.ObjectId(purchaseId),
    });

    return await created.save(); // _id sera disponible ici
  }

  async findAll(userId: string, filters?: { search?: string; purchaseId?: string }) {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters?.search) {
      query.note = { $regex: filters.search, $options: 'i' };
    }

    if (filters?.purchaseId) {
      query.purchaseId = new Types.ObjectId(filters.purchaseId);
    }

    return this.paymentAchatModel.find(query).sort({ date: -1 }).exec();
  }

  async findOne(id: string, userId: string) {
    const paiement = await this.paymentAchatModel.findById(id);
    if (!paiement) throw new NotFoundException('Paiement non trouvé');
    if (paiement.userId.toString() !== userId) throw new ForbiddenException();
    return paiement;
  }

  async update(id: string, userId: string, updateDto: UpdatePaymentAchatDto) {
    const paiement = await this.paymentAchatModel.findById(id);
    if (!paiement) throw new NotFoundException('Paiement non trouvé');
    if (paiement.userId.toString() !== userId) throw new ForbiddenException();

    paiement.amount = updateDto.amount;
    return paiement.save();
  }

  async remove(id: string, userId: string) {
    const paiement = await this.paymentAchatModel.findById(id);
    if (!paiement) throw new NotFoundException('Paiement non trouvé');
    if (paiement.userId.toString() !== userId) throw new ForbiddenException();

    await paiement.deleteOne();
    return { message: 'Paiement supprimé avec succès' };
  }


  async getPaymentAchatByUserAndFournisseur(
      idUser: string,
      idFournisseur: string,
  ) {
    return this.paymentAchatModel.find({
      userId: new Types.ObjectId(idUser),
      fournisseurId: new Types.ObjectId(idFournisseur),
    });
  }

}
