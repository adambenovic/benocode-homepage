// services/email.service.ts
import { env } from '../config/env';
import { Lead, Meeting } from '@prisma/client';
import { logger } from '../utils/logger';

export class EmailService {
  private async sendEmail(options: {
    to: string | string[];
    subject: string;
    htmlContent: string;
    sender?: { name: string; email: string };
  }): Promise<void> {
    try {
      // Check if Brevo API key is configured
      if (!env.BREVO_API_KEY || env.BREVO_API_KEY === 'placeholder-api-key-for-development') {
        logger.info('Email service not configured (using placeholder API key)', {
          to: options.to,
          subject: options.subject,
        });
        return;
      }

      const SibApiV3Sdk = require('@getbrevo/brevo');
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      
      apiInstance.setApiKey(
        SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
        env.BREVO_API_KEY
      );

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.subject = options.subject;
      sendSmtpEmail.htmlContent = options.htmlContent;
      sendSmtpEmail.sender = options.sender || {
        name: 'BenoCode Website',
        email: env.BREVO_SENDER_EMAIL,
      };
      sendSmtpEmail.to = Array.isArray(options.to)
        ? options.to.map((email) => ({ email }))
        : [{ email: options.to }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      logger.info('Email sent successfully', { to: options.to, subject: options.subject });
    } catch (error) {
      logger.error('Failed to send email', { error, to: options.to, subject: options.subject });
      throw error;
    }
  }

  async sendContactFormNotification(lead: Lead): Promise<void> {
    const htmlContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${this.escapeHtml(lead.name)}</p>
      <p><strong>Email:</strong> ${this.escapeHtml(lead.email)}</p>
      ${lead.phone ? `<p><strong>Phone:</strong> ${this.escapeHtml(lead.phone)}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p>${this.escapeHtml(lead.message).replace(/\n/g, '<br>')}</p>
      <p><strong>Submitted:</strong> ${new Date(lead.createdAt).toLocaleString()}</p>
    `;

    await this.sendEmail({
      to: env.ADMIN_EMAIL,
      subject: 'New Contact Form Submission - BenoCode',
      htmlContent,
    });
  }

  async sendMeetingConfirmation(meeting: Meeting): Promise<void> {
    const scheduledDate = new Date(meeting.scheduledAt);
    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const htmlContent = `
      <h2>Meeting Confirmed</h2>
      <p>Hello ${this.escapeHtml(meeting.name)},</p>
      <p>Your meeting with BenoCode has been confirmed.</p>
      <h3>Meeting Details:</h3>
      <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${formattedTime} (${meeting.timezone})</li>
        <li><strong>Duration:</strong> ${meeting.duration} minutes</li>
      </ul>
      ${meeting.notes ? `<p><strong>Notes:</strong> ${this.escapeHtml(meeting.notes)}</p>` : ''}
      <p>We look forward to speaking with you!</p>
      <p>Best regards,<br>BenoCode Team</p>
    `;

    await this.sendEmail({
      to: meeting.email,
      subject: 'Meeting Confirmed - BenoCode',
      htmlContent,
    });

    // Also notify admin
    const adminHtmlContent = `
      <h2>New Meeting Scheduled</h2>
      <p><strong>Name:</strong> ${this.escapeHtml(meeting.name)}</p>
      <p><strong>Email:</strong> ${this.escapeHtml(meeting.email)}</p>
      ${meeting.phone ? `<p><strong>Phone:</strong> ${this.escapeHtml(meeting.phone)}</p>` : ''}
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${formattedTime} (${meeting.timezone})</p>
      <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
      ${meeting.notes ? `<p><strong>Notes:</strong> ${this.escapeHtml(meeting.notes)}</p>` : ''}
    `;

    await this.sendEmail({
      to: env.ADMIN_EMAIL,
      subject: 'New Meeting Scheduled - BenoCode',
      htmlContent: adminHtmlContent,
    });
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

