import {
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from './schemas/notifications.schema';
import { Model, Types } from 'mongoose';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway: NotificationsGateway,
  ) {}
  async create(createNotificationDto: CreateNotificationDto) {
    try {
      const createdNotification = await this.notificationModel.create(
        createNotificationDto,
      );
      this.gateway.sendNotificationToUser(
        createNotificationDto.receiverId,
        createdNotification,
      );
      return createdNotification;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(userId: string, mode: 'customer' | 'business') {
    console.log('userId', userId);
    const customerTypes = [
      'borrow',
      'return',
      'penalty',
      'voucher',
      'reward',
      'ranking',
      'eco',
      'manual',
    ];
    const businessTypes = [
      'borrow',
      'return',
      'voucher',
      'policy',
      'eco',
      'wallet',
      'subscription',
      'none',
      'feedback',
    ];

    let allowedTypes: string[];

    if (mode === 'customer') allowedTypes = customerTypes;
    else if (mode === 'business') allowedTypes = businessTypes;
    else allowedTypes = [];

    return this.notificationModel
      .find({
        receiverId: new Types.ObjectId(userId),
        // type: { $in: allowedTypes },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByReceiverId(receiverId: string) {
    return this.notificationModel
      .find({ receiverId: new Types.ObjectId(receiverId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(id: string) {
    return this.notificationModel.findByIdAndUpdate(
      id,
      { isRead: true, ReadAt: new Date() },
      { new: true },
    );
  }

  async markAsUnread(id: string) {
    return this.notificationModel.findByIdAndUpdate(
      id,
      { isRead: false, ReadAt: null },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    return this.notificationModel.updateMany(
      { receiverId: new Types.ObjectId(userId), isRead: false },
      { isRead: true, ReadAt: new Date() },
    );
  }

  async findOne(id: string) {
    return this.notificationModel.findById(id).exec();
  }

  async update(id: string, payload: Partial<any>) {
    try {
      return this.notificationModel.findByIdAndUpdate(id, payload, {
        new: true,
      });
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to update notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      const doc = await this.notificationModel.findByIdAndDelete(id).exec();
      return doc;
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to delete notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
