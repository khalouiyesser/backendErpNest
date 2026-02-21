import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChargesService } from './charges.service';
import { ChargesController } from './charges.controller';
import { Charge, ChargeSchema } from './charge.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Charge.name, schema: ChargeSchema }])],
  controllers: [ChargesController],
  providers: [ChargesService],
  exports: [ChargesService],
})
export class ChargesModule {}
