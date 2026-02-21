import { IsNotEmpty, IsNumber, IsOptional, IsDateString, IsMongoId, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentAchatDto {

    @ApiProperty({ description: 'Montant du paiement' })
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @ApiProperty({ description: 'Date du paiement', required: false })
    @IsDateString()
    @IsOptional()
    date?: Date;

    @ApiProperty({ description: 'Remarques ou notes', required: false })
    @IsString()
    @IsOptional()
    note?: string;

    @ApiProperty({ description: 'ID du fournisseur' })
    @IsMongoId()
    @IsNotEmpty()
    fournisseurId: string;

    @ApiProperty({ description: 'ID de l’utilisateur qui enregistre le paiement' })
    @IsMongoId()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'ID de l’achat lié au paiement' })
    @IsMongoId()
    @IsNotEmpty()
    purchaseId: string;
}
