import * as SecureStore from 'expo-secure-store';

const KEYS = {
  access: 'gp_access',
  refresh: 'gp_refresh',
  deviceId: 'gp_device_id',
  biometric: 'gp_biometric_on',
  user: 'gp_user_json',
  refreshExp: 'gp_refresh_exp',
} as const;

export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(KEYS.deviceId);
  if (!id) {
    id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    await SecureStore.setItemAsync(KEYS.deviceId, id);
  }
  return id;
}

export async function saveSession(payload: {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt?: string;
  user: { id: string; name: string; phone?: string | null; role: string };
  biometricEnabled?: boolean;
}) {
  await SecureStore.setItemAsync(KEYS.access, payload.accessToken);
  await SecureStore.setItemAsync(KEYS.refresh, payload.refreshToken);
  await SecureStore.setItemAsync(KEYS.user, JSON.stringify(payload.user));
  if (payload.refreshExpiresAt) {
    await SecureStore.setItemAsync(KEYS.refreshExp, payload.refreshExpiresAt);
  }
  if (payload.biometricEnabled != null) {
    await SecureStore.setItemAsync(KEYS.biometric, payload.biometricEnabled ? '1' : '0');
  }
}

export async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.access),
    SecureStore.deleteItemAsync(KEYS.refresh),
    SecureStore.deleteItemAsync(KEYS.user),
    SecureStore.deleteItemAsync(KEYS.refreshExp),
  ]);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(KEYS.access);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(KEYS.refresh);
}

export async function getStoredUser() {
  const raw = await SecureStore.getItemAsync(KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: string; name: string; phone?: string | null; role: string };
  } catch {
    return null;
  }
}

export async function isBiometricEnabled() {
  return (await SecureStore.getItemAsync(KEYS.biometric)) === '1';
}

export async function setBiometricEnabled(on: boolean) {
  await SecureStore.setItemAsync(KEYS.biometric, on ? '1' : '0');
}
