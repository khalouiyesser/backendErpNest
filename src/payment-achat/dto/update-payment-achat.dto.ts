import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePaymentAchatDto {
    @ApiProperty({ description: 'Nouveau montant du paiement' })
    @IsNumber()
    @IsNotEmpty()
    amount: number;
}
