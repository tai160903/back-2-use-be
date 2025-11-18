export class APIResponseDto<T = any> {
  statusCode: number;
  message: string;
  data?: T | null;
}
