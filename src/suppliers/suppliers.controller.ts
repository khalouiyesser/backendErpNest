import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {PurchasesService} from "../purchases/purchases.service";

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService,
              private readonly purchaseService: PurchasesService,) {}

  @Post()
  create(@Body() dto: CreateSupplierDto, @Request() req) {
    return this.suppliersService.create(dto, req.user.userId);
  }

  @Get()
  findAll(@Request() req, @Query('search') search?: string, @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: 'asc' | 'desc') {
    return this.suppliersService.findAll(req.user.userId, { search, sortBy, sortOrder });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.suppliersService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto, @Request() req) {
    return this.suppliersService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.suppliersService.remove(id, req.user.userId);
  }

  @Get('userId/:idUser/fournisseurId/:fournisseurId/purchases')
  async getSupplierPurchases(
      @Param('idUser') idUser: string,
      @Param('fournisseurId') fournisseurId: string,
  ) {


    return await this.purchaseService.getAchatByFournisseur(idUser, fournisseurId);
  }
}
