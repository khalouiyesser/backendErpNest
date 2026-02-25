import { Injectable, NotFoundException, ConflictException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Client, ClientDocument } from './client.schema';
import { VentesService } from '../ventes/ventes.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @Inject(forwardRef(() => VentesService)) private ventesService: VentesService,
  ) {}

  async create(dto: any, userId: string, userName: string, companyId: string): Promise<ClientDocument> {
    const existing = await this.clientModel.findOne({ phone: dto.phone, companyId: new Types.ObjectId(companyId) });
    if (existing) throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
    const client = new this.clientModel({
      ...dto,
      companyId: new Types.ObjectId(companyId),
      createdBy: new Types.ObjectId(userId),
      createdByName: userName,
    });
    return client.save();
  }

  async findAll(companyId: string, query?: any): Promise<ClientDocument[]> {
    const filter: any = { companyId: new Types.ObjectId(companyId) };
    if (query?.search) filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
    if (query?.isActive !== undefined) filter.isActive = query.isActive === 'true';
    const sort: any = query?.sortBy ? { [query.sortBy]: query.sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 };
    return this.clientModel.find(filter).sort(sort).exec();
  }

  async findOne(id: string, companyId: string): Promise<ClientDocument> {
    const client = await this.clientModel.findOne({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  async update(id: string, companyId: string, dto: any, userId: string, userName: string): Promise<ClientDocument> {
    const client = await this.clientModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) },
      { ...dto, updatedByName: userName },
      { new: true },
    );
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  async remove(id: string, companyId: string): Promise<void> {
    const client = await this.clientModel.findOneAndDelete({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) });
    if (!client) throw new NotFoundException('Client introuvable');
  }

  async getClientStats(clientId: string, companyId: string) {
    const client = await this.findOne(clientId, companyId);
    const [stats, recentSales] = await Promise.all([
      this.ventesService.getStatsByClient(clientId, companyId),
      this.ventesService.findByClient(clientId, companyId, 100),
    ]);
    const agg = stats[0] || { totalRevenue: 0, totalPaid: 0, count: 0 };
    return {
      client,
      creditAvailable: (client.creditLimit || 0) - (client.creditUsed || 0),
      totalRevenue: agg.totalRevenue,
      totalPaid: agg.totalPaid,
      totalCredit: agg.totalRevenue - agg.totalPaid,
      count: agg.count,
      recentSales,
    };
  }

  async findByClientForExport(clientId: string, companyId: string, startDate?: string, endDate?: string) {
    return this.ventesService.findByClientForExport(clientId, companyId, startDate, endDate);
  }

  async updateCredit(clientId: string, amount: number, companyId: string): Promise<void> {
    await this.clientModel.findOneAndUpdate(
      { _id: new Types.ObjectId(clientId), companyId: new Types.ObjectId(companyId) },
      { $inc: { creditUsed: amount } },
    );
  }
}
