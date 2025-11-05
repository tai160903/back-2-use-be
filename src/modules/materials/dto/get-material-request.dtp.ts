import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MaterialRequestStatus } from 'src/common/constants/material-request-status.enum';

export class GetMaterialRequestsQueryDto {
  @ApiPropertyOptional({
    example: MaterialRequestStatus.PENDING,
    enum: MaterialRequestStatus, 
    description: "Filter by status ('pending' | 'approved' | 'rejected')",
  })
  @IsOptional()
  @IsEnum(MaterialRequestStatus)
  status?: MaterialRequestStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}
