// src/modules/eco-reward-policies/dto/create-eco-reward-policy.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreateEcoRewardPolicyDto {
  @ApiProperty({ example: 500, description: 'Eco point threshold' })
  @IsInt()
  @Min(1)
  threshold: number;

  @ApiProperty({
    example: 'Gold',
    description: 'Label for this eco reward level',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'Reward for businesses with 500 ecoPoints or more' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, description: 'Whether this policy is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
