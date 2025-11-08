/* eslint-disable linebreak-style */
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProductSizeDto } from './create-product-size.dto';

// Disallow productGroupId from being updated
export class UpdateProductSizeDto extends PartialType(
  OmitType(CreateProductSizeDto, ['productGroupId'] as const),
) {}
