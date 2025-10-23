import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';

@Module({
  imports: [HttpModule],
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeocodingModule {}
