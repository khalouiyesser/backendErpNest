import { Test, TestingModule } from '@nestjs/testing';
import { PaymentAchatService } from './payment-achat.service';

describe('PaymentAchatService', () => {
  let service: PaymentAchatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentAchatService],
    }).compile();

    service = module.get<PaymentAchatService>(PaymentAchatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
