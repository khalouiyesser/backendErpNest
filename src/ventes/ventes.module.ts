import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {Vente, Venteschema} from './vente.schema';
import { ProductsModule } from '../products/products.module';
import { ClientsModule } from '../clients/clients.module';
import {PaymentAchatModule} from "../payment-achat/payment-achat.module";
import {VenteController} from "./vente.controller";
import {VentesService} from "./ventes.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vente.name, schema: Venteschema }]),
    ProductsModule,
    forwardRef(() => ClientsModule),
    forwardRef(() => PaymentAchatModule),
  ],
  controllers: [VenteController],
  providers: [VentesService],
  exports: [VentesService],
})
export class VentesModule {}