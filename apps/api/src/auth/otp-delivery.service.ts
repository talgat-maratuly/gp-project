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
        `Некорректный формат телефона: ${phone}. Ожидается +7XXXXXXXXXX или 8XXXXXXXXXX`,
      );
    }

    return digits;
  }

  async sendOtpViaWhatsapp(phone: string, code: string): Promise<boolean> {
    const url = process.env.WHATSAPP_SERVICE_URL?.trim();
    const token = process.env.WHATSAPP_SERVICE_TOKEN?.trim();

    if (!url || !token) {
      this.logger.warn(
        'WHATSAPP_SERVICE_URL или WHATSAPP_SERVICE_TOKEN не настроены — OTP через WhatsApp не отправлен',
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
          `Не удалось отправить WhatsApp OTP: HTTP ${response.status} (${normalizedPhone})`,
        );
        return false;
      }

      return true;
    } catch (err) {
      this.logger.warn(
        `Ошибка отправки WhatsApp OTP: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }

  private async dispatchSmsWebhook(
    phone: string,
    code: string,
    channel: OtpChannel,
  ): Promise<boolean> {
    const webhook = process.env.OTP_WEBHOOK_URL?.trim();
    if (!webhook) {
      this.logger.warn('OTP_WEBHOOK_URL не настроен — SMS OTP не отправлен');
      return false;
    }

    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, channel }),
      });
      if (!response.ok) {
        this.logger.warn(`Не удалось отправить SMS OTP: HTTP ${response.status} (${phone})`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.warn(
        `Ошибка SMS webhook: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
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
  ): Promise<{ smsSent?: boolean; whatsappSent?: boolean }> {
    if (channel === OtpChannel.whatsapp) {
      const whatsappSent = await this.sendOtpViaWhatsapp(phone, code);
      return { whatsappSent };
    }

    const smsSent = await this.dispatchSmsWebhook(phone, code, channel);
    return { smsSent };
  }
}
