// Web-specific mock implementation of useBLEConnection
// BLE is not available on web, so this provides demo data

import { useState, useRef, useCallback } from 'react';

export enum ScaleStatus {
    DISCONNECTED = 0,
    CONNECTED = 1
}

// Mock BleState for web
export const BleState = {
    Unknown: 'unknown',
    Resetting: 'resetting',
    Unsupported: 'unsupported',
    Unauthorized: 'unauthorized',
    PoweredOff: 'off',
    PoweredOn: 'on',
    On: 'on',
    Off: 'off'
};

export const useBLEConnection = () => {
    const isConnecting = useRef(false);
    const isDemoMode = useRef(true);
    const deviceId = useRef<string | null>('demo-device');

    const [isLoading, setIsLoading] = useState(false);
    
    // Mock state with demo data
    const [state, setState] = useState({
        isConnected: true,
        isScanning: false,
        bluetoothState: BleState.On,
        error: null,
        connectionPhase: 'ready' as const,
    });

    const [settings, setSettings] = useState({
        enabled: true,
        autoTare: false,
        momentary: false,
        reedSwitch: false,
        minShotDuration: 0,
        maxShotDuration: 0,
        dripDelay: 0,
        weightValue: 36,
        scaleStatus: { weight: 18.4 } as any,
        firmwareVersion: 1,
        shotStatus: false,
        otaModeRequested: false,
        wifiSsid: '',
        wifiPassword: '',
        wifiIp: '',
    });

    const connectToDevice = useCallback(async () => {
        console.log('[Web Demo] Auto-connected');
        setState(prev => ({ ...prev, isConnected: true }));
    }, []);

    const demoConnectToDevice = useCallback(async () => {
        console.log('[Web Demo] Demo mode enabled');
        isDemoMode.current = true;
        setState(prev => ({ ...prev, isConnected: true }));
    }, []);

    const updateEnabled = useCallback(async (value: boolean) => {
        setSettings(prev => ({ ...prev, enabled: value }));
    }, []);

    const updateWeightValue = useCallback(async (value: number) => {
        setSettings(prev => ({ ...prev, weightValue: value }));
    }, []);

    const updateAutoTare = useCallback(async (value: boolean) => {
        setSettings(prev => ({ ...prev, autoTare: value }));
    }, []);

    const updateMomentary = useCallback(async (value: boolean) => {
        setSettings(prev => ({ ...prev, momentary: value }));
    }, []);

    const updateReedSwitch = useCallback(async (value: boolean) => {
        setSettings(prev => ({ ...prev, reedSwitch: value }));
    }, []);

    const updateMinShotDuration = useCallback(async (value: number) => {
        setSettings(prev => ({ ...prev, minShotDuration: value }));
    }, []);

    const updateMaxShotDuration = useCallback(async (value: number) => {
        setSettings(prev => ({ ...prev, maxShotDuration: value }));
    }, []);

    const updateDripDelay = useCallback(async (value: number) => {
        setSettings(prev => ({ ...prev, dripDelay: value }));
    }, []);

    const updateOtaModeRequested = useCallback(async (value: boolean) => {
        setSettings(prev => ({ ...prev, otaModeRequested: value }));
    }, []);

    const updateWifiSsid = useCallback(async (value: string) => {
        setSettings(prev => ({ ...prev, wifiSsid: value }));
    }, []);

    const updateWifiPassword = useCallback(async (value: string) => {
        setSettings(prev => ({ ...prev, wifiPassword: value }));
    }, []);

    const updateWifiIp = useCallback(async (value: string) => {
        setSettings(prev => ({ ...prev, wifiIp: value }));
    }, []);

    const readEnabled = useCallback(async () => settings.enabled, [settings.enabled]);
    const readAutoTare = useCallback(async () => settings.autoTare, [settings.autoTare]);
    const readMomentary = useCallback(async () => settings.momentary, [settings.momentary]);
    const readReedSwitch = useCallback(async () => settings.reedSwitch, [settings.reedSwitch]);
    const readMinShotDuration = useCallback(async () => settings.minShotDuration, [settings.minShotDuration]);
    const readMaxShotDuration = useCallback(async () => settings.maxShotDuration, [settings.maxShotDuration]);
    const readDripDelay = useCallback(async () => settings.dripDelay, [settings.dripDelay]);
    const readWeightValue = useCallback(async () => settings.weightValue, [settings.weightValue]);
    const readWifiSsid = useCallback(async () => settings.wifiSsid, [settings.wifiSsid]);
    const readWifiIp = useCallback(async () => settings.wifiIp, [settings.wifiIp]);

    const resetToDefaults = useCallback(async () => {
        console.log('[Web Demo] Reset to defaults');
    }, []);

    const readAllSettings = useCallback(async () => {
        console.log('[Web Demo] Read all settings');
    }, []);

    return {
        deviceId,
        isConnecting,
        isConnected: state.isConnected,
        isScanning: state.isScanning,
        isLoading,
        bluetoothState: state.bluetoothState,
        error: state.error,
        connectToDevice,
        bleLoading: isLoading,
        updateAutoTare,
        readAutoTare,
        autoTare: settings.autoTare,
        updateEnabled,
        readEnabled,
        enabled: settings.enabled,
        updateWeightValue,
        readWeightValue,
        weightValue: settings.weightValue,
        updateMomentary,
        readMomentary,
        momentary: settings.momentary,
        updateReedSwitch,
        readReedSwitch,
        reedSwitch: settings.reedSwitch,
        updateMinShotDuration,
        readMinShotDuration,
        minShotDuration: settings.minShotDuration,
        updateMaxShotDuration,
        readMaxShotDuration,
        maxShotDuration: settings.maxShotDuration,
        updateDripDelay,
        readDripDelay,
        dripDelay: settings.dripDelay,
        resetToDefaults,
        readAllSettings,
        scaleStatus: settings.scaleStatus,
        firmwareVersion: settings.firmwareVersion,
        isDemoMode,
        demoConnectToDevice,
        shotStatus: settings.shotStatus,
        updateOtaModeRequested,
        otaModeRequested: settings.otaModeRequested,
        wifiSsid: settings.wifiSsid,
        wifiIp: settings.wifiIp,
        updateWifiSsid,
        readWifiSsid,
        updateWifiPassword,
        updateWifiIp,
        readWifiIp,
    };
};
