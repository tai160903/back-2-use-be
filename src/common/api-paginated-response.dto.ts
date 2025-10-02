import { APIResponseDto } from './api-response.dto';

export class APIPaginatedResponseDto<T> extends APIResponseDto<T> {
  total: number;
  currentPage: number;
  totalPages: number;
}
