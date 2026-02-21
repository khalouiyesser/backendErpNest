import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Purchase, PurchaseSchema } from '../purchases/purchase.schema';
import { Product, ProductSchema } from '../products/product.schema';
import { Client, ClientSchema } from '../clients/client.schema';
import {Vente, Venteschema} from "../ventes/vente.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vente.name, schema: Venteschema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
