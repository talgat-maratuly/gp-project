import Constants from 'expo-constants';

/** LAN IP для теста с телефона: EXPO_PUBLIC_API_URL=http://192.168.x.x:4000 */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:4000'
).replace(/\/$/, '');
