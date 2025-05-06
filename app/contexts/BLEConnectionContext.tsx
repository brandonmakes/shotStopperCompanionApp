import React, { createContext, useContext, RefObject } from 'react';
import { ScaleStatus, useBLEConnection } from '../hooks/useBLEConnection';
import { BleState } from 'react-native-ble-manager';

interface BLEConnectionState {
    deviceId: RefObject<string | null>;
    isConnecting: RefObject<boolean>;
    isConnected: boolean;
    isScanning: boolean;
    isLoading: boolean;
    bluetoothState: BleState;
    error: string | null;
    connectToDevice: () => Promise<void>;
    bleLoading: boolean;
    updateAutoTare: (value: boolean) => Promise<void>;
    readAutoTare: () => Promise<boolean>;
    autoTare: boolean;
    updateEnabled: (value: boolean) => Promise<void>;
    readEnabled: () => Promise<boolean>;
    enabled: boolean;
    updateWeightValue: (value: number) => Promise<void>;
    readWeightValue: () => Promise<number>;
    weightValue: number;
    updateMomentary: (value: boolean) => Promise<void>;
    readMomentary: () => Promise<boolean>;
    momentary: boolean;
    updateReedSwitch: (value: boolean) => Promise<void>;
    readReedSwitch: () => Promise<boolean>;
    reedSwitch: boolean;
    updateMinShotDuration: (value: number) => Promise<void>;
    readMinShotDuration: () => Promise<number>;
    minShotDuration: number;
    updateMaxShotDuration: (value: number) => Promise<void>;
    readMaxShotDuration: () => Promise<number>;
    maxShotDuration: number;
    updateDripDelay: (value: number) => Promise<void>;
    readDripDelay: () => Promise<number>;
    dripDelay: number;
    resetToDefaults: () => Promise<void>;
    readAllSettings: () => Promise<void>;
    scaleStatus: ScaleStatus;
    firmwareVersion: number;
    isDemoMode: RefObject<boolean>;
    demoConnectToDevice: () => Promise<void>;
    shotStatus: boolean;
    updateOtaModeRequested: (value: boolean) => Promise<void>;
    otaModeRequested: boolean;
    wifiSsid: string;
    wifiIp: string;
    updateWifiSsid: (value: string) => Promise<void>;
    readWifiSsid: () => Promise<string>;
    updateWifiPassword: (value: string) => Promise<void>;
    updateWifiIp: (value: string) => Promise<void>;
    readWifiIp: () => Promise<string>;
}

const BLEConnectionContext = createContext<BLEConnectionState | null>(null);

export function BLEConnectionProvider({ children }: { children: React.ReactNode }) {
    const bleConnection = useBLEConnection();

    return (
        <BLEConnectionContext.Provider value={bleConnection}>
            {children}
        </BLEConnectionContext.Provider>
    );
}

export function useBLEConnectionContext() {
    const context = useContext(BLEConnectionContext);
    if (!context) {
        throw new Error('useBLEConnectionContext must be used within a BLEConnectionProvider');
    }
    return context;
} 