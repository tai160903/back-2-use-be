import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateMaterialDto } from './create-material.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { AdminCreateMaterialDto } from 'src/modules/admin/dto/admin-material/admin-create-material.dto';

export class UpdateMaterialDto extends PartialType(AdminCreateMaterialDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Activate or deactivate the material',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
