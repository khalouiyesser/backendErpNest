import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseItemDto {
  @IsNotEmpty() @IsString() productId: string;
  @IsNotEmpty() @IsString() productName: string;
  @IsNumber() @Min(1) quantity: number;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsNumber() tva?: number;
}

export class CreatePurchaseDto {
  @ApiProperty()
  @IsNotEmpty() @IsString()
  supplierId: string;

  @ApiProperty({ type: [PurchaseItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  initialPayment?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;


  @IsOptional()
  paymentMethod?: string;
}
