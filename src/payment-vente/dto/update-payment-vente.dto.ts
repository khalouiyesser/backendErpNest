import { PartialType } from '@nestjs/swagger';
import { CreatePaymentVenteDto } from './create-payment-vente.dto';

export class UpdatePaymentVenteDto extends PartialType(CreatePaymentVenteDto) {}
