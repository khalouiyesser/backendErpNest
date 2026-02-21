import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase, PurchaseSchema } from './purchase.schema';
import { ProductsModule } from '../products/products.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { PaymentAchatModule } from '../payment-achat/payment-achat.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Purchase.name, schema: PurchaseSchema },
    ]),
    ProductsModule,
    forwardRef(() => SuppliersModule), // ✅ IMPORTANT (circular dependency)
    forwardRef(() => PaymentAchatModule),
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService], // ❌ supprimer SuppliersModule d'ici
})
export class PurchasesModule {}