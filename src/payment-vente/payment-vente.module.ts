import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentVente, PaymentVenteSchema } from './entities/payment-vente.entity';
import { PaymentVenteController } from './payment-vente.controller';
import { PaymentVenteService } from './payment-vente.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: PaymentVente.name, schema: PaymentVenteSchema }])],
  controllers: [PaymentVenteController],
  providers: [PaymentVenteService],
  exports: [PaymentVenteService],
})
export class PaymentVenteModule {}
