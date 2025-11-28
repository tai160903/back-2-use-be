import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  Subscriptions,
  SubscriptionsDocument,
} from './schemas/subscriptions.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscriptions.name)
    private subscriptionModel: Model<SubscriptionsDocument>,
  ) {}

  async create(dto: CreateSubscriptionDto) {
    const name = dto.name.trim();
    const exists = await this.subscriptionModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      durationInDays: dto.durationInDays,
      isDeleted: false,
    });
    if (exists) {
      throw new HttpException(
        'Subscription with same name and duration exists',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (dto.isTrial && dto.price > 0) {
      throw new HttpException(
        'Trial must have price 0',
        HttpStatus.BAD_REQUEST,
      );
    }
    const created = await this.subscriptionModel.create({ ...dto, name });
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Created',
      data: created,
    };
  }

  async findAll() {
    const list = await this.subscriptionModel.find({ isDeleted: false }).lean();
    return { statusCode: HttpStatus.OK, message: 'OK', data: list };
  }

  async findOne(id: string) {
    if (!id) throw new HttpException('ID required', HttpStatus.BAD_REQUEST);
    const doc = await this.subscriptionModel.findById(id);
    if (!doc) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return { statusCode: HttpStatus.OK, message: 'OK', data: doc };
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    const exist = await this.subscriptionModel.findById(id);
    if (!exist) throw new HttpException('Not found', HttpStatus.NOT_FOUND);

    // if name/duration change, ensure unique
    const finalName = dto.name?.trim() ?? exist.name;
    const finalDuration = dto.durationInDays ?? exist.durationInDays;
    const duplicate = await this.subscriptionModel.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${finalName}$`, 'i') },
      durationInDays: finalDuration,
      isDeleted: false,
    });
    if (duplicate) {
      throw new HttpException(
        'Another subscription with same name+duration exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      dto.isTrial !== undefined &&
      dto.isTrial &&
      dto.price !== undefined &&
      dto.price > 0
    ) {
      throw new HttpException(
        'Trial must have price 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.subscriptionModel.findByIdAndUpdate(
      id,
      { ...dto, name: finalName },
      { new: true },
    );
    return { statusCode: HttpStatus.OK, message: 'Updated', data: updated };
  }

  async remove(id: string) {
    const exist = await this.subscriptionModel.findById(id);
    if (!exist) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    exist.isDeleted = true;
    await exist.save();
    return { statusCode: HttpStatus.OK, message: 'Deleted' };
  }
}
