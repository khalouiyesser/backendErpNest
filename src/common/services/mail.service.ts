import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string, tempPassword: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"ERP System" <${this.configService.get('GMAIL_USER')}>`,
        to: email,
        subject: 'Welcome to ERP System - Your Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563EB;">Welcome to ERP System, ${name}!</h2>
            <p>Your account has been created by the administrator.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
            </div>
            <p style="color: #dc2626;"><strong>⚠️ You must change your password upon first login.</strong></p>
            <p>Please login and change your password immediately for security reasons.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
    }
  }

  async sendLowStockAlert(email: string, productName: string, currentStock: number, threshold: number): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"ERP System" <${this.configService.get('GMAIL_USER')}>`,
        to: email,
        subject: `⚠️ Low Stock Alert: ${productName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #dc2626;">Low Stock Alert</h2>
            <p>The product <strong>${productName}</strong> has reached its low stock threshold.</p>
            <p>Current stock: <strong>${currentStock}</strong> | Threshold: <strong>${threshold}</strong></p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send low stock alert', error);
    }
  }
}
