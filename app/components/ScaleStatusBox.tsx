import * as React from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { useBLEConnectionContext } from '../contexts/BLEConnectionContext';
import { useThemeContext } from '../hooks/useThemeContext';
import Feather from '@expo/vector-icons/build/Feather';
import { ScaleStatus } from '../hooks/useBLEConnection';
import AnimatedDots from './AnimatedDots';

export default function ScaleStatusBox() {
    const { scaleStatus, enabled } = useBLEConnectionContext();
    const { theme } = useThemeContext();
    const colors = theme.colors;

    const displayText = (scaleStatus: ScaleStatus, enabled: boolean) => {
        if (enabled) {
          if (scaleStatus === ScaleStatus.CONNECTED) {
            return "Scale connected";
          } else {
            return "Looking for scale";
          } 
        } else {
            return "Scale disconnected";
        }
    }

    return (
        <View style={[styles.container, { borderColor: colors.altBackground, backgroundColor: enabled ? colors.background : colors.card }]}>
            <View style={[styles.scaleStatus, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginLeft: 20 }]}>
              <Feather name={scaleStatus === ScaleStatus.CONNECTED ? "activity" : "wifi-off"} style={{ padding: 1, paddingRight: 20 }} size={24} color={ scaleStatus === ScaleStatus.CONNECTED ? colors.primary : colors.text }/>
              <Animated.Text style={[styles.text, { color: scaleStatus === ScaleStatus.CONNECTED ? colors.primary : colors.text }]}>
                  { displayText(scaleStatus, enabled) }
              </Animated.Text>
              { scaleStatus === ScaleStatus.DISCONNECTED && enabled && <AnimatedDots enabled={true} /> }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 60,
        borderWidth: 1,
        borderRadius: 10,
        marginLeft: 20,
        marginRight: 20,
    },
    scaleStatus: {
      flex: 1,
      flexDirection: 'row',
      textAlign: "center",
      justifyContent: 'center',
      padding: 10,
    },
    smallText: {
      fontSize: 16,
      fontFamily: "InterLight",
      fontWeight: "400",
    },
    text: {
      fontWeight: '700',
      fontSize: 18,
      letterSpacing: -0.5,
      textTransform: 'uppercase',
      fontFamily: "InterMedium",
    },
  });
  