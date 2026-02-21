import { Test, TestingModule } from '@nestjs/testing';
import { PaymentVenteService } from './payment-vente.service';

describe('PaymentVenteService', () => {
  let service: PaymentVenteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentVenteService],
    }).compile();

    service = module.get<PaymentVenteService>(PaymentVenteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
