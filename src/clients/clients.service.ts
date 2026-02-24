import {
  Injectable,
  NotFoundException,
  ConflictException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Client, ClientDocument } from './client.schema';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { VentesService } from '../ventes/ventes.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @Inject(forwardRef(() => VentesService))
    private VenteService: VentesService,
  ) {}

  async create(createClientDto: CreateClientDto, userId: string): Promise<ClientDocument> {
    const existing = await this.clientModel.findOne({
      phone: createClientDto.phone,
      userId: new Types.ObjectId(userId),
    });
    if (existing) throw new ConflictException('Ce numéro de téléphone est déjà utilisé');

    const client = new this.clientModel({
      ...createClientDto,
      userId: new Types.ObjectId(userId),
    });
    return client.save();
  }

  async findAll(
    userId: string,
    query?: { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; isActive?: boolean },
  ): Promise<ClientDocument[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { sector: { $regex: query.search, $options: 'i' } },
        { firstName: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    const sort: any = {};
    if (query?.sortBy) {
      sort[query.sortBy] = query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    return this.clientModel.find(filter).sort(sort).exec();
  }

  async findOne(id: string, userId: string): Promise<ClientDocument> {
    const client = await this.clientModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  async update(id: string, userId: string, updateClientDto: UpdateClientDto): Promise<ClientDocument> {
    const client = await this.clientModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      updateClientDto,
      { new: true },
    );
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  async remove(id: string, userId: string): Promise<void> {
    const client = await this.clientModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!client) throw new NotFoundException('Client introuvable');
  }

  async getClientStats(clientId: string, userId: string) {
    const client = await this.findOne(clientId, userId);

    const [stats, recentSales] = await Promise.all([
      this.VenteService.getStatsByClient(clientId, userId),
      this.VenteService.findByClient(clientId, userId, 100),
    ]);

    const aggregated = stats[0] || { totalRevenue: 0, totalPaid: 0, count: 0 };

    return {
      client,
      creditAvailable: (client.creditLimit || 0) - (client.creditUsed || 0),
      totalRevenue: aggregated.totalRevenue,
      totalPaid: aggregated.totalPaid,
      totalCredit: aggregated.totalRevenue - aggregated.totalPaid,
      count: aggregated.count,
      recentSales, // ← Correction: était "recentVentes", le front attend "recentSales"
    };
  }


  async getClients(){
    return await this.clientModel.find().exec();
  }

  async updateCredit(clientId: string, amount: number, userId: string): Promise<void> {
    await this.clientModel.findOneAndUpdate(
      { _id: new Types.ObjectId(clientId), userId: new Types.ObjectId(userId) },
      { $inc: { creditUsed: amount } },
    );
  }
}
