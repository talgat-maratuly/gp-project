import {
  setToken,
  setRefreshToken,
  clearRefreshToken,
  setSessionRole,
  setDeviceId,
  getRefreshToken,
  clearToken,
  clearSessionRole,
} from './token.js'
import { API_URL } from './apiClient.js'

/** Save tokens after login / OTP / refresh */
export function persistAuthSession(response, { deviceId } = {}) {
  if (!response) return
  if (response.accessToken) setToken(response.accessToken)
  if (response.refreshToken) setRefreshToken(response.refreshToken)
  else clearRefreshToken()
  if (deviceId) setDeviceId(deviceId)
  const role = response.sessionRole || response.user?.role
  if (role) setSessionRole(role)
}

/** Revoke refresh on server (best-effort), then clear local auth state */
export async function clearAuthSession() {
  const refresh = getRefreshToken()
  if (refresh) {
    try {
      await fetch(`${API_URL}/auth/mobile/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      })
    } catch {
      /* offline / expired — still clear locally */
    }
  }
  clearToken()
  clearRefreshToken()
  clearSessionRole()
}

export function getWebDeviceMeta() {
  const app = import.meta.env?.VITE_APP_NAME || 'web'
  return {
    deviceName: `GP ${app}`,
    platform: 'web',
  }
}
