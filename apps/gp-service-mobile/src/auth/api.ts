import { API_URL } from '../config';
import { getAccessToken, getDeviceId, getRefreshToken } from './session';

type Json = Record<string, unknown>;

async function parseError(res: Response) {
  try {
    const data = await res.json();
    const msg = (data as { message?: string | string[] }).message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  } catch {
    /* ignore */
  }
  return `HTTP ${res.status}`;
}

export async function apiPost<T>(path: string, body: Json, auth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export type OtpSendResult = { ok: boolean; expiresInSec: number; devCode?: string };

export function sendOtp(phone: string, channel: 'sms' | 'whatsapp') {
  return apiPost<OtpSendResult>('/auth/mobile/otp/send', { phone, channel });
}

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresAt: string;
  isNewUser: boolean;
  user: { id: string; name: string; phone?: string | null; role: string };
};

export async function verifyOtp(
  phone: string,
  code: string,
  opts: { rememberDevice?: boolean; enableBiometric?: boolean; name?: string },
) {
  const deviceId = await getDeviceId();
  return apiPost<AuthResult>('/auth/mobile/otp/verify', {
    phone,
    code,
    deviceId,
    deviceName: 'GP Service Mobile',
    platform: 'expo',
    rememberDevice: opts.rememberDevice ?? true,
    enableBiometric: opts.enableBiometric ?? false,
    name: opts.name,
  });
}

export async function refreshSession() {
  const deviceId = await getDeviceId();
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error('NO_REFRESH');
  return apiPost<AuthResult>('/auth/mobile/refresh', { refreshToken, deviceId });
}

export async function logoutApi() {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    try {
      await apiPost('/auth/mobile/logout', { refreshToken });
    } catch {
      /* ignore */
    }
  }
}

export async function logoutAllApi() {
  return apiPost('/auth/mobile/logout-all', {}, true);
}

export async function fetchMe() {
  return apiGet<unknown>('/auth/me');
}
