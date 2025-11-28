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
import { Subscriptions } from '../../modules/subscriptions/schemas/subscriptions.schema';

@Injectable()
export class BusinessSubscriptionGuard implements CanActivate {
  constructor(
    @InjectModel(Businesses.name)
    private readonly businessModel: Model<Businesses>,
    @InjectModel(BusinessSubscriptions.name)
    private readonly businessSubscriptionModel: Model<BusinessSubscriptions>,
    @InjectModel(Subscriptions.name)
    private readonly subscriptionModel: Model<Subscriptions>,
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

    const business = await this.businessModel.findOne({
      userId: new Types.ObjectId(user._id),
    });
    if (!business) {
      throw new ForbiddenException('No business found for this account');
    }

    const now = new Date();
    const activeSub = await this.businessSubscriptionModel
      .findOne({
        businessId: new Types.ObjectId(business._id),
        status: 'active',
        $and: [
          { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
          { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
        ],
      })
      .populate('subscriptionId')
      .lean();

    if (!activeSub) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'NO_ACTIVE_SUBSCRIPTION',
        message:
          'No active subscription found. Please purchase a plan to continue using business features.',
        action: 'purchase_subscription',
        help: 'Go to the subscriptions screen and buy a plan to continue.',
      });
    }

    // Attach subscription limits to request for use in services
    const subscription = activeSub.subscriptionId as any;
    if (subscription?.limits) {
      request.subscriptionLimits = subscription.limits;
    }

    return true;
  }
}
