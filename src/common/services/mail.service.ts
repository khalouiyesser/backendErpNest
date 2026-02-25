import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: parseInt(this.configService.get('MAIL_PORT') || '587'),
      secure: false,
      auth: { user: this.configService.get('MAIL_USER'), pass: this.configService.get('MAIL_PASS') },
    });
  }

  async sendWelcomeEmail(to: string, name: string, tempPassword: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM') || 'ERP System <noreply@erp.com>',
        to,
        subject: 'Bienvenue sur votre ERP',
        html: `<h2>Bienvenue, ${name}!</h2><p>Votre compte a été créé.</p><p><strong>Email:</strong> ${to}</p><p><strong>Mot de passe temporaire:</strong> <code>${tempPassword}</code></p><p>⚠️ Changez votre mot de passe dès votre première connexion.</p>`,
      });
    } catch (err) { this.logger.warn('Email non envoyé à ' + to + ': ' + err.message); }
  }

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM'),
        to,
        subject: 'Réinitialisation de mot de passe',
        html: `<h2>Bonjour ${name}</h2><p>Code de réinitialisation: <strong>${token}</strong></p><p>Valable 1 heure.</p>`,
      });
    } catch (err) { this.logger.warn('Email reset non envoyé: ' + err.message); }
  }

  async sendSubscriptionAlert(to: string, companyName: string, message: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM'),
        to,
        subject: '[ERP] Alerte abonnement — ' + companyName,
        html: '<h3>' + companyName + '</h3><p>' + message + '</p>',
      });
    } catch (err) { this.logger.warn('Email abonnement non envoyé: ' + err.message); }
  }
}
