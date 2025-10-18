import { IsBoolean, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Premium Plan', description: 'Subscription name' })
  name: string;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ example: 1999, description: 'Price in cents' })
  price: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'DurationInDays must be greater than 0' })
  @ApiProperty({ example: 30, description: 'Duration in days' })
  durationInDays: number;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({ example: true })
  isActive: boolean;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({ example: false })
  isTrial: boolean;
}
