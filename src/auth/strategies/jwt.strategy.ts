import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, @InjectModel(User.name) private userModel: Model<UserDocument>) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: configService.get<string>('JWT_SECRET') });
  }
  async validate(payload: any) {
    const user = await this.userModel.findById(payload.sub).lean();
    if (!user || !user.isActive) throw new UnauthorizedException('Accès refusé');
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) throw new UnauthorizedException('Compte verrouillé');
    return { userId: (user as any)._id.toString(), email: user.email, role: user.role, companyId: user.companyId?.toString() || null, name: user.name };
  }
}
