import * as React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useThemeContext } from '../hooks/useThemeContext';
import { opacity } from 'react-native-reanimated/lib/typescript/Colors';


export default function AnimatedDots({ enabled }: { enabled: boolean }) {
    const dot1Opacity = React.useRef(new Animated.Value(0)).current;
    const dot2Opacity = React.useRef(new Animated.Value(0)).current;
    const dot3Opacity = React.useRef(new Animated.Value(0)).current;
    const { theme } = useThemeContext();
    const colors = theme.colors;

    console.log('AnimatedDots enabled:', enabled);

    React.useEffect(() => {
        if (enabled) {
            const animateDots = () => {
                Animated.sequence([
                    Animated.timing(dot1Opacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot2Opacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot3Opacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot1Opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot2Opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot3Opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => animateDots());
            };

            animateDots();
        } else {
            dot1Opacity.setValue(0);
            dot2Opacity.setValue(0);
            dot3Opacity.setValue(0);
        }
    }, [enabled, dot1Opacity, dot2Opacity, dot3Opacity]);

    return (
        <View style={[styles.container]}>
            <Animated.Text style={[styles.dot, { opacity: dot1Opacity, color: colors.white }]}>.</Animated.Text>
            <Animated.Text style={[styles.dot, { opacity: dot2Opacity, color: colors.white }]}>.</Animated.Text>
            <Animated.Text style={[styles.dot, { opacity: dot3Opacity, color: colors.white }]}>.</Animated.Text>
        </View>
    )
}

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
})