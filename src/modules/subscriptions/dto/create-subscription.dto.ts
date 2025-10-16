import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Premium Plan', description: 'Subscription name' })
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty({
    type: [String],
    example: ['Feature 1', 'Feature 2'],
    description: 'List of features',
  })
  description: string[];

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ example: 1999, description: 'Price in cents' })
  price: number;

  @IsNotEmpty()
  @IsNumber()
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
