import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Request() req: any) {
    return this.notificationsService.findAll(req.user._id, req.user.role);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('receiver/:receiverId')
  findByReceiver(@Param('receiverId') receiverId: string, @Request() req: any) {
    return this.notificationsService.findByReceiverId(
      receiverId,
      req.user.role,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('receiver/:receiverId')
  async removeAll(
    @Param('receiverId') receiverId: string,
    @Request() req: any,
  ) {
    return this.notificationsService.removeAll(receiverId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
