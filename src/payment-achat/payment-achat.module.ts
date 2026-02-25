import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentAchat, PaymentAchatSchema } from './entities/payment-achat.entity';
import { PaymentAchatController } from './payment-achat.controller';
import { PaymentAchatService } from './payment-achat.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: PaymentAchat.name, schema: PaymentAchatSchema }])],
  controllers: [PaymentAchatController],
  providers: [PaymentAchatService],
  exports: [PaymentAchatService],
})
export class PaymentAchatModule {}
