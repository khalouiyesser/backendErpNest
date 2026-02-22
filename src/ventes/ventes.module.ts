import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vente, Venteschema } from './vente.schema';
import { VenteController } from './vente.controller';
import { VentesService } from './ventes.service';
import { ProductsModule } from '../products/products.module';
import { ClientsModule } from '../clients/clients.module';
import { PaymentVenteModule } from '../payment-vente/payment-vente.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StockModule } from '../stock/stock.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vente.name, schema: Venteschema }]),
    ProductsModule,
    forwardRef(() => ClientsModule),
    forwardRef(() => PaymentVenteModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => StockModule),
    ExportModule,
  ],
  controllers: [VenteController],
  providers: [VentesService],
  exports: [VentesService],
})
export class VentesModule {}
