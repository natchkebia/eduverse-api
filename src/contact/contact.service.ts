import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendContactEmail(dto: CreateContactDto) {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = Number(this.configService.get<string>('EMAIL_PORT') || 0);
    const secure = this.configService.get<string>('EMAIL_SECURE') === 'true';
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    const to = this.configService.get<string>(
      'CONTACT_EMAIL_TO',
      'Info@eduverse.ge',
    );
    const from =
      this.configService.get<string>('CONTACT_EMAIL_FROM') ||
      user ||
      'info@eduverse.ge';

    if (!host || !port || !user || !pass) {
      this.logger.error(
        'SMTP configuration is missing in environment variables.',
      );
      throw new InternalServerErrorException(
        'Email service is not configured on the server.',
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const subject = `EduVerse contact from ${dto.name}`;
    const text = `Name: ${dto.name}\nContact: ${dto.contact}\n\n${dto.message}`;
    const escapedName = this.escapeHtml(dto.name);
    const escapedContact = this.escapeHtml(dto.contact);
    const escapedMessage = this.escapeHtml(dto.message).replace(/\n/g, '<br>');
    const html = `
      <p><strong>Name:</strong> ${escapedName}</p>
      <p><strong>Contact:</strong> ${escapedContact}</p>
      <p><strong>Message:</strong></p>
      <p>${escapedMessage}</p>
    `;

    const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.contact.trim())
      ? dto.contact.trim()
      : undefined;

    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
        replyTo,
        envelope: {
          from,
          to,
        },
      });
      return { success: true };
    } catch (error) {
      this.logger.error('Contact email sending failed', error);
      throw new InternalServerErrorException(
        'Could not send the message. Please try again later.',
      );
    }
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
