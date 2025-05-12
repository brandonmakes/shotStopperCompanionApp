import { useState, useEffect, useRef, useCallback } from 'react';
import BleManager, { BleScanCallbackType, BleScanMatchMode, BleScanMode, BleState, Peripheral } from 'react-native-ble-manager';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { request, PERMISSIONS, RESULTS, requestMultiple } from 'react-native-permissions';

interface BLEConnectionState {
    isConnected: boolean;
    isScanning: boolean;
    error: string | null;
    bluetoothState: BleState;
}

export enum ScaleStatus {
    DISCONNECTED = 0,
    CONNECTED = 1
}

export const scanDuration = 5;

const serviceUUIDs = ['00000000-0000-0000-0000-000000000ffe', '00002a98-0000-1000-8000-00805f9b34fb'];

const currentConfig = {
    deviceId: '',
    serviceUUID: '00000000-0000-0000-0000-000000000ffe',
    characteristics: {
        ENABLED: '00000000-0000-0000-0000-00000000FF10',
        WEIGHT_VALUE: '00000000-0000-0000-0000-00000000FF11',
        REED_SWITCH: '00000000-0000-0000-0000-00000000FF12',
        MOMENTARY: '00000000-0000-0000-0000-00000000FF13',
        AUTO_TARE: '00000000-0000-0000-0000-00000000FF14',
        MIN_SHOT_DURATION: '00000000-0000-0000-0000-00000000FF15',
        MAX_SHOT_DURATION: '00000000-0000-0000-0000-00000000FF16',
        DRIP_DELAY: '00000000-0000-0000-0000-00000000FF17',
        FIRMWARE_VERSION: '00000000-0000-0000-0000-00000000FF18',
        SCALE_STATUS: '00000000-0000-0000-0000-00000000FF19',
        SHOT_STATUS: '00000000-0000-0000-0000-00000000FF20',
        OTA_MODE_REQUESTED: '00000000-0000-0000-0000-00000000FF21',
        WIFI_SSID: '00000000-0000-0000-0000-00000000FF22',
        WIFI_PASSWORD: '00000000-0000-0000-0000-00000000FF23',
        WIFI_IP: '00000000-0000-0000-0000-00000000FF24',
    }
}

const legacyConfig = {
    deviceId: '',
    serviceUUID: '00002a98-0000-1000-8000-00805f9b34fb',
    characteristics: {
        WEIGHT_VALUE: '00000000-0000-0000-0000-000000002a98',
        FIRMWARE_VERSION: '00000000-0000-0000-0000-00000000FF18',
    }
}

interface DeviceSettings {
    enabled: boolean;
    autoTare: boolean;
    momentary: boolean;
    reedSwitch: boolean;
    minShotDuration: number;
    maxShotDuration: number;
    dripDelay: number;
    weightValue: number;
    scaleStatus: ScaleStatus;
    firmwareVersion: number;
    shotStatus: boolean;
    otaModeRequested: boolean;
    wifiSsid: string;
    wifiPassword: string;
    wifiIp: string;
}

const requestBlePermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
        const bluetoothStatus = await request(PERMISSIONS.IOS.BLUETOOTH);
        console.log("bluetoothStatus", bluetoothStatus)
        return bluetoothStatus === RESULTS.GRANTED;
    } else if (Platform.OS === 'android') {
        // For Android 12+ (SDK 31+)
        if (Platform.Version >= 31) {
            const results = await requestMultiple([
                PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            ]);
            return Object.values(results).every(result => result === RESULTS.GRANTED);
        } else {
            // For older Android versions, request legacy permissions
            const results = await requestMultiple([
                PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            ]);
            return Object.values(results).every(result => result === RESULTS.GRANTED);
        }
    }
    return false;
};

const getConfig = (serviceUUID: string, deviceId: string) => {
    const config = serviceUUID === currentConfig.serviceUUID ? currentConfig : legacyConfig;
    config.deviceId = deviceId;
    return config;
}

export const useBLEConnection = () => {

    const isConnecting = useRef(false);
    const config = useRef<any>(currentConfig);
    const isDemoMode = useRef(false);

    const [state, setState] = useState<BLEConnectionState>({
        isConnected: false,
        isScanning: false,
        bluetoothState: BleState.On,
        error: null
    });

    const [settings, setSettings] = useState<DeviceSettings>({
        enabled: true,
        autoTare: false,
        momentary: false,
        reedSwitch: false,
        minShotDuration: 0,
        maxShotDuration: 0,
        dripDelay: 0,
        weightValue: 36,
        scaleStatus: ScaleStatus.DISCONNECTED,
        firmwareVersion: 0,
        shotStatus: false,
        otaModeRequested: false,
        wifiSsid: '',
        wifiPassword: '',
        wifiIp: '',
    });

    const [isLoading, setIsLoading] = useState(false);

    const delay = (ms: number): Promise<void> => 
        new Promise(resolve => setTimeout(resolve, ms));

    const demoConnectToDevice = async () => {
        isDemoMode.current = true;
        isConnecting.current = true;
        setState(prev => ({ ...prev, error: null, isScanning: true }));
        await delay(3000);
        config.current = legacyConfig;
        config.current.deviceId = 'demo';
        setState(prev => ({ ...prev, isScanning: false, isConnected: true }));
        setSettings(prev => ({ ...prev, firmwareVersion: 1 }));
        isConnecting.current = false;
    }

    const connectToDevice = async () => {
        if (isDemoMode.current) {
            await demoConnectToDevice();
            return;
        }

        if (isConnecting.current) {
            console.log('Already scanning, skipping...');
            return;
        }

        if (AppState.currentState !== 'active') {
            console.log("App is not active, skipping...")
            return;
        }
        const hasPermission = await requestBlePermissions();
        if (!hasPermission) {
            setState(prev => ({ 
                ...prev, 
                error: 'Bluetooth permissions not granted', 
                isScanning: false 
            }));
            return;
        }
        try {
            isConnecting.current = true;
            console.log('Initializing BLE scan...');

            setState(prev => ({ ...prev, error: null, isScanning: true }));

            const bleState = await BleManager.checkState();
            
            if (bleState !== 'on') {
                setState(prev => ({ ...prev, error: 'Bluetooth is not enabled', isScanning: false, bluetoothState: bleState }));
                return;
            }

            // Check for existing connections
            const connectedPeripherals = await BleManager.getConnectedPeripherals([]);
            console.log("connectedPeripherals", JSON.stringify(connectedPeripherals))
            if (connectedPeripherals.length === 1) {
                console.log("Established connection to previously connected device", connectedPeripherals[0])
                await commonConnectionFlow(connectedPeripherals[0], { isConnected: true, isScanning: false, error: null, bluetoothState: bleState });
            } else {
                await BleManager.scan(serviceUUIDs, scanDuration, false, {
                    matchMode: BleScanMatchMode.Aggressive,
                    scanMode: BleScanMode.LowLatency,
                    callbackType: BleScanCallbackType.FirstMatch,
                });
            }

        } catch (error) {
            console.error('Scan error:', error);
            config.current = null;
            setState(prev => ({
                ...prev,
                error: 'Failed to scan for devices',
                isScanning: false,
                isConnected: false,
            }));
            setIsLoading(false);
        } finally {
            isConnecting.current = false;
        }
    };

    const disconnectFromDevice = async () => {
        if (config.current) {
            await BleManager.disconnect(config.current.deviceId);
            config.current = null;
        }
        setState(prev => ({
            ...prev,
            isConnected: false,
            isScanning: true,
        }));
    };

    const commonConnectionFlow = async (peripheral: Peripheral, state?: any) => {
        const startTime = new Date();
        const serviceUUID = peripheral.advertising?.serviceUUIDs?.[0] ?? currentConfig.serviceUUID;
        config.current = getConfig(serviceUUID, peripheral.id);
        console.log("connecting", elapsedTime(startTime))
        await BleManager.connect(config.current.deviceId);
        console.log("connected", elapsedTime(startTime))
        if (Platform.OS === 'android') {
            await BleManager.requestConnectionPriority(config.current.deviceId, 1);
        }
        console.log("retrieving services", elapsedTime(startTime))
        await BleManager.retrieveServices(config.current.deviceId);
        console.log("retrieved services", elapsedTime(startTime))
        const firmwareVersion = await readFirmwareVersion();
        await listenForNotifications(firmwareVersion);
        await readAllSettings(firmwareVersion);
        if (state) {
            setState(prev => ({
                ...prev,
                ...state,
            }));
        }
        await readBackgroundSettings(firmwareVersion);
    }

    const elapsedTime = (startTime: Date) => {
        const now = new Date();
        return (now.getTime() - startTime.getTime()) / 1000;
    }

    useEffect(() => {

        const discoveredDevices = new Map();

        const onDiscoverListener = BleManager.onDiscoverPeripheral(async (peripheral: Peripheral) => {
            if (!discoveredDevices.has(peripheral.id)) {
                discoveredDevices.set(peripheral.id, peripheral);
                console.log('New device discovered:', peripheral);
                BleManager.stopScan();
              } else {
                console.log('Duplicate device ignored:', peripheral.id);
                return;
            }
            try {
                isConnecting.current = true;
                await commonConnectionFlow(peripheral, { isConnected: true, isScanning: false, error: null });
            } catch (error) {
                console.error('Connection error:', error);
            } finally {
                isConnecting.current = false;
                await BleManager.stopScan();
            }
        });

        const onDidUpdateStateListener = BleManager.onDidUpdateState((event: any) => {
            try {
                console.log('Bluetooth state:', event);
                if (state.bluetoothState !== event.state && (event.state === 'on' || event.state === 'off')) {
                    
                    const shouldDisconnect = state.bluetoothState === BleState.On && state.isConnected && event.state === 'off';
                    setState(prev => ({ ...prev, bluetoothState: event.state, isConnected: shouldDisconnect ? false : prev.isConnected }));
                    if (event.state === 'on') {
                        console.log('Auto-reconnecting...');
                        connectToDevice(); // Auto-reconnect
                    }
                }
            } catch (error) {
                console.error('Error updating Bluetooth state:', error);
            }
        });

        const onConnectListener = BleManager.onConnectPeripheral(async (args: any) => {
            console.log('Connected to:', args);
        });

        const onDisconnectListener = BleManager.onDisconnectPeripheral((event: any) => {
            console.log('Disconnected from:', event);
            setState(prev => ({
                ...prev,
                isConnected: false,
                isScanning: false,
            }));
        });

        const onStopScanListener = BleManager.onStopScan(() => {
            console.log("onStopScanListener")
            setState(prev => ({ ...prev, isScanning: false }));
        });

        const onScaleStatusListener = BleManager.onDidUpdateValueForCharacteristic(async (args: any) => {
            const characteristic = args["characteristic"].toLowerCase();
            if (characteristic === config.current.characteristics.SHOT_STATUS.toLowerCase()) {
                console.log("Notification: shotStatus -", args.value[0] === 1)
                setSettings(prev => ({ ...prev, shotStatus: args.value[0] === 1 }));
            }
            if (characteristic === config.current.characteristics.SCALE_STATUS.toLowerCase()) {
                console.log("Notification: scaleStatus -", args.value[0])
                setSettings(prev => ({ ...prev, scaleStatus: args.value[0] }));
            }
            if (characteristic === config.current.characteristics.WIFI_IP.toLowerCase()) {
                const wifiIpNotification = bytesToString(args.value);
                console.log("Notification: wifiIp -", wifiIpNotification)
                setSettings(prev => ({ ...prev, wifiIp: wifiIpNotification }));
            }
        });

        return () => {
            onDiscoverListener.remove();
            onConnectListener.remove();
            onDisconnectListener.remove();
            onStopScanListener.remove();
            onDidUpdateStateListener.remove();
            onScaleStatusListener.remove();
        };
    }, [config, state.isConnected, state.error, state.bluetoothState, connectToDevice]);

    useEffect(() => {
        const appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
            console.log("appStateSubscription", nextAppState)
            if (nextAppState === 'active') {
                isConnecting.current = false;
                await connectToDevice();
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                await disconnectFromDevice();
            }
        });

        return () => appStateSubscription.remove();
    }, []);

    function bytesToString(byteArray: any) {
        return String.fromCharCode.apply(null, byteArray);
    }

    function stringToBytes(str: string): number[] {
        const encoder = new TextEncoder();
        return Array.from(encoder.encode(str));
    }

    const readCharacteristic = useCallback(async (characteristic: string, retries = 3): Promise<any> => {
        if (!config.current) {
            throw new Error('Config is not set');
        }
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const data = await BleManager.read(
                    config.current.deviceId,
                    config.current.serviceUUID,
                    characteristic
                );
                console.log("read characteristic", characteristic, data)

                if (characteristic === config.current.characteristics.WIFI_SSID ||
                    characteristic === config.current.characteristics.WIFI_IP) {
                    return bytesToString(data);
                }
                
                if (characteristic === config.current.characteristics.AUTO_TARE ||
                    characteristic === config.current.characteristics.MOMENTARY ||
                    characteristic === config.current.characteristics.REED_SWITCH ||
                    characteristic === config.current.characteristics.ENABLED) {
                    return data[0] === 1;
                }

                return data[0];
            } catch (error) {
                console.error(`Read attempt ${attempt} failed:`, error);
                if (attempt === retries) {
                    throw error;
                }
                await delay(200);
            }
        }
    }, [config]);

    const writeCharacteristic = useCallback(async (characteristic: string, value: any): Promise<void> => {
        try {
            if (isDemoMode.current) {
                await delay(1000);
                return;
            }
            if (!config.current) {
                throw new Error('Config is not set');
            }
            let bytes;
            if (characteristic === config.current.characteristics.WIFI_SSID ||
                characteristic === config.current.characteristics.WIFI_PASSWORD) {
                // Convert string to byte array for WIFI_SSID
                bytes = stringToBytes(value);
            } else {
                // Handle other characteristics
                bytes = typeof value === 'boolean' ? [value ? 1 : 0] : [Math.max(0, Math.min(255, Math.floor(value)))];
            }

            const connectedPeripherals = await BleManager.getConnectedPeripherals([]);
            console.log("connectedPeripherals", connectedPeripherals)
            
            await BleManager.write(
                    config.current.deviceId,
                    config.current.serviceUUID,
                    characteristic,
                    bytes,
                    bytes.length
                );
            console.log("wrote characteristic", characteristic, value)
        } catch (error) {
            await disconnectFromDevice();
            throw error;
        }
    }, [isDemoMode, config]);

    const updateSetting = useCallback(async <K extends keyof DeviceSettings>(
        key: K,
        value: DeviceSettings[K],
        characteristic: string
    ): Promise<void> => {
        const previousValue = settings[key];
        try {
            setIsLoading(true);
            setSettings(prev => ({ ...prev, [key]: value }));
            await writeCharacteristic(characteristic, value);
        } catch (error) {
            setSettings(prev => ({ ...prev, [key]: previousValue }));
            await disconnectFromDevice();
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [settings, writeCharacteristic]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const listenForNotifications = async (firmwareVersion: number) => {
        console.log(":ALERT: listenForNotifications", firmwareVersion)
        if (!config.current) {
            throw new Error('Config is not set');
        }

        if (firmwareVersion === 0) {
            console.log(":ALERT: firmwareVersion 0, skipping notifications")
            return;
        }

        const characteristicsToNotify = [
            config.current.characteristics.SCALE_STATUS,
        ];

        if (firmwareVersion > 1) {
            console.log(":ALERT: adding wifi ip notification")
            characteristicsToNotify.push(
                config.current.characteristics.SHOT_STATUS,
                config.current.characteristics.WIFI_IP,
            );
        }

        for (const characteristic of characteristicsToNotify) {
            console.log(":ALERT: starting notification for", characteristic)
            await BleManager.startNotification(config.current.deviceId, config.current.serviceUUID, characteristic);
        }
    };

    const readBackgroundSettings = async (firmwareVersion: number) => {
        console.log("reading background settings")
        const promises: Promise<any>[] = [];
        let autoTare: boolean;
        let momentary: boolean;
        let reedSwitch: boolean;
        let minShotDuration: number;
        let maxShotDuration: number;
        let dripDelay: number;
        let wifiSsid: string;
        let wifiIp: string;

        if (firmwareVersion > 0) {
            promises.push(readAutoTare());
            promises.push(readMomentary());
            promises.push(readReedSwitch());
            promises.push(readMinShotDuration());
            promises.push(readMaxShotDuration());
            promises.push(readDripDelay());
        }

        if (firmwareVersion > 1) {
            promises.push(readWifiSsid());
            promises.push(readWifiIp());
        }

        console.log("firmwareVersion", firmwareVersion)
        switch (firmwareVersion) {
            case 0:
                console.log("firmwareVersion 0");
            case 1:
                console.log("firmwareVersion 1");
                [autoTare, momentary, reedSwitch, minShotDuration, maxShotDuration, dripDelay] = await Promise.all(promises);
                setSettings(prev => ({
                    ...prev,
                    autoTare,
                    momentary,
                    reedSwitch,
                    minShotDuration,
                    maxShotDuration,
                    dripDelay,
                }));
                break;
            case 2:
                console.log("firmwareVersion 2");
                [autoTare, momentary, reedSwitch, minShotDuration, maxShotDuration, dripDelay, wifiSsid, wifiIp] = await Promise.all(promises);
                setSettings(prev => ({
                    ...prev,
                    autoTare,
                    momentary,
                    reedSwitch,
                    minShotDuration,
                    maxShotDuration,
                    dripDelay,
                    wifiSsid,
                    wifiIp,
                }));
                break;
        }
    }


    const readAllSettings = async (currentFirmwareVersion: number) => {
        console.log("reading all settings")
        const promises: Promise<any>[] = [readWeightValue()];
        let weightValue: number;
        let scaleStatus: number;
        let enabled: boolean;
        let shotStatus: boolean;
        let otaModeRequested: boolean;

        if (currentFirmwareVersion > 0) {
            promises.push(readScaleStatus());
        }

        if (currentFirmwareVersion > 1) {
            promises.push(readEnabled());
            promises.push(readShotStatus());
            promises.push(readOtaModeRequested());
        }

        console.log("currentFirmwareVersion", currentFirmwareVersion)
        switch (currentFirmwareVersion) {
            case 0:
                console.log("firmwareVersion 0");
                [weightValue] = await Promise.all(promises);
                setSettings(prev => ({
                    ...prev,
                    weightValue,
                    firmwareVersion: currentFirmwareVersion,
                }));
                break;
            case 1:
                console.log("firmwareVersion 1");
                [weightValue, scaleStatus] = await Promise.all(promises);
                setSettings(prev => ({
                    ...prev,
                    firmwareVersion: currentFirmwareVersion,
                    weightValue,
                    scaleStatus,
                }));
                break;
            case 2:
                console.log("firmwareVersion 2");
                [weightValue, scaleStatus, enabled, shotStatus, otaModeRequested] = await Promise.all(promises);
                setSettings(prev => ({
                    ...prev,
                    firmwareVersion: currentFirmwareVersion,
                    weightValue,
                    scaleStatus,
                    enabled,
                    shotStatus,
                    otaModeRequested,
                }));
                break;
        }
        return currentFirmwareVersion;
    };

    // Export your update functions
    const updateAutoTare = useCallback((value: boolean) => 
        updateSetting('autoTare', value, config.current.characteristics.AUTO_TARE), []);

    const readAutoTare = useCallback(async (): Promise<boolean> => {
        console.log("reading autoTare", config.current.characteristics.AUTO_TARE)
        return Boolean(await readCharacteristic(config.current.characteristics.AUTO_TARE))
    }, [readCharacteristic]);

    const updateEnabled = useCallback((value: boolean) => 
        updateSetting('enabled', value, config.current.characteristics.ENABLED), [updateSetting]);

    const readEnabled = useCallback(async (): Promise<boolean> => {
        console.log("reading enabled", config.current.characteristics.ENABLED)
        return Boolean(await readCharacteristic(config.current.characteristics.ENABLED))
    }, [readCharacteristic]);

    const readShotStatus = useCallback(async (): Promise<boolean> => {
        console.log("reading shotStatus", config.current.characteristics.SHOT_STATUS)
        return Boolean(await readCharacteristic(config.current.characteristics.SHOT_STATUS))
    }, [readCharacteristic]);

    const updateWeightValue = useCallback((value: number) => {
        return updateSetting('weightValue', value, config.current.characteristics.WEIGHT_VALUE)
    }, [updateSetting]);

    const readWeightValue = useCallback(async (): Promise<number> => {
        console.log("reading weightValue", config.current.characteristics.WEIGHT_VALUE)
        const weightValue = await readCharacteristic(config.current.characteristics.WEIGHT_VALUE)
        console.log("weightValue", weightValue)
        return Number(weightValue)
    }, [readCharacteristic]);

    const updateMomentary = useCallback((value: boolean) => 
        updateSetting('momentary', value, config.current.characteristics.MOMENTARY), []);

    const readMomentary = useCallback(async (): Promise<boolean> => {
        console.log("reading momentary", config.current.characteristics.MOMENTARY)
        return Boolean(await readCharacteristic(config.current.characteristics.MOMENTARY))
    }, [readCharacteristic]);

    const updateReedSwitch = useCallback((value: boolean) => 
        updateSetting('reedSwitch', value, config.current.characteristics.REED_SWITCH), []);

    const readReedSwitch = useCallback(async (): Promise<boolean> => {
        console.log("reading reedSwitch", config.current.characteristics.REED_SWITCH)
        return Boolean(await readCharacteristic(config.current.characteristics.REED_SWITCH))
    }, [readCharacteristic]);

    const updateMinShotDuration = useCallback((value: number) => 
        updateSetting('minShotDuration', value, config.current.characteristics.MIN_SHOT_DURATION), []);

    const readMinShotDuration = useCallback(async (): Promise<number> => {
        console.log("reading minShotDuration", config.current.characteristics.MIN_SHOT_DURATION)
        return Number(await readCharacteristic(config.current.characteristics.MIN_SHOT_DURATION))
    }, [readCharacteristic]);

    const updateMaxShotDuration = useCallback((value: number) => 
        updateSetting('maxShotDuration', value, config.current.characteristics.MAX_SHOT_DURATION), []);

    const readMaxShotDuration = useCallback(async (): Promise<number> => {
        console.log("reading maxShotDuration", config.current.characteristics.MAX_SHOT_DURATION)
        return Number(await readCharacteristic(config.current.characteristics.MAX_SHOT_DURATION))
    }, [readCharacteristic]);

    const updateDripDelay = useCallback((value: number) => 
        updateSetting('dripDelay', value, config.current.characteristics.DRIP_DELAY), []);

    const readDripDelay = useCallback(async (): Promise<number> => {
        console.log("reading dripDelay", config.current.characteristics.DRIP_DELAY)
        return Number(await readCharacteristic(config.current.characteristics.DRIP_DELAY))
    }, [readCharacteristic]);

    const readFirmwareVersion = useCallback(async (): Promise<number> => {
        console.log("reading firmwareVersion", config.current.characteristics.FIRMWARE_VERSION)
        try {
            return Number(await readCharacteristic(config.current.characteristics.FIRMWARE_VERSION, 1))
        } catch (error) {
            console.error("error reading firmwareVersion", error)
            return 0;
        }
    }, [readCharacteristic]);

    const readScaleStatus = useCallback(async (): Promise<number> => {
        console.log("reading scaleStatus", config.current.characteristics.SCALE_STATUS)
        return Number(await readCharacteristic(config.current.characteristics.SCALE_STATUS, 1))
    }, [readCharacteristic]);

    const readOtaModeRequested = useCallback(async (): Promise<boolean> => {
        console.log("reading otaModeRequested", config.current.characteristics.OTA_MODE_REQUESTED)
        return Boolean(await readCharacteristic(config.current.characteristics.OTA_MODE_REQUESTED))
    }, [readCharacteristic]);

    const updateOtaModeRequested = useCallback((value: boolean) => 
        updateSetting('otaModeRequested', value, config.current.characteristics.OTA_MODE_REQUESTED), []);

    const updateWifiSsid = useCallback((value: string) => 
        updateSetting('wifiSsid', value, config.current.characteristics.WIFI_SSID), []);

    const readWifiSsid = useCallback(async (): Promise<string> => {
        console.log("reading wifiSsid", config.current.characteristics.WIFI_SSID)
        return await readCharacteristic(config.current.characteristics.WIFI_SSID)
    }, [readCharacteristic]);

    const updateWifiPassword = useCallback((value: string) => 
        updateSetting('wifiPassword', value, config.current.characteristics.WIFI_PASSWORD), []);

    const readWifiIp = useCallback(async (): Promise<string> => {
        console.log("reading wifiIp", config.current.characteristics.WIFI_IP)
        return await readCharacteristic(config.current.characteristics.WIFI_IP)
    }, [readCharacteristic]);

    const resetToDefaults = useCallback(async () => {
        await writeCharacteristic(config.current.characteristics.WEIGHT_VALUE, 36);
        await writeCharacteristic(config.current.characteristics.AUTO_TARE, true);
        await writeCharacteristic(config.current.characteristics.MOMENTARY, false);
        await writeCharacteristic(config.current.characteristics.REED_SWITCH, false);
        await writeCharacteristic(config.current.characteristics.MIN_SHOT_DURATION, 3);
        await writeCharacteristic(config.current.characteristics.MAX_SHOT_DURATION, 50);
        await writeCharacteristic(config.current.characteristics.DRIP_DELAY, 3);
        setSettings(prev => ({
            ...prev,
            autoTare: true,
            weightValue: 36,
            momentary: false,
            reedSwitch: false,
            minShotDuration: 3,
            maxShotDuration: 50,
            dripDelay: 3,
        }));
    }, []);

    return {
        ...state,
        ...settings,
        isLoading,
        isConnecting,
        connectToDevice,
        updateAutoTare,
        readAutoTare, 
        updateEnabled,
        readEnabled,
        updateWeightValue,
        readWeightValue,
        updateMomentary,
        readMomentary,
        updateReedSwitch,
        readReedSwitch,
        updateMinShotDuration,
        readMinShotDuration,
        updateMaxShotDuration,
        readMaxShotDuration,
        updateDripDelay,
        readDripDelay,
        readAllSettings,
        resetToDefaults,
        deviceId: config.current?.deviceId,
        isDemoMode,
        demoConnectToDevice,
        updateOtaModeRequested,
        updateWifiSsid,
        updateWifiPassword,
        readWifiIp,
    };
}; 