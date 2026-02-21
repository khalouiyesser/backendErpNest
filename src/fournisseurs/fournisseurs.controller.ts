import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {PurchasesService} from "../purchases/purchases.service";
import {CreateFournisseurDto} from "./dto/create-supplier.dto";
import {FournisseursService} from "./fournisseurs.service";
import {UpdateFournisseurDto} from "./dto/update-supplier.dto";

@ApiTags('Fournisseurs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('Fournisseurs')
export class FournisseursController {
  constructor(private readonly FournisseursService: FournisseursService,
              private readonly purchaseService: PurchasesService,) {}

  @Post()
  create(@Body() dto: CreateFournisseurDto, @Request() req) {
    return this.FournisseursService.create(dto, req.user.userId);
  }

  @Get()
  findAll(@Request() req, @Query('search') search?: string, @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: 'asc' | 'desc') {
    return this.FournisseursService.findAll(req.user.userId, { search, sortBy, sortOrder });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.FournisseursService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFournisseurDto, @Request() req) {
    return this.FournisseursService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.FournisseursService.remove(id, req.user.userId);
  }

  @Get('userId/:idUser/fournisseurId/:fournisseurId/purchases')
  async getFournisseurPurchases(
      @Param('idUser') idUser: string,
      @Param('fournisseurId') fournisseurId: string,
  ) {


    return await this.purchaseService.getAchatByFournisseur(idUser, fournisseurId);
  }
}
