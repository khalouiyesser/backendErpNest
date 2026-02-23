import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFournisseurDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '+21620000000' })
  @IsNotEmpty()
  @Matches(/^\+216[0-9]{8}$/, { message: 'Phone must be a valid Tunisian number +216XXXXXXXX' })
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

}
