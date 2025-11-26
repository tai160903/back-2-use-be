import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  IsIn,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateStaffDto {
  @ApiProperty({
    description: 'Business ID owning this staff',
    example: '67305e0a8a2a4b228c2f1a12',
  })
  @IsNotEmpty()
  @IsMongoId()
  businessId: Types.ObjectId;

  @ApiProperty({ description: 'Full name of staff', example: 'Nguyen Van A' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  fullName: string;

  @ApiProperty({
    description: 'Email of staff (unique per business)',
    example: 'staff@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '0912345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  phone?: string;

  @ApiProperty({
    description: 'Position / role inside business',
    example: 'cashier',
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  position: string;

  @ApiProperty({
    description: 'Internal staff role',
    enum: ['staff', 'manager'],
    required: false,
    example: 'staff',
  })
  @IsOptional()
  @IsIn(['staff', 'manager'])
  staffRole?: string;
}
