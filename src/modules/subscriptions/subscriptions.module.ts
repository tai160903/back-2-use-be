import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import {
  Subscriptions,
  SubscriptionsSchema,
} from './schemas/subscriptions.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SubscriptionFeatures,
  SubscriptionFeaturesSchema,
} from './schemas/subscriptions-description.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscriptions.name, schema: SubscriptionsSchema },
      { name: SubscriptionFeatures.name, schema: SubscriptionFeaturesSchema },
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}
