import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'John Doe' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '0987654321' })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '123 Street' })
  address?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, format: 'date', example: '1990-01-01' })
  yob?: Date;
}
