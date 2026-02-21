import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  @Get() findAll(@Request() req) { return this.notificationsService.findAll(req.user.userId); }
  @Get('unread-count') getUnreadCount(@Request() req) { return this.notificationsService.getUnreadCount(req.user.userId); }
  @Patch('read-all') markAllRead(@Request() req) { return this.notificationsService.markAllAsRead(req.user.userId); }
  @Patch(':id/read') markRead(@Param('id') id: string, @Request() req) { return this.notificationsService.markAsRead(id, req.user.userId); }
}
