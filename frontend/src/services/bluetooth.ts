// Bluetooth Service for C.R.A.S.H.
// Supports HC-05 (Classic) and HC-10 (BLE) modules
// Includes simulation mode for testing without hardware

export type TelemetryData = {
  acceleration_x: number;
  acceleration_y: number;
  acceleration_z: number;
  gyroscope_x: number;
  gyroscope_y: number;
  gyroscope_z: number;
  g_force: number;
  timestamp: number;
};

export type BluetoothDevice = {
  id: string;
  name: string;
  type: 'classic' | 'ble';
  rssi: number;
};

type TelemetryCallback = (data: TelemetryData) => void;

class BluetoothService {
  private isSimulation = true;
  private connected = false;
  private deviceName = '';
  private listeners: TelemetryCallback[] = [];
  private simulationInterval: ReturnType<typeof setInterval> | null = null;

  isConnected(): boolean {
    return this.connected;
  }

  getDeviceName(): string {
    return this.deviceName;
  }

  isSimulationMode(): boolean {
    return this.isSimulation;
  }

  onTelemetry(callback: TelemetryCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private emit(data: TelemetryData) {
    this.listeners.forEach(l => l(data));
  }

  // Scan for devices (simulation returns fake devices)
  async scanDevices(): Promise<BluetoothDevice[]> {
    if (this.isSimulation) {
      await new Promise(r => setTimeout(r, 1500));
      return [
        { id: 'sim-hc05-001', name: 'HC-05 CRASH', type: 'classic', rssi: -45 },
        { id: 'sim-hc10-001', name: 'HC-10 CRASH BLE', type: 'ble', rssi: -38 },
      ];
    }
    // Real BLE scanning would go here with react-native-ble-plx
    return [];
  }

  // Connect to device
  async connect(device: BluetoothDevice): Promise<boolean> {
    if (this.isSimulation) {
      await new Promise(r => setTimeout(r, 1000));
      this.connected = true;
      this.deviceName = device.name;
      this.startSimulation();
      return true;
    }
    // Real connection logic would go here
    return false;
  }

  // Disconnect
  async disconnect(): Promise<void> {
    this.connected = false;
    this.deviceName = '';
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  // Start simulation mode - generates realistic telemetry data
  private startSimulation() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);

    this.simulationInterval = setInterval(() => {
      const baseAccelX = (Math.random() - 0.5) * 2;
      const baseAccelY = (Math.random() - 0.5) * 2;
      const baseAccelZ = 9.8 + (Math.random() - 0.5) * 0.5;
      const gyroX = (Math.random() - 0.5) * 10;
      const gyroY = (Math.random() - 0.5) * 10;
      const gyroZ = (Math.random() - 0.5) * 10;
      const gForce = Math.sqrt(baseAccelX ** 2 + baseAccelY ** 2 + baseAccelZ ** 2) / 9.8;

      this.emit({
        acceleration_x: parseFloat(baseAccelX.toFixed(3)),
        acceleration_y: parseFloat(baseAccelY.toFixed(3)),
        acceleration_z: parseFloat(baseAccelZ.toFixed(3)),
        gyroscope_x: parseFloat(gyroX.toFixed(3)),
        gyroscope_y: parseFloat(gyroY.toFixed(3)),
        gyroscope_z: parseFloat(gyroZ.toFixed(3)),
        g_force: parseFloat(gForce.toFixed(3)),
        timestamp: Date.now(),
      });
    }, 500);
  }

  // Simulate an impact event for testing
  simulateImpact(severity: 'low' | 'medium' | 'high' | 'critical'): TelemetryData {
    const forces = { low: 3, medium: 7.5, high: 12.5, critical: 20 };
    const gTarget = forces[severity] + (Math.random() - 0.5) * 2;
    const data: TelemetryData = {
      acceleration_x: parseFloat(((Math.random() - 0.5) * gTarget * 9.8).toFixed(3)),
      acceleration_y: parseFloat(((Math.random() - 0.5) * gTarget * 9.8).toFixed(3)),
      acceleration_z: parseFloat((gTarget * 9.8 * (0.5 + Math.random() * 0.5)).toFixed(3)),
      gyroscope_x: parseFloat(((Math.random() - 0.5) * 500).toFixed(3)),
      gyroscope_y: parseFloat(((Math.random() - 0.5) * 500).toFixed(3)),
      gyroscope_z: parseFloat(((Math.random() - 0.5) * 500).toFixed(3)),
      g_force: parseFloat(gTarget.toFixed(3)),
      timestamp: Date.now(),
    };
    this.emit(data);
    return data;
  }

  // Parse raw Arduino data string: "AX:0.12,AY:-0.34,AZ:9.81,GX:1.2,GY:-0.5,GZ:0.8,GF:1.02"
  parseArduinoData(raw: string): TelemetryData | null {
    try {
      const parts: Record<string, number> = {};
      raw.split(',').forEach(pair => {
        const [key, val] = pair.split(':');
        parts[key.trim()] = parseFloat(val);
      });
      return {
        acceleration_x: parts['AX'] || 0,
        acceleration_y: parts['AY'] || 0,
        acceleration_z: parts['AZ'] || 0,
        gyroscope_x: parts['GX'] || 0,
        gyroscope_y: parts['GY'] || 0,
        gyroscope_z: parts['GZ'] || 0,
        g_force: parts['GF'] || 0,
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }
}

export const bluetoothService = new BluetoothService();
