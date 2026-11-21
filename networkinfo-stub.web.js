// Stub for react-native-network-info on web
module.exports = {
  default: {
    getSSID: () => Promise.resolve('Demo WiFi'),
    getIPAddress: () => Promise.resolve('192.168.1.100'),
    getIPV4Address: () => Promise.resolve('192.168.1.100'),
    getBroadcast: () => Promise.resolve('192.168.1.255'),
    getGatewayIPAddress: () => Promise.resolve('192.168.1.1'),
    getSubnetMask: () => Promise.resolve('255.255.255.0'),
  },
};
