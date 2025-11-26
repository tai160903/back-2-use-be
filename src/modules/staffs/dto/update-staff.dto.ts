import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateStaffDto } from './create-staff.dto';
import { IsEmail, IsOptional, IsString, Length, IsIn } from 'class-validator';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  @ApiPropertyOptional({
    description: 'Updated full name',
    example: 'Tran Thi B',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Updated email',
    example: 'newstaff@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Updated phone', example: '0987654321' })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Status change',
    enum: ['active', 'removed'],
  })
  @IsOptional()
  @IsIn(['active', 'removed'])
  status?: string;
}
