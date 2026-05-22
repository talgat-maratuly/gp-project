import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { canUseBiometric, promptBiometricUnlock } from './biometric';
import {
  clearSession,
  getRefreshToken,
  isBiometricEnabled,
  saveSession,
  setBiometricEnabled,
} from './session';
import { logoutAllApi, logoutApi, refreshSession, sendOtp, verifyOtp } from './api';

export type AuthPhase = 'loading' | 'login' | 'biometric' | 'app';

type User = { id: string; name: string; phone?: string | null; role: string };

type AuthContextValue = {
  phase: AuthPhase;
  user: User | null;
  error: string | null;
  devCode: string | null;
  sendOtp: (phone: string, channel: 'sms' | 'whatsapp') => Promise<void>;
  verifyOtp: (phone: string, code: string, enableBiometric: boolean) => Promise<void>;
  unlockWithBiometric: () => Promise<void>;
  skipBiometric: () => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<AuthPhase>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const applyAuth = useCallback(async (data: Awaited<ReturnType<typeof refreshSession>>, bio?: boolean) => {
    await saveSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      refreshExpiresAt: data.refreshExpiresAt,
      user: data.user,
      biometricEnabled: bio,
    });
    setUser(data.user);
    if (bio != null) await setBiometricEnabled(bio);
    setPhase('app');
  }, []);

  const bootstrap = useCallback(async () => {
    setError(null);
    try {
      const refresh = await getRefreshToken();
      if (!refresh) {
        setPhase('login');
        return;
      }
      const data = await refreshSession();
      const bio = await isBiometricEnabled();
      await saveSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        refreshExpiresAt: data.refreshExpiresAt,
        user: data.user,
      });
      setUser(data.user);
      if (bio && (await canUseBiometric())) {
        setPhase('biometric');
      } else {
        setPhase('app');
      }
    } catch {
      await clearSession();
      setUser(null);
      setPhase('login');
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const sendOtpHandler = useCallback(async (phone: string, channel: 'sms' | 'whatsapp') => {
    setError(null);
    try {
      const res = await sendOtp(phone, channel);
      setDevCode(res.devCode ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось отправить код';
      setError(msg);
      throw e;
    }
  }, []);

  const verifyOtpHandler = useCallback(
    async (phone: string, code: string, enableBiometric: boolean) => {
      setError(null);
      try {
        const canBio = enableBiometric && (await canUseBiometric());
        const data = await verifyOtp(phone, code, {
          rememberDevice: true,
          enableBiometric: canBio,
        });
        await applyAuth(data, canBio);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка входа');
        throw e;
      }
    },
    [applyAuth],
  );

  const unlockWithBiometric = useCallback(async () => {
    const ok = await promptBiometricUnlock();
    if (ok) setPhase('app');
    else setError('Биометрия не подтверждена');
  }, []);

  const skipBiometric = useCallback(() => setPhase('app'), []);

  const logout = useCallback(async () => {
    await logoutApi();
    await clearSession();
    setUser(null);
    setPhase('login');
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await logoutAllApi();
    } catch {
      /* token may be expired */
    }
    await clearSession();
    setUser(null);
    setPhase('login');
  }, []);

  const value = useMemo(
    () => ({
      phase,
      user,
      error,
      devCode,
      sendOtp: sendOtpHandler,
      verifyOtp: verifyOtpHandler,
      unlockWithBiometric,
      skipBiometric,
      logout,
      logoutAll,
    }),
    [
      phase,
      user,
      error,
      devCode,
      sendOtpHandler,
      verifyOtpHandler,
      unlockWithBiometric,
      skipBiometric,
      logout,
      logoutAll,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
