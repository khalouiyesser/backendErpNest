import { PartialType } from '@nestjs/swagger';
import {CreateFournisseurDto} from "./create-supplier.dto";
export class UpdateFournisseurDto extends PartialType(CreateFournisseurDto) {}
