// dto/update-business-voucher.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class SetupBusinessVoucherDto {
  @ApiPropertyOptional({ example: 20, description: 'Discount percent (0–100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 50, description: 'Reward point cost (≥0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rewardPointCost?: number;

  @ApiPropertyOptional({ example: '2025-12-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiPropertyOptional({ example: true, description: 'Publish this voucher' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
