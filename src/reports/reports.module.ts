import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { VentesModule } from '../ventes/ventes.module';
import { PurchasesModule } from '../purchases/purchases.module';
import { ChargesModule } from '../charges/charges.module';
import { ProductsModule } from '../products/products.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [VentesModule, PurchasesModule, ChargesModule, ProductsModule, ExportModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
