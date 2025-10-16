import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription } from 'rxjs';
import { Model } from 'mongoose';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<APIResponseDto> {
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

  findAll() {
    return `This action returns all subscriptions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} subscription`;
  }

  update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {
    return `This action updates a #${id} subscription`;
  }

  remove(id: number) {
    return `This action removes a #${id} subscription`;
  }
}
