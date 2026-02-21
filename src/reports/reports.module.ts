import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PurchasesModule } from '../purchases/purchases.module';
import { ChargesModule } from '../charges/charges.module';
import { ProductsModule } from '../products/products.module';
import {VentesModule} from "../ventes/ventes.module";

@Module({
  imports: [VentesModule, PurchasesModule, ChargesModule, ProductsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
