import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FournisseursService } from './fournisseurs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Fournisseurs')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('fournisseurs')
export class FournisseursController {
  constructor(private readonly fournisseursService: FournisseursService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un fournisseur' })
  create(@Body() dto: any, @Request() req) {
    return this.fournisseursService.create(dto, req.user.userId, req.user.name, req.user.companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les fournisseurs' })
  findAll(@Request() req, @Query('search') search?: string, @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: 'asc'|'desc') {
    return this.fournisseursService.findAll(req.user.companyId, { search, sortBy, sortOrder });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.fournisseursService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.fournisseursService.update(id, req.user.companyId, dto, req.user.userId, req.user.name);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.fournisseursService.remove(id, req.user.companyId);
  }
}
