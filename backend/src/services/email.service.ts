import { env } from '../config/env';
import { Lead, Meeting } from '@prisma/client';
import { logger } from '../utils/logger';
import { getEmailTranslation } from '../utils/emailTranslations';

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

      // Set API key using the correct method
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = env.BREVO_API_KEY;

      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

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

  private getLocaleString(locale: string): string {
    const localeMap: Record<string, string> = {
      EN: 'en-US',
      SK: 'sk-SK',
      DE: 'de-DE',
      CZ: 'cs-CZ',
    };
    return localeMap[locale] || 'en-US';
  }

  async sendContactFormNotification(lead: Lead): Promise<void> {
    // Admin notifications are always in English
    const t = getEmailTranslation('EN').contactForm;

    const htmlContent = `
      <h2>${t.newLead}</h2>
      <p><strong>${t.name}:</strong> ${this.escapeHtml(lead.name)}</p>
      <p><strong>${t.email}:</strong> ${this.escapeHtml(lead.email)}</p>
      ${lead.phone ? `<p><strong>${t.phone}:</strong> ${this.escapeHtml(lead.phone)}</p>` : ''}
      <p><strong>${t.message}:</strong></p>
      <p>${this.escapeHtml(lead.message).replace(/\n/g, '<br>')}</p>
      <p><strong>${t.timestamp}:</strong> ${new Date(lead.createdAt).toLocaleString('en-US')}</p>
      <p><strong>Language:</strong> ${lead.locale}</p>
    `;

    await this.sendEmail({
      to: env.ADMIN_EMAIL,
      subject: t.subject,
      htmlContent,
    });
  }

  async sendMeetingConfirmation(meeting: Meeting): Promise<void> {
    const scheduledDate = new Date(meeting.scheduledAt);
    const userLocale = meeting.locale || 'EN';
    const localeString = this.getLocaleString(userLocale);
    const t = getEmailTranslation(userLocale as any).meetingUser;

    // Format date and time in the user's locale and timezone
    const formattedDate = scheduledDate.toLocaleDateString(localeString, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: meeting.timezone,
    });

    const formattedTime = scheduledDate.toLocaleTimeString(localeString, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: meeting.timezone,
    });

    const htmlContent = `
      <h2>${t.title}</h2>
      <p>${t.hello} ${this.escapeHtml(meeting.name)},</p>
      <p>${t.confirmed}</p>
      <h3>${t.details}</h3>
      <ul>
        <li><strong>${t.date}:</strong> ${formattedDate}</li>
        <li><strong>${t.time}:</strong> ${formattedTime} (${meeting.timezone})</li>
        <li><strong>${t.duration}:</strong> ${meeting.duration} ${t.minutes}</li>
      </ul>
      ${meeting.notes ? `<p><strong>${t.notes}:</strong> ${this.escapeHtml(meeting.notes)}</p>` : ''}
      <p>${t.lookForward}</p>
      <p>${t.bestRegards},<br>${t.team}</p>
    `;

    await this.sendEmail({
      to: meeting.email,
      subject: t.subject,
      htmlContent,
    });

    // Also notify admin (in English)
    const tAdmin = getEmailTranslation('EN').meetingAdmin;
    const adminDate = scheduledDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: meeting.timezone,
    });
    const adminTime = scheduledDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: meeting.timezone,
    });

    const adminHtmlContent = `
      <h2>${tAdmin.title}</h2>
      <p><strong>${tAdmin.name}:</strong> ${this.escapeHtml(meeting.name)}</p>
      <p><strong>${tAdmin.email}:</strong> ${this.escapeHtml(meeting.email)}</p>
      ${meeting.phone ? `<p><strong>${tAdmin.phone}:</strong> ${this.escapeHtml(meeting.phone)}</p>` : ''}
      <p><strong>${tAdmin.date}:</strong> ${adminDate}</p>
      <p><strong>${tAdmin.time}:</strong> ${adminTime} (${meeting.timezone})</p>
      <p><strong>${tAdmin.duration}:</strong> ${meeting.duration} ${tAdmin.minutes}</p>
      <p><strong>Language:</strong> ${userLocale}</p>
      ${meeting.notes ? `<p><strong>${tAdmin.notes}:</strong> ${this.escapeHtml(meeting.notes)}</p>` : ''}
    `;

    await this.sendEmail({
      to: env.ADMIN_EMAIL,
      subject: tAdmin.subject,
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

