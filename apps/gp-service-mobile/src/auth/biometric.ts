import * as LocalAuthentication from 'expo-local-authentication';

export async function canUseBiometric() {
  const hw = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hw && enrolled;
}

export async function promptBiometricUnlock(): Promise<boolean> {
  const supported = await canUseBiometric();
  if (!supported) return true;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Вход в GP Service',
    cancelLabel: 'Отмена',
    disableDeviceFallback: false,
    fallbackLabel: 'Код устройства',
  });
  return result.success;
}
