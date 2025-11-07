import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Businesses } from '../../modules/businesses/schemas/businesses.schema';
import { BusinessSubscriptions } from '../../modules/businesses/schemas/business-subscriptions.schema';

@Injectable()
export class BusinessSubscriptionGuard implements CanActivate {
  constructor(
    @InjectModel(Businesses.name)
    private readonly businessModel: Model<Businesses>,
    @InjectModel(BusinessSubscriptions.name)
    private readonly businessSubscriptionModel: Model<BusinessSubscriptions>,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let user = request.user as { _id?: string; role?: string } | undefined;

    if (!user || !user._id) {
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
        user = jwt.verify(token, secret) as any;
      } catch (err) {
        throw new ForbiddenException('Invalid or expired token');
      }
    }

    if (!user?._id) {
      throw new ForbiddenException('Unauthorized');
    }

    console.log(user);

    // Find business by user
    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(user._id),
    });
    if (!business) {
      throw new ForbiddenException('No business found for this account');
    }

    // Check any active (and not expired) subscription
    const now = new Date();
    const hasActive = await this.businessSubscriptionModel.exists({
      businessId: business._id,
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    });

    if (!hasActive) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'NO_ACTIVE_SUBSCRIPTION',
        message:
          'No active subscription found. Please purchase a plan to continue using business features.',
        action: 'purchase_subscription',
        help: 'Go to the subscriptions screen and buy a plan to continue.',
      });
    }

    return true;
  }
}
