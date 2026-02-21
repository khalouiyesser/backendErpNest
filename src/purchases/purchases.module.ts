import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase, PurchaseSchema } from './purchase.schema';
import { ProductsModule } from '../products/products.module';
import { FournisseursModule } from '../Fournisseurs/Fournisseurs.module';
import { PaymentAchatModule } from '../payment-achat/payment-achat.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Purchase.name, schema: PurchaseSchema },
    ]),
    ProductsModule,
    forwardRef(() => FournisseursModule), // ✅ IMPORTANT (circular dependency)
    forwardRef(() => PaymentAchatModule),
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService], // ❌ supprimer FournisseursModule d'ici
})
export class PurchasesModule {}