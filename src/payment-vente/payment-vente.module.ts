import {forwardRef, Module} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentVenteService } from './payment-vente.service';
import { PaymentVenteController } from './payment-vente.controller';
import { PaymentVente, PaymentVenteSchema } from './entities/payment-vente.entity';
import {PurchasesModule} from "../purchases/purchases.module";
import {VentesModule} from "../ventes/ventes.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentVente.name, schema: PaymentVenteSchema },
    ]),
    forwardRef(() => VentesModule), // ⚡ résoudre dépendance circulaire

  ],
  controllers: [PaymentVenteController],
  providers: [PaymentVenteService],
  exports: [PaymentVenteService], // ✅ si utilisé dans d'autres modules
})
export class PaymentVenteModule {}