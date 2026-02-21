import { PartialType } from '@nestjs/swagger';
import { CreateFournisseurDto } from './create-Fournisseur.dto';
export class UpdateFournisseurDto extends PartialType(CreateFournisseurDto) {}
