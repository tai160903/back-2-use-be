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
import { Customers } from '../users/schemas/customer.schema';
import { Businesses } from '../businesses/schemas/businesses.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    @InjectModel(Customers.name)
    private readonly customerModel: Model<Customers>,
    @InjectModel(Businesses.name)
    private readonly businessModel: Model<Businesses>,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway: NotificationsGateway,
  ) {}
  async create(createNotificationDto: CreateNotificationDto) {
    try {
      const createdNotification = await this.notificationModel.create(
        createNotificationDto,
      );
      this.gateway.sendNotificationToUser(
        createNotificationDto.receiverId.toString(),
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
    let receiver: { _id: any } | null;

    if (mode === 'customer') {
      allowedTypes = customerTypes;
      receiver = await this.customerModel.findOne({ userId: userId });
      if (!receiver) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }
    } else if (mode === 'business') {
      allowedTypes = businessTypes;
      receiver = await this.businessModel.findOne({ userId: userId });
      if (!receiver) {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }
    } else {
      throw new HttpException('Invalid mode', HttpStatus.BAD_REQUEST);
    }

    return this.notificationModel
      .find({
        receiverId: receiver?._id,
        type: { $in: allowedTypes },
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

  async removeAll(userId: string, mode?: 'customer' | 'business') {
    try {
      console.log('userId', userId);
      console.log('mode', mode);
      let receiver: any;
      if (mode === 'customer') {
        receiver = await this.customerModel.findOne({ userId: userId });
      } else if (mode === 'business') {
        receiver = await this.businessModel.findOne({ userId: userId });
      }
      if (!receiver) {
        throw new HttpException('Receiver not found', HttpStatus.NOT_FOUND);
      }

      const res = await this.notificationModel.deleteMany({
        receiverId: receiver?._id,
      });
      return res;
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to delete notifications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
