import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { Subscriptions } from './schemas/subscriptions.schema';
import { SubscriptionFeatures } from './schemas/subscriptions-description.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscriptions.name)
    private subscriptionModel: Model<Subscriptions>,
    @InjectModel(SubscriptionFeatures.name)
    private featureModel: Model<SubscriptionFeatures>,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<APIResponseDto> {
    const name = createSubscriptionDto.name.trim();

    const existing = await this.subscriptionModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      durationInDays: createSubscriptionDto.durationInDays,
    });
    if (existing) {
      throw new HttpException(
        'A subscription with this name and duration already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (createSubscriptionDto.isTrial) {
      const existingTrial = await this.subscriptionModel.findOne({
        isTrial: true,
      });
      if (existingTrial) {
        throw new HttpException(
          'Only one trial subscription is allowed',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (createSubscriptionDto.isTrial && createSubscriptionDto.price > 0) {
      throw new HttpException(
        'Trial subscription cannot have a price greater than 0',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!createSubscriptionDto.isTrial && createSubscriptionDto.price <= 0) {
      throw new HttpException(
        'Paid subscription must have a price greater than 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    const subscription = await this.subscriptionModel.create({
      ...createSubscriptionDto,
      name,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Subscription created successfully',
      data: subscription,
    };
  }

  async findAll() {
    try {
      const subscriptions = await this.subscriptionModel
        .find({ $and: [{ isDeleted: false }] })
        .exec();
      const featureRecord = await this.featureModel.findOne().exec();
      return {
        statusCode: HttpStatus.OK,
        message: 'Subscriptions retrieved successfully',
        data: {
          subscriptions,
          description: featureRecord?.features || '',
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        msg || 'Failed to retrieve subscriptions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      if (!id) {
        throw new HttpException('ID must be provided', HttpStatus.BAD_REQUEST);
      }
      const subscription = await this.subscriptionModel.findById(id).exec();
      if (!subscription) {
        throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
      }

      const featureRecord = await this.featureModel.findOne().exec();
      return {
        statusCode: HttpStatus.OK,
        message: 'Subscription retrieved successfully',
        data: {
          subscription,
          description: featureRecord?.features || '',
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        msg || 'Failed to retrieve subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<APIResponseDto> {
    const subscription = await this.subscriptionModel.findById(id).exec();
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    const finalName = updateSubscriptionDto.name
      ? updateSubscriptionDto.name.trim()
      : subscription.name;
    const finalDuration =
      updateSubscriptionDto.durationInDays ?? subscription.durationInDays;

    if (updateSubscriptionDto.name || updateSubscriptionDto.durationInDays) {
      const existing = await this.subscriptionModel.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${finalName}$`, 'i') },
        ...(updateSubscriptionDto.durationInDays && {
          durationInDays: finalDuration,
        }),
      });

      if (existing) {
        throw new HttpException(
          'Another subscription with the same name and duration already exists',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (updateSubscriptionDto.isTrial !== undefined) {
      if (updateSubscriptionDto.isTrial) {
        const existingTrial = await this.subscriptionModel.findOne({
          _id: { $ne: id },
          isTrial: true,
        });
        if (existingTrial) {
          throw new HttpException(
            'Another trial subscription already exists',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (
        updateSubscriptionDto.isTrial &&
        updateSubscriptionDto.price !== undefined &&
        updateSubscriptionDto.price > 0
      ) {
        throw new HttpException(
          'Trial subscriptions cannot have a price greater than 0',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        !updateSubscriptionDto.isTrial &&
        updateSubscriptionDto.price !== undefined &&
        updateSubscriptionDto.price <= 0
      ) {
        throw new HttpException(
          'Paid subscriptions must have a price greater than 0',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const updatedSubscription = await this.subscriptionModel.findByIdAndUpdate(
      id,
      { ...updateSubscriptionDto, name: finalName },
      { new: true },
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Subscription updated successfully',
      data: updatedSubscription,
    };
  }

  async remove(id: string): Promise<APIResponseDto> {
    const subscription = await this.subscriptionModel.findById(id).exec();
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    subscription.isDeleted = true;
    await subscription.save();

    return {
      statusCode: HttpStatus.OK,
      message: 'Subscription deleted successfully',
      data: null,
    };
  }

  async findFeatures() {
    const record = await this.featureModel.findOne().exec();
    return {
      statusCode: HttpStatus.OK,
      message: 'Subscription features retrieved successfully',
      data: record?.features ?? [],
    };
  }

  async updateFeatures(features: string[]): Promise<APIResponseDto> {
    if (!features || !Array.isArray(features)) {
      throw new HttpException('Invalid features list', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.featureModel.findOneAndUpdate(
      {},
      { features },
      { new: true, upsert: true }, // upsert: true → nếu chưa tồn tại thì tạo mới
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Subscription features updated successfully',
      data: updated,
    };
  }
  async removeFeature(feature: string) {
    if (!feature?.trim()) {
      throw new HttpException('Invalid feature name', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.featureModel.findOneAndUpdate(
      {},
      { $pull: { features: feature.trim() } },
      { new: true },
    );

    if (!updated) {
      throw new HttpException(
        'Subscription features list not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: `Deleted "${feature}"`,
      data: updated.features,
    };
  }
}
