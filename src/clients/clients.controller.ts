import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportService } from '../export/export.service';
import { VentesService } from '../ventes/ventes.service';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly exportService: ExportService,
    private readonly ventesService: VentesService,
  ) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto, @Request() req) {
    return this.clientsService.create(createClientDto, req.user.userId);
  }

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: boolean,
  ) {
    return this.clientsService.findAll(req.user.userId, {
      search,
      sortBy,
      sortOrder,
      isActive,
    });
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string, @Request() req) {
    return this.clientsService.getClientStats(id, req.user.userId);
  }

  // ── Export bilan client ────────────────────────────────────────────────────
  @Get(':id/export')
  async exportBilan(
    @Param('id') id: string,
    @Request() req,
    @Query('format') format: 'pdf' | 'xlsx' = 'pdf',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const client = await this.clientsService.findOne(id, req.user.userId);
    const sales = await this.ventesService.findByClientForExport(
      id,
      req.user.userId,
      startDate,
      endDate,
    );

    if (format === 'xlsx') {
      const buffer = await this.exportService.generateClientBilanExcel(
        client,
        sales,
        startDate,
        endDate,
      );
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="bilan-${client.name}.xlsx"`,
      });
      return res.status(HttpStatus.OK).end(buffer);
    }

    const buffer = await this.exportService.generateClientBilanPdf(
      client,
      sales,
      startDate,
      endDate,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bilan-${client.name}.pdf"`,
    });
    return res.status(HttpStatus.OK).end(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.clientsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Request() req,
  ) {
    return this.clientsService.update(id, req.user.userId, updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.clientsService.remove(id, req.user.userId);
  }
}
