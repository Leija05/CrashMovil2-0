import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { bluetoothService, TelemetryData } from '../../src/services/bluetooth';

const COLORS = {
  bg: '#0A0A0A', surface: '#171717', elevated: '#262626',
  primary: '#FF3B30', accent: '#CCFF00', text: '#FFFFFF',
  textSec: '#A3A3A3', border: 'rgba(255,255,255,0.1)',
  success: '#34C759', warning: '#FF9500', info: '#007AFF',
};

function getSeverityColor(gForce: number) {
  if (gForce < 5) return COLORS.success;
  if (gForce < 10) return COLORS.warning;
  if (gForce < 15) return '#FF6B00';
  return COLORS.primary;
}

function getSeverityLabel(gForce: number) {
  if (gForce < 5) return 'NORMAL';
  if (gForce < 10) return 'MEDIO';
  if (gForce < 15) return 'ALTO';
  return 'CRÍTICO';
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = bluetoothService.onTelemetry((data) => {
      setTelemetry(data);
    });
    setConnected(bluetoothService.isConnected());
    return unsub;
  }, []);

  const handleConnect = async () => {
    if (connected) {
      await bluetoothService.disconnect();
      setConnected(false);
      setTelemetry(null);
      return;
    }
    setScanning(true);
    const devices = await bluetoothService.scanDevices();
    if (devices.length > 0) {
      const ok = await bluetoothService.connect(devices[0]);
      setConnected(ok);
    }
    setScanning(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setConnected(bluetoothService.isConnected());
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const gForce = telemetry?.g_force ?? 0;
  const sevColor = getSeverityColor(gForce);
  const sevLabel = getSeverityLabel(gForce);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.name || 'Rider'}</Text>
            <Text style={styles.appName}>C.R.A.S.H.</Text>
          </View>
          <View style={[styles.statusBadge, connected && styles.statusConnected]}>
            <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.success : '#666' }]} />
            <Text style={[styles.statusText, connected && { color: COLORS.success }]}>
              {connected ? 'CONECTADO' : 'DESCONECTADO'}
            </Text>
          </View>
        </View>

        {/* G-Force Main Display */}
        <View style={[styles.gForceCard, { borderColor: connected ? `${sevColor}40` : COLORS.border }]}>
          <Text style={styles.gLabel}>FUERZA G</Text>
          <Text style={[styles.gValue, { color: connected ? sevColor : '#666' }]}>
            {connected ? gForce.toFixed(2) : '-.--'}
          </Text>
          <Text style={styles.gUnit}>G</Text>
          {connected && (
            <View style={[styles.sevBadge, { backgroundColor: `${sevColor}20` }]}>
              <Text style={[styles.sevText, { color: sevColor }]}>{sevLabel}</Text>
            </View>
          )}
        </View>

        {/* Telemetry Grid */}
        <Text style={styles.sectionTitle}>TELEMETRÍA EN TIEMPO REAL</Text>
        <View style={styles.grid}>
          <MetricCard label="ACCEL X" value={telemetry?.acceleration_x} unit="m/s²" color={COLORS.info} connected={connected} />
          <MetricCard label="ACCEL Y" value={telemetry?.acceleration_y} unit="m/s²" color={COLORS.info} connected={connected} />
          <MetricCard label="ACCEL Z" value={telemetry?.acceleration_z} unit="m/s²" color={COLORS.accent} connected={connected} />
          <MetricCard label="GYRO X" value={telemetry?.gyroscope_x} unit="°/s" color={COLORS.warning} connected={connected} />
          <MetricCard label="GYRO Y" value={telemetry?.gyroscope_y} unit="°/s" color={COLORS.warning} connected={connected} />
          <MetricCard label="GYRO Z" value={telemetry?.gyroscope_z} unit="°/s" color="#FF6B00" connected={connected} />
        </View>

        {/* Connect Button */}
        <TouchableOpacity
          testID="connect-helmet-btn"
          style={[styles.connectBtn, connected && styles.connectBtnActive]}
          onPress={handleConnect}
          activeOpacity={0.8}
        >
          <Ionicons
            name={scanning ? 'bluetooth-outline' : connected ? 'bluetooth' : 'bluetooth-outline'}
            size={22}
            color={connected ? '#0A0A0A' : '#FFFFFF'}
          />
          <Text style={[styles.connectText, connected && styles.connectTextActive]}>
            {scanning ? 'ESCANEANDO...' : connected ? 'DESCONECTAR CASCO' : 'CONECTAR CASCO'}
          </Text>
        </TouchableOpacity>

        {/* Simulation Note */}
        {connected && bluetoothService.isSimulationMode() && (
          <View style={styles.simNote}>
            <Ionicons name="information-circle" size={14} color={COLORS.info} />
            <Text style={styles.simText}>Modo simulación activo</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value, unit, color, connected }: {
  label: string; value?: number; unit: string; color: string; connected: boolean;
}) {
  return (
    <View style={styles.metric} testID={`metric-${label.toLowerCase().replace(' ', '-')}`}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: connected ? color : '#444' }]}>
        {connected && value !== undefined ? value.toFixed(2) : '-.--'}
      </Text>
      <Text style={styles.metricUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: COLORS.textSec },
  appName: { fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: 3 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  statusConnected: { borderColor: 'rgba(52,199,89,0.3)', backgroundColor: 'rgba(52,199,89,0.1)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#666', letterSpacing: 1 },
  gForceCard: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: 24,
  },
  gLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSec, letterSpacing: 3, marginBottom: 8 },
  gValue: { fontSize: 72, fontWeight: '900', color: '#666', lineHeight: 80 },
  gUnit: { fontSize: 18, fontWeight: '700', color: COLORS.textSec, marginTop: -4 },
  sevBadge: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 10 },
  sevText: { fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: COLORS.textSec,
    letterSpacing: 3, marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  metric: {
    width: '48%', flexGrow: 1, backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  metricLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSec, letterSpacing: 1.5, marginBottom: 6 },
  metricValue: { fontSize: 24, fontWeight: '900', color: '#444' },
  metricUnit: { fontSize: 10, color: COLORS.textSec, marginTop: 2 },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.elevated, borderRadius: 25, height: 52,
    borderWidth: 1, borderColor: COLORS.border,
  },
  connectBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  connectText: { fontSize: 14, fontWeight: '800', color: COLORS.text, letterSpacing: 1.5 },
  connectTextActive: { color: '#0A0A0A' },
  simNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 12,
  },
  simText: { fontSize: 11, color: COLORS.info },
});
