import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'Ahmed Ben Ali' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+21620000000' })
  @IsOptional()
  @Matches(/^\+216[0-9]{8}$/, { message: 'Phone must be a valid Tunisian number (+216XXXXXXXX)' })
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fiscalRegime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activityType?: string;
}
