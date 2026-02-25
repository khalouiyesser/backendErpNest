import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Company')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mon profil utilisateur' })
  getMe(@Request() req) { return this.companyService.getMe(req.user.userId); }

  @Patch('me')
  @ApiOperation({ summary: 'Mettre à jour mon profil (nom, thème, avatar...)' })
  updateMe(@Request() req, @Body() dto: any) { return this.companyService.updateMe(req.user.userId, dto); }

  @Get('info')
  @ApiOperation({ summary: 'Infos complètes de ma company' })
  getInfo(@Request() req) { return this.companyService.getMyCompany(req.user.companyId); }

  @Patch('info')
  @UseGuards(RolesGuard)
  @Roles('admin_company')
  @ApiOperation({ summary: 'Modifier ma company (admin_company uniquement)' })
  updateInfo(@Request() req, @Body() dto: any) { return this.companyService.updateMyCompany(req.user.companyId, dto); }

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles('admin_company')
  @ApiOperation({ summary: 'Lister les utilisateurs de la company' })
  getUsers(@Request() req) { return this.companyService.getUsers(req.user.companyId); }

  @Post('users')
  @UseGuards(RolesGuard)
  @Roles('admin_company')
  @ApiOperation({ summary: 'Créer un utilisateur (resource ou admin_company)' })
  createUser(@Request() req, @Body() dto: any) { return this.companyService.createUser(req.user.companyId, dto); }

  @Patch('users/:id')
  @UseGuards(RolesGuard)
  @Roles('admin_company')
  @ApiOperation({ summary: 'Modifier un utilisateur' })
  updateUser(@Request() req, @Param('id') id: string, @Body() dto: any) { return this.companyService.updateUser(req.user.companyId, id, dto); }

  @Delete('users/:id')
  @UseGuards(RolesGuard)
  @Roles('admin_company')
  @ApiOperation({ summary: 'Supprimer un utilisateur (pas l\'admin_company)' })
  deleteUser(@Request() req, @Param('id') id: string) { return this.companyService.deleteUser(req.user.companyId, id); }

  @Post('users/:id/reset-password')
  @UseGuards(RolesGuard)
  @Roles('admin_company')
  @ApiOperation({ summary: 'Réinitialiser mot de passe d\'un utilisateur' })
  resetPassword(@Request() req, @Param('id') id: string) { return this.companyService.resetUserPassword(req.user.companyId, id); }
}
