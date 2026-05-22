import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';

export default function HomeScreen() {
  const { user, logout, logoutAll } = useAuth();

  return (
    <View style={styles.wrap}>
      <Text style={styles.logo}>GP Service</Text>
      <Text style={styles.welcome}>Здравствуйте, {user?.name}</Text>
      <Text style={styles.phone}>{user?.phone}</Text>
      <Text style={styles.note}>
        Мобильная сессия активна. Заказы и каталог подключаются к тому же API, что и веб-приложение.
      </Text>
      <Pressable style={styles.btnOutline} onPress={logout}>
        <Text style={styles.btnOutlineText}>Выйти с устройства</Text>
      </Pressable>
      <Pressable style={styles.btnDanger} onPress={logoutAll}>
        <Text style={styles.btnDangerText}>Выйти на всех устройствах</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, backgroundColor: '#f8fafc' },
  logo: { fontSize: 28, fontWeight: '800', color: '#0d9488', marginTop: 48 },
  welcome: { fontSize: 20, fontWeight: '700', marginTop: 24, color: '#0f172a' },
  phone: { fontSize: 14, color: '#64748b', marginTop: 4 },
  note: { fontSize: 14, color: '#475569', marginTop: 24, lineHeight: 22 },
  btnOutline: {
    marginTop: 32,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  btnOutlineText: { fontWeight: '600', color: '#334155' },
  btnDanger: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
  },
  btnDangerText: { fontWeight: '600', color: '#dc2626' },
});
