import { Controller, Get, Param, Query} from '@nestjs/common';
import { SingleUseProductService } from './single-use-product.service';
import { ApiTags } from '@nestjs/swagger';
import { SingleUseProduct } from './schemas/single-use-product.schema';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { GetSingleUseProductByBusinessQueryDto } from './dto/get-single-use-product-by-business-query.dto';

@ApiTags('Single Use Product')
@Controller('single-use-product')
export class SingleUseProductController {
  constructor(private readonly service: SingleUseProductService) {}

  @Get('business/:businessId')
  async getByBusiness(
    @Param('businessId') businessId: string,
    @Query() query: GetSingleUseProductByBusinessQueryDto,
  ): Promise<APIPaginatedResponseDto<SingleUseProduct[]>> {
    return this.service.getByBusiness(businessId, query);
  }
}
