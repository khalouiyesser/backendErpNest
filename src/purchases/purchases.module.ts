import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase, PurchaseSchema } from './purchase.schema';
import { ProductsModule } from '../products/products.module';
import { FournisseursModule } from '../fournisseurs/fournisseurs.module';
import { PaymentAchatModule } from '../payment-achat/payment-achat.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Purchase.name, schema: PurchaseSchema },
    ]),
    forwardRef(() => FournisseursModule),
    forwardRef(() => ProductsModule),
    forwardRef(() => PaymentAchatModule),
    ExportModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],

})
export class PurchasesModule {}