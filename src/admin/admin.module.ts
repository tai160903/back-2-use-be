import { Module } from '@nestjs/common';
import { AdminMaterialController } from './controllers/admin-material.controller';
import { AdminMaterialService } from './services/admin-material.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Material,
  MaterialSchema,
} from 'src/materials/schemas/material.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Material.name, schema: MaterialSchema },
    ]),
  ],
  controllers: [AdminMaterialController],
  providers: [AdminMaterialService],
})
export class AdminModule {}
