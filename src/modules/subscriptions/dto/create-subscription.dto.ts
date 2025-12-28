import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class LimitsDto {
  @ApiProperty({
    example: 12,
    description: 'Product Group Limit',
    minimum: 0,
  })
  @IsNumber()
  productGroupLimit: number;

  @ApiProperty({
    example: 2,
    description: 'Product Loan Limit',
    minimum: 0,
  })
  @IsNumber()
  productItemLimit: number;

  @ApiProperty({
    example: 100,
    description: 'Reward Points Limit per subscription period',
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Reward points limit cannot be negative' })
  rewardPointsLimit: number;
}

export class CreateSubscriptionDto {
  @ApiProperty({
    example: 'Monthly',
    description: 'Name of the subscription',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @ApiProperty({
    example: 500,
    description: 'Price of the subscription',
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @ApiProperty({
    example: 30,
    description: 'Duration in days',
    minimum: 0,
    required: true,
  })
  @IsNumber({}, { message: 'Duration in days must be a number' })
  @Min(1, { message: 'Duration in days must be at least 1' })
  durationInDays: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the subscription is active',
    required: false,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the subscription is a trial',
    required: false,
  })
  @IsBoolean()
  isTrial: boolean;

  @ApiProperty({
    example: {
      productGroupLimit: 12,
      productItemLimit: 2,
      rewardPointsLimit: 100,
    },
    description: 'Limits of the subscription',
    required: true,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => LimitsDto)
  limits: LimitsDto;
}
