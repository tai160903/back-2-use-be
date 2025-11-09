import { Test, TestingModule } from '@nestjs/testing';
import { BorrowTransactionsService } from './borrow-transactions.service';

describe('BorrowTransactionsService', () => {
  let service: BorrowTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BorrowTransactionsService],
    }).compile();

    service = module.get<BorrowTransactionsService>(BorrowTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
