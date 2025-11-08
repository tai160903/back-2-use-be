import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by status',
    enum: ['available', 'non-available'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['available', 'non-available'])
  status?: string;

  @ApiProperty({
    description: 'Filter by product group ID',
    example: '67305e0a8a2a4b228c2f1a12',
    required: false,
  })
  @IsOptional()
  @IsString()
  productGroupId?: string;

  @ApiProperty({
    description: 'Search by serial number',
    example: 'BOT-1731090000000',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
