import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import PhoneScreen from './src/screens/PhoneScreen';
import OtpScreen from './src/screens/OtpScreen';
import BiometricScreen from './src/screens/BiometricScreen';
import HomeScreen from './src/screens/HomeScreen';

function Root() {
  const { phase } = useAuth();
  const [phone, setPhone] = useState('');

  if (phase === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  if (phase === 'login') {
    if (!phone) {
      return (
        <PhoneScreen
          onNext={(p) => setPhone(p)}
        />
      );
    }
    return <OtpScreen phone={phone} onBack={() => setPhone('')} />;
  }

  if (phase === 'biometric') {
    return <BiometricScreen />;
  }

  return <HomeScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <Root />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
