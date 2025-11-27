import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CheckProductConditionDto {
  @ApiProperty({ required: false })
  @IsString()
  frontIssue?: string;

  @ApiProperty({ required: false })
  @IsString()
  backIssue?: string;

  @ApiProperty({ required: false })
  @IsString()
  leftIssue?: string;

  @ApiProperty({ required: false })
  @IsString()
  rightIssue?: string;

  @ApiProperty({ required: false })
  @IsString()
  topIssue?: string;

  @ApiProperty({ required: false })
  @IsString()
  bottomIssue?: string;
}
