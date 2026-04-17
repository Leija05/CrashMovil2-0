import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { impactsAPI } from '../../src/services/api';
import { bluetoothService } from '../../src/services/bluetooth';

const COLORS = {
  bg: '#0A0A0A', surface: '#171717', elevated: '#262626',
  primary: '#FF3B30', accent: '#CCFF00', text: '#FFFFFF',
  textSec: '#A3A3A3', border: 'rgba(255,255,255,0.1)',
  success: '#34C759', warning: '#FF9500',
};

function sevColor(s: string) {
  if (s === 'low') return COLORS.success;
  if (s === 'medium') return COLORS.warning;
  if (s === 'high') return '#FF6B00';
  return COLORS.primary;
}

export default function ImpactsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [impacts, setImpacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const fetchImpacts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await impactsAPI.list(token);
      setImpacts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchImpacts(); }, [fetchImpacts]));

  const simulateImpact = async (severity: 'low' | 'medium' | 'high' | 'critical') => {
    if (!token) return;
    setSimulating(true);
    try {
      const data = bluetoothService.simulateImpact(severity);
      const newImpact = await impactsAPI.create(token, {
        acceleration_x: data.acceleration_x,
        acceleration_y: data.acceleration_y,
        acceleration_z: data.acceleration_z,
        gyroscope_x: data.gyroscope_x,
        gyroscope_y: data.gyroscope_y,
        gyroscope_z: data.gyroscope_z,
        g_force: data.g_force,
        latitude: 19.4326,
        longitude: -99.1332,
      });
      // Immediately prepend the new impact to the list
      setImpacts(prev => [newImpact, ...prev]);
    } catch (e: any) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderImpact = ({ item }: { item: any }) => (
    <TouchableOpacity
      testID={`impact-item-${item.id}`}
      style={styles.card}
      onPress={() => router.push(`/impact/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.sevIndicator, { backgroundColor: sevColor(item.severity) }]} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardSeverity}>{item.severity_label || item.severity}</Text>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.cardGForce, { color: sevColor(item.severity) }]}>
            {item.g_force?.toFixed(1)}G
          </Text>
          {item.ai_diagnosis && (
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={10} color={COLORS.accent} />
              <Text style={styles.aiText}>IA</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>HISTORIAL DE IMPACTOS</Text>
        <Text style={styles.countText}>{impacts.length} registros</Text>
      </View>

      {/* Simulate Impact Buttons */}
      <View style={styles.simSection}>
        <Text style={styles.simLabel}>SIMULAR IMPACTO</Text>
        <View style={styles.simBtns}>
          {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
            <TouchableOpacity
              key={sev}
              testID={`simulate-${sev}-btn`}
              style={[styles.simBtn, { borderColor: sevColor(sev) }]}
              onPress={() => simulateImpact(sev)}
              disabled={simulating}
              activeOpacity={0.7}
            >
              {simulating ? (
                <ActivityIndicator size="small" color={sevColor(sev)} />
              ) : (
                <Text style={[styles.simBtnText, { color: sevColor(sev) }]}>
                  {sev === 'low' ? 'BAJO' : sev === 'medium' ? 'MEDIO' : sev === 'high' ? 'ALTO' : 'CRÍTICO'}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={impacts}
          keyExtractor={(item) => item.id}
          renderItem={renderImpact}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchImpacts(); }} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="shield-checkmark" size={48} color="#333" />
              <Text style={styles.emptyText}>Sin impactos registrados</Text>
              <Text style={styles.emptySubtext}>Usa los botones de simulación para probar</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 3 },
  countText: { fontSize: 12, color: COLORS.textSec, marginTop: 4 },
  simSection: { paddingHorizontal: 20, paddingVertical: 12 },
  simLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSec, letterSpacing: 2, marginBottom: 8 },
  simBtns: { flexDirection: 'row', gap: 8 },
  simBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  simBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  sevIndicator: { width: 4, height: 36, borderRadius: 2, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardSeverity: { fontSize: 15, fontWeight: '700', color: COLORS.text, textTransform: 'uppercase' },
  cardDate: { fontSize: 11, color: COLORS.textSec, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardGForce: { fontSize: 22, fontWeight: '900' },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(204,255,0,0.1)', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, marginTop: 4,
  },
  aiText: { fontSize: 9, fontWeight: '800', color: COLORS.accent, letterSpacing: 1 },
  cardFooter: { alignItems: 'flex-end', marginTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16, fontWeight: '600' },
  emptySubtext: { fontSize: 12, color: '#444', marginTop: 4 },
});
