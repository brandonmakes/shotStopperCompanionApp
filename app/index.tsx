import * as React from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useThemeContext } from "./hooks/useThemeContext";
import { useBLEConnectionContext } from './contexts/BLEConnectionContext';

const { width, height } = Dimensions.get("screen");

const HERO_BACKGROUND = "#000000";

export default function App() {
  const { theme } = useThemeContext();
  const colors = theme.colors;
  const router = useRouter();
  
  const { 
    isConnected, 
    weightValue: goalWeight,
    updateWeightValue,
    enabled,
    updateEnabled,
    scaleStatus,
    shotStatus,
    bleLoading,
  } = useBLEConnectionContext();

  const [lastUpdateTime, setLastUpdateTime] = React.useState(new Date());

  React.useEffect(() => {
    if (scaleStatus?.weight !== undefined) {
      setLastUpdateTime(new Date());
    }
  }, [scaleStatus]);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getHeadlineNumber = () => {
    return `${goalWeight}g`;
  };

  const getSubheadline = () => {
    if (!isConnected) {
      return "Disconnected";
    }
    if (bleLoading) {
      return "Connecting...";
    }
    if (shotStatus) {
      return "Shot in progress";
    }
    if (scaleStatus?.weight !== undefined) {
      return `${scaleStatus.weight.toFixed(1)}g`;
    }
    return "Ready";
  };

  const getConnectionStatus = () => {
    if (!isConnected) return "Disconnected";
    if (bleLoading) return "Connecting";
    if (enabled) return "Active";
    return "Connected";
  };

  const handleToggleEnabled = async () => {
    if (!isConnected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateEnabled(!enabled);
  };

  const handleAdjustWeight = () => {
    if (!isConnected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Cycle through common weights: 18, 36, 40, 45
    const weights = [18, 36, 40, 45];
    const currentIndex = weights.indexOf(goalWeight);
    const nextWeight = weights[(currentIndex + 1) % weights.length];
    updateWeightValue(nextWeight);
  };

  const handleConnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Connection management
  };

  const handleSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.navigate({ pathname: "/settings" });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: HERO_BACKGROUND }]}>
      <View style={styles.content}>
        {/* Large typographic numbers at top left */}
        <View style={styles.headerSection}>
          <Text style={[styles.headlineNumber, { color: colors.white }]}>
            {getHeadlineNumber()}
          </Text>
          <Text style={[styles.subheadline, { 
            color: shotStatus ? colors.primary : 
                   !isConnected ? '#666' : colors.white,
            opacity: !isConnected ? 0.5 : 0.85 
          }]}>
            {getSubheadline()}
          </Text>
        </View>

        {/* Large hero espresso machine image */}
        <View style={styles.heroImageContainer}>
          <Image
            source={require('../assets/images/micra.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* Status row under the image */}
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: colors.white, opacity: 0.7 }]}>
            {getConnectionStatus()}
          </Text>
          <Text style={[styles.statusText, { color: colors.white, opacity: 0.5 }]}>
            Updated {formatTime(lastUpdateTime)}
          </Text>
        </View>

        {/* Quick action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { opacity: isConnected ? 1 : 0.4 }]}
            onPress={handleToggleEnabled}
            disabled={!isConnected}
            accessibilityLabel={enabled ? "Disable scale" : "Enable scale"}
            accessibilityHint="Toggles the scale on or off"
          >
            <Feather 
              name={enabled ? "zap" : "zap-off"} 
              size={24} 
              color={enabled ? colors.primary : colors.white} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { opacity: isConnected ? 1 : 0.4 }]}
            onPress={handleAdjustWeight}
            disabled={!isConnected}
            accessibilityLabel="Adjust weight preset"
            accessibilityHint="Cycles through common weight presets"
          >
            <Feather name="droplet" size={24} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSettings}
            accessibilityLabel="Settings"
            accessibilityHint="Opens settings screen"
          >
            <Feather name="settings" size={24} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { opacity: isConnected ? 1 : 0.4 }]}
            onPress={handleConnect}
            disabled={!isConnected}
            accessibilityLabel="Connection"
            accessibilityHint="Manage Bluetooth connection"
          >
            <Feather name="bluetooth" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Floating pill-shaped bottom navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navButton}
            accessibilityLabel="Home"
            accessibilityHint="Currently on home screen"
          >
            <Feather name="home" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => router.navigate({ pathname: "/settings" })}
            accessibilityLabel="Settings"
            accessibilityHint="Navigate to settings"
          >
            <Feather name="sliders" size={24} color={colors.white} opacity={0.5} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  headlineNumber: {
    fontSize: 96,
    fontFamily: "InterLight",
    fontWeight: "200",
    letterSpacing: -2,
    lineHeight: 96,
  },
  subheadline: {
    fontSize: 32,
    fontFamily: "InterLight",
    fontWeight: "300",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  heroImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  heroImage: {
    width: width * 0.85,
    height: width * 0.85,
    maxWidth: 500,
    maxHeight: 500,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: "InterRegular",
    letterSpacing: 0.2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 120,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -80 }],
    width: 160,
    height: 64,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
