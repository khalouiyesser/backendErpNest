import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User, UserDocument } from './user.schema';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  @Get('me')
  @ApiOperation({ summary: 'Mon profil utilisateur' })
  getMe(@Request() req) {
    return this.userModel.findById(req.user.userId).select('-password').lean();
  }

  @Patch('me')
  @ApiOperation({ summary: 'Modifier mon profil' })
  updateMe(
    @Request() req,
    @Body() dto: { name?: string; phone?: string; theme?: string; position?: string; avatarUrl?: string },
  ) {
    const allowed = ['name', 'phone', 'theme', 'position', 'avatarUrl'];
    const update: Record<string, any> = {};
    allowed.forEach(k => { if ((dto as any)[k] !== undefined) update[k] = (dto as any)[k]; });
    return this.userModel.findByIdAndUpdate(req.user.userId, update, { new: true }).select('-password');
  }
}
