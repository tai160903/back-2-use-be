import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsObject, IsNumber } from 'class-validator';

export class ConfirmReturnDto {
  @ApiProperty()
  @IsString()
  note: string;

  @ApiProperty({
    type: [Object],
    description: 'Array of { face: string, issue: string }',
  })
  @IsArray()
  damageFaces: { face: string; issue: string }[];

  @ApiProperty({
    type: Object,
    description: 'Temp image URLs returned from check API',
  })
  @IsObject()
  tempImages: Record<string, string>;

  @ApiProperty({ required: false })
  @IsNumber()
  totalDamagePoints?: number;

  @ApiProperty({ required: false })
  @IsString()
  finalCondition?: string;
}
