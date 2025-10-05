import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Business (Admin)')
@Controller('admin/business')
export class AdminBusinessController {
  constructor() {}
}
