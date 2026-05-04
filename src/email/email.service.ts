import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private frontendUrl: string;
  private emailFrom: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
    this.emailFrom = this.configService.get<string>(
      'EMAIL_FROM',
      'noreply@eduverse.dev',
    );

    if (!resendApiKey) {
      this.logger.warn('RESEND_API_KEY is not set; email sending is disabled.');
      return;
    }

    this.resend = new Resend(resendApiKey);
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(
      token,
    )}`;

    await this.sendEmail({
      to: email,
      subject: 'Confirm your email - EduVerse',
      html: `
        <h3>Welcome to EduVerse!</h3>
        <p>დაადასტურე შენი ელფოსტა რომ გააგრძელო:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(
      token,
    )}`;

    await this.sendEmail({
      to: email,
      subject: 'Reset your password - EduVerse',
      html: `
        <h3>Password Reset</h3>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    });
  }

  private async sendEmail(input: {
    to: string;
    subject: string;
    html: string;
  }) {
    if (!this.resend) {
      this.logger.warn(
        `Skipping email to ${input.to}; Resend is not configured.`,
      );
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.emailFrom,
        ...input,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${input.to}`, error as Error);
    }
  }
}
