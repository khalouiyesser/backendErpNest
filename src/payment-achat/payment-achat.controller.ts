import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaymentAchatService } from './payment-achat.service';
import { CreatePaymentAchatDto } from './dto/create-payment-achat.dto';
import { UpdatePaymentAchatDto } from './dto/update-payment-achat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Paiements Achat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-achat')
export class PaymentAchatController {
  constructor(private readonly paymentAchatService: PaymentAchatService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un paiement d’achat' })
  @ApiBody({ type: CreatePaymentAchatDto })
  create(@Body() createPaymentAchatDto: CreatePaymentAchatDto, @Request() req) {
    return this.paymentAchatService.create(createPaymentAchatDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les paiements d’achat avec filtre et pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'purchaseId', required: false })
  findAll(
      @Request() req,
      @Query('search') search?: string,
      @Query('purchaseId') purchaseId?: string,
  ) {
    return this.paymentAchatService.findAll(req.user.userId, { search, purchaseId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un paiement par ID' })
  @ApiParam({ name: 'id', description: 'ID du paiement' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.paymentAchatService.findOne(id, req.user.userId);
  }

  @Get('user/:userId/supplier/:fournisseurId')
  @ApiOperation({ summary: 'Récupérer les paiements par utilisateur et fournisseur' })
  @ApiParam({ name: 'userId', description: 'ID de l’utilisateur' })
  @ApiParam({ name: 'fournisseurId', description: 'ID du fournisseur' })
  findPaymentsByUserAndFournisseur(
      @Param('userId') userId: string,
      @Param('fournisseurId') fournisseurId: string,
  ) {
    return this.paymentAchatService.getPaymentAchatByUserAndFournisseur(
        userId,
        fournisseurId,
    );
  }


  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour le montant d’un paiement' })
  @ApiParam({ name: 'id', description: 'ID du paiement' })
  @ApiBody({ type: UpdatePaymentAchatDto })
  update(
      @Param('id') id: string,
      @Body() updatePaymentAchatDto: UpdatePaymentAchatDto,
      @Request() req,
  ) {
    return this.paymentAchatService.update(id, req.user.userId, updatePaymentAchatDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un paiement' })
  @ApiParam({ name: 'id', description: 'ID du paiement' })
  remove(@Param('id') id: string, @Request() req) {
    return this.paymentAchatService.remove(id, req.user.userId);
  }



}
