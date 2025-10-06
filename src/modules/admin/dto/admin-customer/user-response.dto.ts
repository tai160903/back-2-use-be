import { ApiProperty } from '@nestjs/swagger';
import { RolesEnum } from 'src/common/constants/roles.enum';

export class UserResponseDto {
  @ApiProperty({ example: '68d969ab511f100fc2711f63' })
  _id: string;

  @ApiProperty({ example: 'example@mail.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ required: false, example: '0123456789' })
  phone?: string;

  @ApiProperty({ required: false, example: 'avatar_url' })
  avatar?: string;

  @ApiProperty({ required: false, example: '123 Street' })
  address?: string;

  @ApiProperty({ required: false, example: '2000-01-01T00:00:00.000Z' })
  yob?: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isBlocked: boolean;

  @ApiProperty({ enum: RolesEnum, example: RolesEnum.CUSTOMER })
  role: RolesEnum;

  @ApiProperty({ example: '2025-10-06T06:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: '2025-10-06T06:00:00.000Z' })
  createdAt: Date;
}
