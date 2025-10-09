import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './controllers/admin-business-form.controller';
import { AdminService } from './services/admin-business-form.service';

describe('AdminController', () => {
  let controller: AdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [AdminService],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
