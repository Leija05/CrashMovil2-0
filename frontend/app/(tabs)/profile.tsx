import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { profileAPI, settingsAPI } from '../../src/services/api';

const COLORS = {
  bg: '#0A0A0A', surface: '#171717', elevated: '#262626',
  primary: '#FF3B30', accent: '#CCFF00', text: '#FFFFFF',
  textSec: '#A3A3A3', border: 'rgba(255,255,255,0.1)',
  success: '#34C759', warning: '#FF9500', info: '#007AFF',
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState<any>({});
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'medical' | 'settings'>('medical');
  // Form state
  const [fullName, setFullName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');
  const [disabilitiesText, setDisabilitiesText] = useState('');
  const [notes, setNotes] = useState('');
  const [threshold, setThreshold] = useState('5');
  const [autoCall, setAutoCall] = useState(true);
  const [autoWhatsapp, setAutoWhatsapp] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [p, s] = await Promise.all([profileAPI.get(token), settingsAPI.get(token)]);
      setProfile(p);
      setSettings(s);
      setFullName(p.full_name || '');
      setBloodType(p.blood_type || '');
      setAllergiesText((p.allergies || []).join(', '));
      setConditionsText((p.medical_conditions || []).join(', '));
      setDisabilitiesText((p.disabilities || []).join(', '));
      setNotes(p.emergency_notes || '');
      setThreshold(String(s.alert_threshold || 5));
      setAutoCall(s.auto_call !== false);
      setAutoWhatsapp(s.auto_whatsapp !== false);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const saveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await profileAPI.update(token, {
        full_name: fullName.trim(),
        blood_type: bloodType,
        allergies: allergiesText.split(',').map(s => s.trim()).filter(Boolean),
        medical_conditions: conditionsText.split(',').map(s => s.trim()).filter(Boolean),
        disabilities: disabilitiesText.split(',').map(s => s.trim()).filter(Boolean),
        emergency_notes: notes.trim(),
      });
      Alert.alert('Guardado', 'Perfil médico actualizado');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSaving(false); }
  };

  const saveSettings = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const t = parseFloat(threshold);
      if (isNaN(t) || t <= 0) {
        Alert.alert('Error', 'El umbral debe ser un número positivo');
        setSaving(false);
        return;
      }
      await settingsAPI.update(token, { alert_threshold: t, auto_call: autoCall, auto_whatsapp: autoWhatsapp });
      Alert.alert('Guardado', 'Configuración actualizada');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSaving(false); }
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.accent} />}
          keyboardShouldPersistTaps="handled"
        >
          {/* User Info */}
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={28} color={COLORS.accent} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabs}>
            <TouchableOpacity testID="medical-tab-btn" style={[styles.tabBtn, tab === 'medical' && styles.tabActive]} onPress={() => setTab('medical')}>
              <Text style={[styles.tabText, tab === 'medical' && styles.tabTextActive]}>PERFIL MÉDICO</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="settings-tab-btn" style={[styles.tabBtn, tab === 'settings' && styles.tabActive]} onPress={() => setTab('settings')}>
              <Text style={[styles.tabText, tab === 'settings' && styles.tabTextActive]}>CONFIGURACIÓN</Text>
            </TouchableOpacity>
          </View>

          {tab === 'medical' ? (
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOMBRE COMPLETO</Text>
                <TextInput testID="profile-fullname-input" style={styles.input} value={fullName} onChangeText={setFullName} placeholderTextColor="#666" placeholder="Tu nombre" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>TIPO DE SANGRE</Text>
                <View style={styles.bloodGrid}>
                  {BLOOD_TYPES.map(bt => (
                    <TouchableOpacity key={bt} testID={`blood-type-${bt}`} style={[styles.bloodBtn, bloodType === bt && styles.bloodBtnActive]} onPress={() => setBloodType(bt)}>
                      <Text style={[styles.bloodText, bloodType === bt && styles.bloodTextActive]}>{bt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ALERGIAS (separadas por coma)</Text>
                <TextInput testID="profile-allergies-input" style={styles.input} value={allergiesText} onChangeText={setAllergiesText} placeholder="Penicilina, aspirina..." placeholderTextColor="#666" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONDICIONES MÉDICAS (separadas por coma)</Text>
                <TextInput testID="profile-conditions-input" style={styles.input} value={conditionsText} onChangeText={setConditionsText} placeholder="Diabetes, hipertensión..." placeholderTextColor="#666" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DISCAPACIDADES (separadas por coma)</Text>
                <TextInput testID="profile-disabilities-input" style={styles.input} value={disabilitiesText} onChangeText={setDisabilitiesText} placeholder="Ninguna" placeholderTextColor="#666" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOTAS DE EMERGENCIA</Text>
                <TextInput testID="profile-notes-input" style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Información adicional para servicios de emergencia..." placeholderTextColor="#666" multiline numberOfLines={3} textAlignVertical="top" />
              </View>

              <TouchableOpacity testID="save-profile-btn" style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveProfile} disabled={saving}>
                {saving ? <ActivityIndicator color="#0A0A0A" /> : <Text style={styles.saveBtnText}>GUARDAR PERFIL</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>UMBRAL DE ALERTA (G)</Text>
                <Text style={styles.thresholdDesc}>Enviar alertas cuando la fuerza G supere este valor</Text>
                <TextInput testID="threshold-input" style={styles.input} value={threshold} onChangeText={setThreshold} keyboardType="numeric" placeholderTextColor="#666" />
                <View style={styles.thresholdScale}>
                  {[{l:'Bajo',v:'5',c:COLORS.success},{l:'Medio',v:'10',c:COLORS.warning},{l:'Alto',v:'15',c:'#FF6B00'},{l:'Crítico',v:'20',c:COLORS.primary}].map(t => (
                    <TouchableOpacity key={t.v} style={[styles.threshBtn, {borderColor: t.c}]} onPress={() => setThreshold(t.v)}>
                      <Text style={[styles.threshText, {color: t.c}]}>{t.l}</Text>
                      <Text style={[styles.threshVal, {color: t.c}]}>{t.v}G</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.toggleGroup}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Ionicons name="call-outline" size={20} color={COLORS.text} />
                    <Text style={styles.toggleLabel}>Llamadas automáticas</Text>
                  </View>
                  <TouchableOpacity testID="auto-call-toggle" style={[styles.toggle, autoCall && styles.toggleOn]} onPress={() => setAutoCall(!autoCall)}>
                    <View style={[styles.toggleDot, autoCall && styles.toggleDotOn]} />
                  </TouchableOpacity>
                </View>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Ionicons name="logo-whatsapp" size={20} color={COLORS.text} />
                    <Text style={styles.toggleLabel}>Alertas WhatsApp</Text>
                  </View>
                  <TouchableOpacity testID="auto-whatsapp-toggle" style={[styles.toggle, autoWhatsapp && styles.toggleOn]} onPress={() => setAutoWhatsapp(!autoWhatsapp)}>
                    <View style={[styles.toggleDot, autoWhatsapp && styles.toggleDotOn]} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity testID="save-settings-btn" style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveSettings} disabled={saving}>
                {saving ? <ActivityIndicator color="#0A0A0A" /> : <Text style={styles.saveBtnText}>GUARDAR CONFIGURACIÓN</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.primary} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  userAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(204,255,0,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: 13, color: COLORS.textSec, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: 'rgba(204,255,0,0.1)', borderColor: COLORS.accent },
  tabText: { fontSize: 11, fontWeight: '700', color: '#666', letterSpacing: 1.5 },
  tabTextActive: { color: COLORS.accent },
  section: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.textSec, letterSpacing: 2, marginBottom: 6 },
  input: { backgroundColor: COLORS.bg, borderRadius: 12, paddingHorizontal: 14, height: 48, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border },
  textArea: { height: 80, paddingTop: 12 },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bloodBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border },
  bloodBtnActive: { backgroundColor: 'rgba(255,59,48,0.15)', borderColor: COLORS.primary },
  bloodText: { fontSize: 14, fontWeight: '700', color: '#666' },
  bloodTextActive: { color: COLORS.primary },
  thresholdDesc: { fontSize: 12, color: COLORS.textSec, marginBottom: 8 },
  thresholdScale: { flexDirection: 'row', gap: 8, marginTop: 12 },
  threshBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  threshText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  threshVal: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  toggleGroup: { marginBottom: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { fontSize: 15, color: COLORS.text },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#333', justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: COLORS.accent },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#666' },
  toggleDotOn: { backgroundColor: '#0A0A0A', alignSelf: 'flex-end' },
  saveBtn: { backgroundColor: COLORS.accent, borderRadius: 25, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText: { color: '#0A0A0A', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  logoutText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
});
