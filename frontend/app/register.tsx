import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Error al registrarse');
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
            <Text style={styles.subtitle}>Crear tu cuenta</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>Registro</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOMBRE</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#A3A3A3" />
                <TextInput
                  testID="register-name-input"
                  style={styles.input}
                  placeholder="Tu nombre completo"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={18} color="#A3A3A3" />
                <TextInput
                  testID="register-email-input"
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color="#A3A3A3" />
                <TextInput
                  testID="register-password-input"
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color="#A3A3A3" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              testID="register-submit-btn"
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>CREAR CUENTA</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID="go-to-login-btn"
              style={styles.linkBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta? <Text style={styles.linkAccent}>Inicia Sesión</Text>
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
  title: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: 4 },
  subtitle: { fontSize: 14, color: '#A3A3A3', marginTop: 4 },
  form: {
    backgroundColor: '#171717', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  formTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 20 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.15)', padding: 12,
    borderRadius: 10, marginBottom: 16,
  },
  errorText: { color: '#FF3B30', fontSize: 13, flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: '#A3A3A3', letterSpacing: 2, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0A0A0A', borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 10,
  },
  input: { flex: 1, height: 48, color: '#FFFFFF', fontSize: 15 },
  button: {
    backgroundColor: '#FF3B30', borderRadius: 25, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  linkBtn: { alignItems: 'center', marginTop: 20 },
  linkText: { color: '#A3A3A3', fontSize: 14 },
  linkAccent: { color: '#CCFF00', fontWeight: '700' },
});
