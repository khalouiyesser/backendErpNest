import { Test, TestingModule } from '@nestjs/testing';
import { PaymentAchatController } from './payment-achat.controller';
import { PaymentAchatService } from './payment-achat.service';

describe('PaymentAchatController', () => {
  let controller: PaymentAchatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentAchatController],
      providers: [PaymentAchatService],
    }).compile();

    controller = module.get<PaymentAchatController>(PaymentAchatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
