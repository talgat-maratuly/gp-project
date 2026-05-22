import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';

export default function BiometricScreen() {
  const { unlockWithBiometric, skipBiometric, error, user } = useAuth();

  useEffect(() => {
    unlockWithBiometric();
  }, [unlockWithBiometric]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.logo}>GP Service</Text>
      <Text style={styles.name}>{user?.name}</Text>
      <ActivityIndicator size="large" color="#0d9488" style={{ marginVertical: 32 }} />
      <Text style={styles.hint}>Подтвердите Face ID или отпечаток</Text>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={unlockWithBiometric}>
        <Text style={styles.btnText}>Разблокировать</Text>
      </Pressable>
      <Pressable onPress={skipBiometric}>
        <Text style={styles.skip}>Пропустить</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  logo: { fontSize: 26, fontWeight: '800', color: '#0d9488' },
  name: { fontSize: 16, color: '#64748b', marginTop: 8 },
  hint: { fontSize: 14, color: '#475569' },
  err: { color: '#dc2626', marginTop: 12 },
  btn: {
    marginTop: 24,
    backgroundColor: '#0d9488',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  skip: { marginTop: 16, color: '#94a3b8', fontSize: 14 },
});
