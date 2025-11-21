import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, MaxLength, IsOptional } from 'class-validator';

export class UpdateProductConditionDto {
  @ApiProperty({
    description:
      'The condition of the product when it is returned by the customer.',
    example: 'damaged',
    enum: ['good', 'damaged'],
  })
  @IsEnum(['good', 'damaged'])
  condition: 'good' | 'damaged';

  @ApiProperty({
    description:
      'A detailed note describing the product’s condition at the time of return. For example: scratches, dents, cracks, or any other observation.',
    example: 'The lid has minor scratches but the product is still usable.',
  })
  @IsString()
  @MaxLength(500)
  note: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: false,
  })
  @IsOptional()
  images?: any;
}
