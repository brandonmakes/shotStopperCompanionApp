// Stub for react-native-network-info on web
const NetworkInfo = {
  getSSID: () => Promise.resolve('Demo WiFi'),
  getIPAddress: () => Promise.resolve('192.168.1.100'),
  getIPV4Address: () => Promise.resolve('192.168.1.100'),
  getBroadcast: () => Promise.resolve('192.168.1.255'),
  getGatewayIPAddress: () => Promise.resolve('192.168.1.1'),
  getSubnetMask: () => Promise.resolve('255.255.255.0'),
};

module.exports = {
  NetworkInfo,
  default: NetworkInfo,
};
