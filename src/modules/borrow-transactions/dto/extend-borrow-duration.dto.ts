import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class ExtendBorrowDurationDto {
  @ApiProperty({
    description: 'Additional days to extend the borrow period',
    example: 7,
    minimum: 1,
    maximum: 30,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Extension must be at least 1 day' })
  @Max(30, { message: 'Cannot extend more than 30 days at once' })
  additionalDays: number;
}
