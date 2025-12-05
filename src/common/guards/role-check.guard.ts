import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RoleCheckGuard implements CanActivate {
  constructor(
    private readonly allowedRoles: string[] = [],
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    let user = request.user;

    if (!user || !user.role) {
      const authHeader =
        request.headers['authorization'] || request.headers['Authorization'];

      if (!authHeader?.startsWith('Bearer ')) {
        throw new ForbiddenException('Missing or invalid authorization header');
      }

      const token = authHeader.slice(7);
      try {
        const secret = this.configService.get<string>('jwt.accessToken.secret');
        if (!secret) {
          throw new Error('JWT secret not configured');
        }

        const payload = jwt.verify(token, secret) as any;
        user = payload;
      } catch (err) {
        throw new ForbiddenException('Invalid or expired token');
      }
    }

    if (user && user.role && Array.isArray(user.role)) {
      // Check if any of the user's roles are in the allowedRoles
      const hasPermission = user.role.some((userRole: string) =>
        this.allowedRoles.includes(userRole),
      );
      if (hasPermission) {
        return true;
      }
    }

    throw new ForbiddenException(
      `Access denied: Allowed roles [${this.allowedRoles.join(', ')}]`,
    );
  }

  static withRoles(roles: string[]): Type<CanActivate> {
    @Injectable()
    class CustomRoleCheckGuard extends RoleCheckGuard {
      constructor(configService: ConfigService) {
        super(roles, configService);
      }
    }
    return CustomRoleCheckGuard;
  }
}
