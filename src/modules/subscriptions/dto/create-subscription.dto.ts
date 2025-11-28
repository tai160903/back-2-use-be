import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

enum ExportLevel {
  none = 'none',
  basic = 'basic',
  advanced = 'advanced',
}

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
    example: ExportLevel.basic,
    description: 'Export Level',
    enum: ExportLevel,
  })
  @IsEnum(ExportLevel)
  exportLevel: ExportLevel;

  @ApiProperty({
    example: 10,
    description: 'Eco Bonus Percent',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  ecoBonusPercent: number;
}

export class CreateSubscriptionDto {
  @ApiProperty({
    example: 'Monthly',
    description: 'Name of the subscription',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 500,
    description: 'Price of the subscription',
    minimum: 0,
    required: true,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 30,
    description: 'Duration in days',
    minimum: 0,
    required: true,
  })
  @IsNumber()
  @Min(0)
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
      exportLevel: ExportLevel.basic,
      ecoBonusPercent: 10,
    },
    description: 'Limits of the subscription',
    required: true,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => LimitsDto)
  limits: LimitsDto;
}
