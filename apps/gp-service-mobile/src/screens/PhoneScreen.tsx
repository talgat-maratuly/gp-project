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

export default function PhoneScreen({ onNext }: { onNext: (phone: string, channel: 'sms' | 'whatsapp') => void }) {
  const { sendOtp, error } = useAuth();
  const [phone, setPhone] = useState('+7');
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await sendOtp(phone, channel);
      onNext(phone, channel);
    } catch (e) {
      /* error in context */
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.logo}>GP Service</Text>
      <Text style={styles.sub}>Вход по номеру телефона</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+7 701 234 5678"
        placeholderTextColor="#94a3b8"
      />
      <View style={styles.row}>
        {(['sms', 'whatsapp'] as const).map((c) => (
          <Pressable
            key={c}
            onPress={() => setChannel(c)}
            style={[styles.chip, channel === c && styles.chipOn]}
          >
            <Text style={[styles.chipText, channel === c && styles.chipTextOn]}>
              {c === 'sms' ? 'SMS' : 'WhatsApp'}
            </Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Получить код</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f8fafc' },
  logo: { fontSize: 28, fontWeight: '800', color: '#0d9488', marginBottom: 8 },
  sub: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  chipOn: { backgroundColor: '#0d9488' },
  chipText: { fontWeight: '600', color: '#475569' },
  chipTextOn: { color: '#fff' },
  err: { color: '#dc2626', marginBottom: 12, fontSize: 13 },
  btn: {
    backgroundColor: '#0d9488',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
