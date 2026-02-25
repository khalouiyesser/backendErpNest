import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockMovement, StockMovementSchema } from './stock-movement.schema';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: StockMovement.name, schema: StockMovementSchema }])],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
