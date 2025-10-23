import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class GeocodingService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getCoordinates(
    address: string,
  ): Promise<{ latitude: number | null; longitude: number | null }> {
    const apiKey = this.configService.get<string>('OPEN_MAP_API_KEY');
    const encoded = encodeURIComponent(address);
    const url = `https://mapapis.openmap.vn/v1/geocode/forward?text=${encoded}&size=1&apikey=${apiKey}`;

    try {
      const response = await lastValueFrom(this.httpService.get(url));
      const data = response.data;

      if (!data.features?.length) {
        console.warn(`[Geocoding] Address not found: ${address}`);
        return { latitude: null, longitude: null };
      }

      const [lng, lat] = data.features[0].geometry.coordinates;

      return {
        latitude: lat,
        longitude: lng,
      };
    } catch (error) {
      console.error('[Geocoding] Failed to fetch coordinates:', error.message);
      return { latitude: null, longitude: null };
    }
  }
}
