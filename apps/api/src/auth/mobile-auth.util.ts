import { createHash, randomBytes, randomInt } from 'crypto';

export function normalizePhone(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`;
  throw new Error('INVALID_PHONE');
}

export function phoneToEmail(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return `p${d}@phone.gp.kz`;
}

export function generateOtpCode(): string {
  if (process.env.MOBILE_OTP_FIXED) return process.env.MOBILE_OTP_FIXED;
  return String(randomInt(100000, 999999));
}

export function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

export function newFamilyId(): string {
  return randomBytes(16).toString('hex');
}
