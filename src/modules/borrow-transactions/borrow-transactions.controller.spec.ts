import { Test, TestingModule } from '@nestjs/testing';
import { BorrowTransactionsController } from './borrow-transactions.controller';
import { BorrowTransactionsService } from './borrow-transactions.service';

describe('BorrowTransactionsController', () => {
  let controller: BorrowTransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BorrowTransactionsController],
      providers: [BorrowTransactionsService],
    }).compile();

    controller = module.get<BorrowTransactionsController>(BorrowTransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
