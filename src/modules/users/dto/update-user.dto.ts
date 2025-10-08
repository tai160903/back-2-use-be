import { IsOptional, IsString, IsDate } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '0987654321' })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '123 Main St, Hanoi' })
  address?: string;

  @IsOptional()
  @IsDate()
  @ApiPropertyOptional({ type: String, format: 'date', example: '1990-01-01' })
  yob?: Date;
}
