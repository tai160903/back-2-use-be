import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
import { Inject, forwardRef } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  emitResponse: true,
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private connectedUsers: Map<
    string,
    { userId: string; mode?: 'customer' | 'business' }
  > = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const mapping = this.connectedUsers.get(client.id);
    if (mapping) {
      this.connectedUsers.delete(client.id);
      console.log(`User ${mapping.userId} disconnected`);
    }
  }

  sendNotificationToUser(userId: string, payload: any) {
    for (const [socketId, mapping] of this.connectedUsers.entries()) {
      if (mapping.userId === userId) {
        this.server.to(socketId).emit('notification', payload);
      }
    }
  }

  constructor(
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  @SubscribeMessage('test')
  test(@ConnectedSocket() client: Socket) {
    console.log(`Received test message from client ${client.id}:`);
    return { message: 'Test successful' };
  }

  @SubscribeMessage('register')
  register(
    @MessageBody()
    payload: { userId: string; mode: 'customer' | 'business' },
    @ConnectedSocket() client: Socket,
  ) {
    this.connectedUsers.set(client.id, {
      userId: payload.userId,
      mode: payload.mode,
    });
    console.log(
      `User ${payload.userId} registered with client ID: ${client.id}`,
    );
  }

  @SubscribeMessage('createNotification')
  create(@MessageBody() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @SubscribeMessage('findAllNotifications')
  findAll(
    @MessageBody() payload: { userId: string; mode: 'customer' | 'business' },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, mode } = payload;
    if (!mode) {
      return [];
    }

    const response = this.notificationsService.findAll(userId, mode);

    console.log('findAllNotifications response:', response);

    return response;
  }

  @SubscribeMessage('markAsRead')
  markAsRead(@MessageBody() id: string) {
    console.log(id);
    return this.notificationsService.markAsRead(id);
  }

  @SubscribeMessage('markAllAsRead')
  markAllAsRead(
    @MessageBody() payload: { userId: string; mode: 'customer' | 'business' },
  ) {
    return this.notificationsService.markAllAsRead(
      payload.userId,
      payload.mode,
    );
  }

  @SubscribeMessage('markAsUnread')
  markAsUnread(@MessageBody() id: string) {
    return this.notificationsService.markAsUnread(id);
  }

  @SubscribeMessage('findByReceiver')
  findByReceiver(
    @MessageBody()
    payload: {
      receiverId: string;
      mode: 'customer' | 'business';
    },
  ) {
    return this.notificationsService.findByReceiverId(
      payload.receiverId,
      payload.mode,
    );
  }

  @SubscribeMessage('findNotification')
  findOne(@MessageBody() id: string) {
    return this.notificationsService.findOne(id);
  }

  @SubscribeMessage('deleteNotification')
  remove(@MessageBody() id: string) {
    return this.notificationsService.remove(id);
  }

  @SubscribeMessage('deleteAllNotifications')
  async removeAll(
    @MessageBody() payload: { userId?: string; mode?: 'customer' | 'business' },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('payload', payload);
    const mapping = this.connectedUsers.get(client.id);
    const targetId = payload?.userId || mapping?.userId;
    if (!targetId) {
      throw new WsException('Invalid user id');
    }
    if (mapping && payload?.userId && mapping.userId !== payload.userId) {
      throw new WsException('Forbidden');
    }
    return this.notificationsService.removeAll(targetId, mapping?.mode);
  }
}
