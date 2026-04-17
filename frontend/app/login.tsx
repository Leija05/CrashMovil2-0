import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={48} color="#FF3B30" />
            </View>
            <Text style={styles.title}>C.R.A.S.H.</Text>
            <Text style={styles.subtitle}>Collision Response & Alert Safety Hub</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>Iniciar Sesión</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={18} color="#A3A3A3" />
                <TextInput
                  testID="login-email-input"
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color="#A3A3A3" />
                <TextInput
                  testID="login-password-input"
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} testID="toggle-password-btn">
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color="#A3A3A3" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              testID="login-submit-btn"
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>ENTRAR</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID="go-to-register-btn"
              style={styles.linkBtn}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.linkText}>
                ¿No tienes cuenta? <Text style={styles.linkAccent}>Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(255,59,48,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: {
    fontSize: 36, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 12, color: '#A3A3A3', letterSpacing: 1.5,
    marginTop: 4, textTransform: 'uppercase',
  },
  form: {
    backgroundColor: '#171717', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  formTitle: {
    fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.15)', padding: 12,
    borderRadius: 10, marginBottom: 16,
  },
  errorText: { color: '#FF3B30', fontSize: 13, flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 11, fontWeight: '700', color: '#A3A3A3',
    letterSpacing: 2, marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0A0A0A', borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 10,
  },
  input: {
    flex: 1, height: 48, color: '#FFFFFF', fontSize: 15,
  },
  button: {
    backgroundColor: '#FF3B30', borderRadius: 25, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 2,
  },
  linkBtn: { alignItems: 'center', marginTop: 20 },
  linkText: { color: '#A3A3A3', fontSize: 14 },
  linkAccent: { color: '#CCFF00', fontWeight: '700' },
});
