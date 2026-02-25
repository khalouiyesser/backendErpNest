import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Company, CompanyDocument } from './company.schema';
import { User, UserDocument, UserRole } from '../users/user.schema';
import { MailService } from '../common/services/mail.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailService: MailService,
  ) {}

  async getMyCompany(companyId: string): Promise<CompanyDocument> {
    const c = await this.companyModel.findById(companyId);
    if (!c) throw new NotFoundException('Company introuvable');
    return c;
  }

  async updateMyCompany(companyId: string, dto: any): Promise<CompanyDocument> {
    const c = await this.companyModel.findByIdAndUpdate(companyId, dto, { new: true });
    if (!c) throw new NotFoundException('Company introuvable');
    return c;
  }

  async getUsers(companyId: string) {
    return this.userModel.find({ companyId: new Types.ObjectId(companyId) }).select('-password').sort({ createdAt: -1 }).lean();
  }

  async createUser(companyId: string, dto: any): Promise<{ user: any; tempPassword: string }> {
    const existing = await this.userModel.findOne({ email: dto.email?.toLowerCase() });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');
    const tempPassword = this.genPassword();
    const user = new this.userModel({ ...dto, email: dto.email?.toLowerCase(), password: await bcrypt.hash(tempPassword, 12), companyId: new Types.ObjectId(companyId), role: dto.role || UserRole.RESOURCE, mustChangePassword: true, isActive: true });
    await user.save();
    await this.mailService.sendWelcomeEmail(user.email, user.name, tempPassword);
    const u = user.toObject() as any; delete u.password;
    return { user: u, tempPassword };
  }

  async updateUser(companyId: string, userId: string, dto: any) {
    const user = await this.userModel.findOneAndUpdate(
      { _id: new Types.ObjectId(userId), companyId: new Types.ObjectId(companyId) }, dto, { new: true }
    ).select('-password');
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async deleteUser(companyId: string, userId: string) {
    const user = await this.userModel.findOneAndDelete({ _id: new Types.ObjectId(userId), companyId: new Types.ObjectId(companyId), role: { $ne: UserRole.ADMIN_COMPANY } });
    if (!user) throw new NotFoundException("Introuvable ou impossible de supprimer l'admin company");
    return { message: 'Utilisateur supprimé' };
  }

  async resetUserPassword(companyId: string, userId: string) {
    const user = await this.userModel.findOne({ _id: new Types.ObjectId(userId), companyId: new Types.ObjectId(companyId) });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    const tempPassword = this.genPassword();
    user.password = await bcrypt.hash(tempPassword, 12);
    user.mustChangePassword = true;
    await user.save();
    await this.mailService.sendWelcomeEmail(user.email, user.name, tempPassword);
    return { message: 'Mot de passe réinitialisé, email envoyé' };
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).select('-password').lean();
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async updateMe(userId: string, dto: any) {
    const { role, companyId, ...safe } = dto; // prevent role escalation
    const user = await this.userModel.findByIdAndUpdate(userId, safe, { new: true }).select('-password');
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  private genPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#!';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
