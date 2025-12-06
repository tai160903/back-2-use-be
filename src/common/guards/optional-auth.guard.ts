import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Injectable()
export class OptionalAuthGuard extends AuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const token = request.headers.authorization;

    // ❗Nếu không có token → cho qua luôn (userId = undefined)
    if (!token) {
      return true;
    }

    // Nếu có token → chạy AuthGuard bình thường
    return super.canActivate(context);
  }
}
