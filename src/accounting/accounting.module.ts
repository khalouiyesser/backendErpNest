import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { Purchase, PurchaseSchema } from '../purchases/purchase.schema';
import { Charge, ChargeSchema } from '../charges/charge.schema';
import {Vente, Venteschema} from "../sales/vente.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vente.name, schema: Venteschema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: Charge.name, schema: ChargeSchema },
    ]),
  ],
  controllers: [AccountingController],
  providers: [AccountingService],
})
export class AccountingModule {}
