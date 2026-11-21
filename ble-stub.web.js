// Stub for react-native-ble-manager on web
module.exports = {
  default: {
    start: () => Promise.resolve(),
    scan: () => Promise.resolve(),
    stopScan: () => Promise.resolve(),
    connect: () => Promise.resolve(),
    disconnect: () => Promise.resolve(),
    retrieveServices: () => Promise.resolve(),
    read: () => Promise.resolve(),
    write: () => Promise.resolve(),
    writeWithoutResponse: () => Promise.resolve(),
    startNotification: () => Promise.resolve(),
    stopNotification: () => Promise.resolve(),
  },
  BleScanMatchMode: {},
  BleScanMode: {},
  BleState: {
    Unknown: 'unknown',
    Resetting: 'resetting',
    Unsupported: 'unsupported',
    Unauthorized: 'unauthorized',
    PoweredOff: 'off',
    PoweredOn: 'on',
    On: 'on',
    Off: 'off'
  },
};
