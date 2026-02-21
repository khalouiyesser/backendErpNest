import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentAchatService } from './payment-achat.service';
import { PaymentAchatController } from './payment-achat.controller';
import { PaymentAchat, PaymentAchatSchema } from './entities/payment-achat.entity';
import { PurchasesModule } from '../purchases/purchases.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentAchat.name, schema: PaymentAchatSchema },
    ]),
    forwardRef(() => PurchasesModule), // ⚡ résoudre dépendance circulaire
  ],
  controllers: [PaymentAchatController],
  providers: [PaymentAchatService],
  exports: [PaymentAchatService], // exporter uniquement le service
})
export class PaymentAchatModule {}
