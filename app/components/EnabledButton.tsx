import * as React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { View as MView, Text as MText, AnimatePresence } from 'moti';
import { useBLEConnectionContext } from '../contexts/BLEConnectionContext';
import { useThemeContext } from '../hooks/useThemeContext';
import AnimatedDots from './AnimatedDots';

const _buttonHeight = 60;

const BrewingAnimation = ({ shotStatus }: { shotStatus: boolean }) => {
    const { theme } = useThemeContext();
    const colors = theme.colors;

    return (
        <View style={styles.container}>
            <MText style={[styles.text, { color: colors.white }]}>Brewing</MText>
            { shotStatus && <AnimatedDots enabled={true} /> }
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        fontWeight: '700',
        fontSize: 18,
        letterSpacing: -0.5,
        textTransform: 'uppercase',
        marginHorizontal: 1,
    },
    text: {
        fontWeight: '700',
        fontSize: 18,
        letterSpacing: -0.5,
        textTransform: 'uppercase',
        fontFamily: "InterMedium",
    },
    button: {
        height: _buttonHeight,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
});

export default function EnabledButton() {
    const { enabled, updateEnabled, firmwareVersion, shotStatus } = useBLEConnectionContext();
    const { theme } = useThemeContext();
    const colors = theme.colors;

    const backgroundColorAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(backgroundColorAnim, {
            toValue: shotStatus ? 1 : 0,
            duration: 300,
            useNativeDriver: false, // Color interpolation doesn't support native driver
        }).start();
    }, [shotStatus, backgroundColorAnim]);

    const backgroundColor = backgroundColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', colors.primary],
    });

    if (firmwareVersion < 2) {
        return null;
    }

    return (
        <TouchableOpacity onPress={() => updateEnabled(!enabled)} style={{ margin: 20 }}>
            <Animated.View style={[
                styles.button, 
                { 
                    borderColor: colors.altBackground,
                    borderWidth: 1, 
                    borderRadius: 10,
                    backgroundColor
                }
            ]}>
                <AnimatePresence>
                    {!enabled && (
                        <MView
                            key='bg-enabled'
                            from={{ translateY: -_buttonHeight }}
                            animate={{ translateY: 0 }}
                            exit={{ translateY: -_buttonHeight }}
                            transition={{ delay: 200, type: 'timing' }}
                            style={[
                                StyleSheet.absoluteFillObject,
                                {
                                    backgroundColor: colors.card,
                                },
                            ]}
                        />
                    )}
                </AnimatePresence>
                <View style={{ overflow: 'hidden' }}>
                    <AnimatePresence exitBeforeEnter>
                        {enabled ? (
                            <MText
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                exit={{ opacity: 0, translateY: 20 }}
                                transition={{ type: 'timing', duration: 350 }}
                                key='text-enabled'
                                style={[styles.text, { color: colors.primary }]}
                            >
                                {shotStatus ? <BrewingAnimation shotStatus={shotStatus} /> : "Enabled"}
                            </MText>
                        ) : (
                            <MText
                                from={{ opacity: 0, translateY: -20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                exit={{ opacity: 0, translateY: -20 }}
                                transition={{ type: 'timing', duration: 350 }}
                                key='text-disabled'
                                style={[styles.text, { color: colors.text }]}
                            >
                                Disabled
                            </MText>
                        )}
                    </AnimatePresence>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
}