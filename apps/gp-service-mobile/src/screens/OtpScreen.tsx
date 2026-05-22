import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';

export default function OtpScreen({
  phone,
  onBack,
}: {
  phone: string;
  onBack: () => void;
}) {
  const { verifyOtp, error, devCode } = useAuth();
  const [code, setCode] = useState('');
  const [bio, setBio] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await verifyOtp(phone, code.trim(), bio);
    } catch {
      /* context */
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Код подтверждения</Text>
      <Text style={styles.sub}>{phone}</Text>
      {devCode ? (
        <Text style={styles.dev}>Dev-код: {devCode}</Text>
      ) : null}
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="000000"
        placeholderTextColor="#94a3b8"
        autoFocus
      />
      <Pressable onPress={() => setBio((b) => !b)} style={styles.bioRow}>
        <View style={[styles.check, bio && styles.checkOn]} />
        <Text style={styles.bioText}>Face ID / отпечаток при следующем входе</Text>
      </Pressable>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={submit} disabled={loading || code.length < 4}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Подтвердить устройство</Text>
        )}
      </Pressable>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>Изменить номер</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  dev: { fontSize: 13, color: '#0d9488', fontWeight: '700', marginBottom: 12 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 28,
    letterSpacing: 8,
    textAlign: 'center',
    marginVertical: 16,
  },
  bioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#cbd5e1' },
  checkOn: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  bioText: { flex: 1, fontSize: 13, color: '#475569' },
  err: { color: '#dc2626', marginBottom: 12 },
  btn: {
    backgroundColor: '#0d9488',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  back: { textAlign: 'center', color: '#64748b', fontSize: 14 },
});
