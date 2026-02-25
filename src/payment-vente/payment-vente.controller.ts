import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentVenteService } from './payment-vente.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments Vente')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('payment-vente')
export class PaymentVenteController {
  constructor(private readonly paymentVenteService: PaymentVenteService) {}
  @Get() findAll(@Request() req) { return this.paymentVenteService.findAll(req.user.companyId); }
}
