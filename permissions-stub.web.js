// Stub for react-native-permissions on web
module.exports = {
  request: () => Promise.resolve('granted'),
  requestMultiple: () => Promise.resolve({ granted: 'granted' }),
  check: () => Promise.resolve('granted'),
  PERMISSIONS: {
    IOS: { BLUETOOTH: 'bluetooth' },
    ANDROID: {
      BLUETOOTH_SCAN: 'bluetooth_scan',
      BLUETOOTH_CONNECT: 'bluetooth_connect',
      ACCESS_FINE_LOCATION: 'location',
    }
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    UNAVAILABLE: 'unavailable',
  },
};
