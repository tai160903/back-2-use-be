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
        createNotificationDto.userId,
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

  async findAll() {
    return this.notificationModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByUserId(userId: string) {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(id: string) {
    return this.notificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true },
    );
  }
}
