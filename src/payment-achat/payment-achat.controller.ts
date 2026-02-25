import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentAchatService } from './payment-achat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments Achat')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('payment-achat')
export class PaymentAchatController {
  constructor(private readonly paymentAchatService: PaymentAchatService) {}
  @Get() findAll(@Request() req) { return this.paymentAchatService.findAll(req.user.companyId); }
}
