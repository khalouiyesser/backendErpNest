import { Test, TestingModule } from '@nestjs/testing';
import { PaymentVenteController } from './payment-vente.controller';
import { PaymentVenteService } from './payment-vente.service';

describe('PaymentVenteController', () => {
  let controller: PaymentVenteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentVenteController],
      providers: [PaymentVenteService],
    }).compile();

    controller = module.get<PaymentVenteController>(PaymentVenteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
