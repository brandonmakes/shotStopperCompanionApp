// simple component to display the ota wizard
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, PermissionsAndroid, Platform, Keyboard, Button, ActivityIndicator, Dimensions } from "react-native";
import NetInfo from '@react-native-community/netinfo';
import BottomSheet, { BottomSheetBackdrop, BottomSheetFooter, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomSheetDefaultFooterProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetFooter/types';
import { useBLEConnectionContext } from '../contexts/BLEConnectionContext';
import { NetworkInfo } from 'react-native-network-info';
import { Link } from 'expo-router';
import { useThemeContext } from '../hooks/useThemeContext';
import Feather from '@expo/vector-icons/build/Feather';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import * as SecureStore from 'expo-secure-store';

const sanitizeSecureStoreKey = (key: string) => {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Key must be a non-empty string');
    }
  
    // Replace any character not A-Z, a-z, 0-9, ".", "-", or "_" with "_"
    return key.replace(/[^a-zA-Z0-9._-]/g, '_');
  };

const WifiInfo: React.FC<{setWifiSsid: (ssid: string) => void}> = ({setWifiSsid}) => {
    const [ssid, setSsid] = useState<string | null>(null);
    const { theme } = useThemeContext();
    const colors = theme.colors;

    useEffect(() => {
        if (Platform.OS === 'ios') {
            Location.requestForegroundPermissionsAsync().then(status => {
                if (status.status !== 'granted' && !status.canAskAgain) {
                alert("Please enable location services to use this feature");
                }
            });
        }
        // Fetch the SSID
        NetworkInfo.getSSID().then(ssid => {
            setSsid(ssid);
            if (ssid) {
                setWifiSsid(ssid);
            }
        });
    }, [setWifiSsid]);

    return (
        <View style={styles.limitedHeight}>
            {ssid ? (
                <Text style={[styles.paragraph, { color: colors.text }]}>
                    Your shotStopper will be setup to connect to the WiFi network: <Text style={{ fontWeight: 'bold' }}>{ssid}</Text>
                </Text>
            ) : (
                <Text style={[styles.paragraph, { color: colors.text }]}>Please connect to a WiFi network. Your shotStopper will be setup to connect to the same network.</Text>
            )}
        </View>
    );
};

const WifiPassword: React.FC<{ssid: string, password: string, setWifiPassword: (password: string) => void}> = ({ssid, password, setWifiPassword}) => {
    const { theme } = useThemeContext();
    const colors = theme.colors;
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handlePasswordChange = (text: string) => {
        setWifiPassword(text);
        try {
            SecureStore.setItem(sanitizeSecureStoreKey(`shotStopper-${ssid}`), text);
        } catch (error) {
            console.error('Error setting password in SecureStore', error);
        }
    }

    return (
        <View style={styles.centeredContainer}>
            <Text style={[styles.paragraph, { color: colors.text }]}>Enter WiFi Password for {ssid}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.card, flex: 1 }]}
                    placeholder="Password"
                    secureTextEntry={!isPasswordVisible}
                    maxLength={32}
                    textAlign="center"
                    onChangeText={handlePasswordChange}
                    value={password}
                />
                <TouchableOpacity style={{ position: 'absolute', right: 10, marginTop: 18 }} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <Feather name={isPasswordVisible ? 'eye-off' : 'eye'} size={20} color={colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const OtaEnabled: React.FC<{ssid: string | null, otaEnabled: boolean, wifiIp: string}> = ({ssid, otaEnabled, wifiIp}) => {
    const { theme } = useThemeContext();
    const colors = theme.colors;
    return (
        <BottomSheetView style={styles.limitedHeight}>
            { !otaEnabled ? (
                <View>
                    <Text style={[styles.paragraph, { color: colors.text }]}>Waiting for the update mode to be enabled... {"\n"}</Text>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <View>
                <Text style={[styles.paragraph, { color: colors.text }]}>Click the link below to open the OTA page or use the WiFi IP address to connect to the shotStopper. {"\n"}</Text>
                <Text style={[styles.paragraph, { color: colors.text }]}>SSID: {ssid} - WiFi IP: {wifiIp + "\n"}</Text>
                <Text style={[styles.paragraph, { color: colors.primary }]}>
                    <Link href={`http://${wifiIp}/`}>
                        <Text style={{ color: colors.primary }}>Open OTA Page </Text>
                        <Feather name="external-link" size={16} color={theme.colors.primary} />
                    </Link>
                </Text>
            </View>
            )}
            
        </BottomSheetView>
    );
};

export default function OTAWizard({ isVisible, onClose, disableClose = false }: { isVisible: boolean, onClose: () => void, disableClose?: boolean }) {
    const [currentView, setCurrentView] = useState('wifiInfo');
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const [wifiPassword, setWifiPassword] = useState<string>('');
    const [ssid, setSsid] = useState<string>('');
    const [otaEnabled, setOtaEnabled] = useState(false);
    const { theme } = useThemeContext();
    const colors = theme.colors;
    const {         
        otaModeRequested,
        updateOtaModeRequested,
        wifiIp,
        wifiSsid,
        updateWifiSsid,
        updateWifiPassword,
        readWifiIp,
    } = useBLEConnectionContext();

    const snapPoints = ['45%', '65%']

    const enableOta = () => {
        updateWifiSsid(ssid);
        updateWifiPassword(wifiPassword);
        updateOtaModeRequested(true);
    }

    const disableOta = () => {
        updateOtaModeRequested(false);
        setOtaEnabled(false);
    }

    useEffect(() => {
        if (otaModeRequested && wifiIp !== 'disconnected') {
            fetch("http://" + wifiIp + '/status').then((response) => {
                console.log(response);
                setOtaEnabled(true);
            });
        }
    }, [otaModeRequested, wifiIp]);

    useEffect(() => {
        try {
            const pass = SecureStore.getItem(sanitizeSecureStoreKey(`shotStopper-${ssid}`))
            if (pass) {
                setWifiPassword(pass);
            }
        } catch (error) {
            console.error('Error getting password from SecureStore', error);
        }
    }, [ssid]);

    useEffect(() => {
        let intervalId: any;

        if (otaModeRequested && wifiIp === 'disconnected') {
            intervalId = setInterval(() => {
                readWifiIp();
            }, 1000); // Run every second
        }

        // Clean up the interval when the component unmounts or conditions change
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [otaModeRequested, wifiIp, readWifiIp]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleNext = () => {
        if (currentView === 'wifiInfo') {
            setCurrentView('wifiPassword');
        } else if (currentView === 'wifiPassword') {
            enableOta();
            setCurrentView('otaEnabled');
        } else if (currentView === 'otaEnabled' && otaModeRequested) {
            disableOta();
            bottomSheetRef.current?.close();
            setCurrentView('wifiInfo');
        }
    };

    useEffect(() => {
        if (isVisible) {
            bottomSheetRef.current?.snapToIndex(0); // Open the bottom sheet
        } else {
            bottomSheetRef.current?.close(); // Close the bottom sheet
        }
    }, [isVisible]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            bottomSheetRef.current?.snapToIndex(1); // Expand the bottom sheet when the keyboard is shown
            setKeyboardOpen(true);
        });

        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            bottomSheetRef.current?.snapToIndex(0); // Snap back down when the keyboard is hidden
            setKeyboardOpen(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    useEffect(() => {
        if (otaModeRequested) {
            setCurrentView('otaEnabled');
        }
    }, [otaModeRequested]);

    const renderCurrentView = () => {
        switch (currentView) {
            case 'wifiInfo':
                return <WifiInfo setWifiSsid={setSsid} />;
            case 'wifiPassword':
                return <WifiPassword ssid={ssid} password={wifiPassword} setWifiPassword={setWifiPassword} />;
            case 'otaEnabled':
                return <OtaEnabled ssid={wifiSsid} otaEnabled={otaEnabled} wifiIp={wifiIp}/>;
            default:
                return <WifiInfo setWifiSsid={setSsid} />;
        }
    };

    const buttonText = () => {
        switch (currentView) {
            case 'wifiInfo':
                return "Next";
            case 'wifiPassword':
                return "Connect";
            case 'otaEnabled':
                return "Disable OTA Mode";
            default:
                return "Next";
        }
    };

    const renderFooter = React.useCallback(
        (        props: React.JSX.IntrinsicAttributes & BottomSheetDefaultFooterProps) => (
          <BottomSheetFooter {...props} bottomInset={24} style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.floatingButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
                    <Text style={styles.buttonText}>{ buttonText() }</Text>
                </TouchableOpacity>
          </BottomSheetFooter>
        ),
        [handleNext]
      );

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={isVisible ? 0 : -1} // Start with the bottom sheet closed
            snapPoints={snapPoints}
            enablePanDownToClose={!disableClose}
            onChange={(index) => {
                if (index === -1) {
                    if (currentView === 'wifiPassword') {
                        setCurrentView('wifiInfo');
                    }
                    onClose(); // Call onClose when the bottom sheet is closed
                }
            }}
            enableDynamicSizing={false}
            backgroundStyle={{
                backgroundColor: colors.background,
             }}
            handleIndicatorStyle={{ backgroundColor: colors.text }}
            footerComponent={renderFooter}
            style={Dimensions.get("screen").width > 640 ? {marginHorizontal: (Dimensions.get("screen").width - 640)/2} : {}}
            backdropComponent={props => (
                
                <BottomSheetBackdrop
                    {...props}
                    opacity={0.5}
                    enableTouchThrough={false}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                    style={[StyleSheet.absoluteFillObject]}
                >
                    <BlurView
                        intensity={100}
                        style={StyleSheet.absoluteFillObject}
                    />
                </BottomSheetBackdrop>
            )}
        >
            <BottomSheetView style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.title, { color: colors.text }]}>Over The Air Updates</Text>
                <BottomSheetView style={styles.content}>
                    {renderCurrentView()}
                </BottomSheetView>
            </BottomSheetView>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start', // Align items to the top
        alignItems: 'center', // Align items to the start (left)
        padding: 20,
    },
    title: {
        fontFamily: 'InstrumentSherif',
        fontSize: 32,
        // fontWeight: 'bold',
        marginBottom: 10, // Add some space between the title and the content
    },
    paragraph: {
        fontFamily: 'Inter',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'flex-start', // Align content to the top
        alignItems: 'center', // Align content to the start (left)
        width: '100%', // Ensure content takes full width
    },
    limitedHeight: {
        maxHeight: 200, // Limit the height of the component
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 20, // Add padding to ensure the button is not too close to the bottom
    },
    floatingButton: {
        padding: 15,
        width: '90%',
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        textAlign: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    wifiListContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'flex-start', // Center content vertically
        alignItems: 'center', // Center content horizontally
        width: '100%',
    },
    input: {
        marginTop: 28,
        marginBottom: 10,
        borderRadius: 10,
        fontSize: 24,
        lineHeight: 32,
        padding: 8,
        textAlign: 'center',
    },
});
