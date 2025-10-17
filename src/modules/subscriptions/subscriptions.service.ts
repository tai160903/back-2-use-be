import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { Subscriptions } from './schemas/subscriptions.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscriptions.name)
    private subscriptionModel: Model<Subscriptions>,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<APIResponseDto> {
    console.log(createSubscriptionDto);
    const name = createSubscriptionDto.name.trim();
    const existing = await this.subscriptionModel.findOne({
      name,
    });
    if (existing) {
      throw new HttpException(
        'Subscription with this name already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (createSubscriptionDto.isTrial && createSubscriptionDto.price > 0) {
      throw new HttpException(
        'Trial subscription cannot have price > 0',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!createSubscriptionDto.isTrial && createSubscriptionDto.price <= 0) {
      throw new HttpException(
        'Non-trial subscription must have price > 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    const subscription = await this.subscriptionModel.create(
      createSubscriptionDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Subscription created successfully',
      data: subscription,
    };
  }

  async findAll() {
    try {
      const subscriptions = await this.subscriptionModel.find().exec();
      return {
        statusCode: HttpStatus.OK,
        message: 'Subscriptions retrieved successfully',
        data: subscriptions,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve subscriptions',
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
      return {
        statusCode: HttpStatus.OK,
        message: 'Subscription retrieved successfully',
        data: subscription,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {
    return `This action updates a #${id} subscription`;
  }
}
