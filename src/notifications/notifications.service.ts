import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private notifModel: Model<NotificationDocument>) {}

  async create(data: { title: string; message: string; type?: NotificationType; link?: string; userId: string }) {
    return new this.notifModel({ ...data, userId: new Types.ObjectId(data.userId) }).save();
  }

  async findAll(userId: string) {
    return this.notifModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(50).exec();
  }

  async markAsRead(id: string, userId: string) {
    return this.notifModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { isRead: true }, { new: true }
    );
  }

  async markAllAsRead(userId: string) {
    return this.notifModel.updateMany({ userId: new Types.ObjectId(userId), isRead: false }, { isRead: true });
  }

  async getUnreadCount(userId: string) {
    return this.notifModel.countDocuments({ userId: new Types.ObjectId(userId), isRead: false });
  }
}
