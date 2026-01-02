import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateSingleUseUsageDto {
  @ApiProperty()
  @IsMongoId()
  singleUseProductId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  note?: string;
}
