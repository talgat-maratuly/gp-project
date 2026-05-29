import { Injectable, Logger } from '@nestjs/common';
import { OtpChannel } from '@prisma/client';

/**
 * OTP жіберу (WhatsApp queue + опционалды SMS webhook).
 * gpartners-portal-api OtpService.sendOtpViaWhatsapp сияқты.
 */
@Injectable()
export class OtpDeliveryService {
  private readonly logger = new Logger(OtpDeliveryService.name);

  /** +7707..., 8707..., 7707... -> 7707... (тек цифрлар, 11 таңба) */
  normalizeKzPhoneForWhatsapp(phone: string): string {
    let digits = (phone || '').replace(/[^\d]/g, '');

    if (digits.length === 11 && digits.startsWith('8')) {
      digits = `7${digits.slice(1)}`;
    }

    if (digits.length === 10 && digits.startsWith('77')) {
      digits = `7${digits}`;
    }

    if (digits.length !== 11 || !digits.startsWith('7')) {
      throw new Error(
        `Телефон форматы дұрыс емес: ${phone}. Күтілетіні: +7XXXXXXXXXX немесе 8XXXXXXXXXX`,
      );
    }

    return digits;
  }

  async sendOtpViaWhatsapp(phone: string, code: string): Promise<boolean> {
    const url = process.env.WHATSAPP_SERVICE_URL?.trim();
    const token = process.env.WHATSAPP_SERVICE_TOKEN?.trim();

    if (!url || !token) {
      this.logger.warn(
        'WHATSAPP_SERVICE_URL немесе WHATSAPP_SERVICE_TOKEN орнатылмаған — OTP WhatsApp арқылы жіберілмеді',
      );
      return false;
    }

    try {
      const normalizedPhone = this.normalizeKzPhoneForWhatsapp(phone);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          message: code,
        }),
      });

      if (!response.ok) {
        this.logger.warn(
          `WhatsApp OTP жіберу сәтсіз: HTTP ${response.status} (${normalizedPhone})`,
        );
        return false;
      }

      return true;
    } catch (err) {
      this.logger.warn(
        `WhatsApp OTP жіберу қатесі: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }

  private async dispatchSmsWebhook(
    phone: string,
    code: string,
    channel: OtpChannel,
  ): Promise<void> {
    const webhook = process.env.OTP_WEBHOOK_URL?.trim();
    if (!webhook) return;

    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, channel }),
      });
    } catch (err) {
      this.logger.warn(
        `SMS webhook қатесі: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * OTP жіберу: whatsapp -> WHATSAPP_SERVICE_*; sms -> OTP_WEBHOOK_URL.
   * WhatsApp best-effort (сәтсіз болса да send эндпоинт 200 қайтарады).
   */
  async dispatchOtp(
    phone: string,
    code: string,
    channel: OtpChannel,
  ): Promise<{ whatsappSent?: boolean }> {
    if (channel === OtpChannel.whatsapp) {
      const whatsappSent = await this.sendOtpViaWhatsapp(phone, code);
      return { whatsappSent };
    }

    await this.dispatchSmsWebhook(phone, code, channel);
    return {};
  }
}
