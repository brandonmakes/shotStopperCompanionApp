import * as React from "react";
import {
  Animated,
  ActivityIndicator,
  Dimensions,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import {SafeAreaView} from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useThemeContext } from "./hooks/useThemeContext";
import { useBLEConnectionContext } from './contexts/BLEConnectionContext';
import DemoMode from "./components/DemoMode";
import EnabledButton from "./components/EnabledButton";
import ScaleStatusBox from "./components/ScaleStatusBox";
import OTAWizard from "./settings/otaWizard";
import MemorySelector from "./components/MemorySelector";
import { useFocusEffect as useFocusEffectNavigation, useNavigationState } from '@react-navigation/native';
const { width, height } = Dimensions.get("screen");
const color = {
  black: "#111110",
};

const start = 1;
const weights = [...Array(99).keys()].map((i) => (i === 0 ? start : i + start));
const ITEM_SIZE = width * 0.38;
const ITEM_SPACING = (width - ITEM_SIZE) / 2;

export default function App() {
  const { theme } = useThemeContext();
  const colors = theme.colors;
  const router = useRouter();
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const animatedLoadingValue = React.useState(new Animated.Value(0))[0];
  const lastVibrationIndex = React.useRef(0);
  const flatList = React.createRef<FlatList<number>>();
  const navigation = useNavigation();

  const state = useNavigationState(state => state);
  console.log('Navigation state:', state);
  
  const { 
    isConnected, 
    isLoading: bleLoading,
    weightValue: goalWeight,
    updateWeightValue,
    otaModeRequested,
    firmwareVersion,
    enabled,
  } = useBLEConnectionContext();

  const scrollX = React.useRef(new Animated.Value((goalWeight - start) * ITEM_SIZE)).current;

  console.log('Index View');


  React.useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null, // Hide the back button in the header (optional)
      gestureEnabled: false, // Disable swipe-to-go-back gesture (optional)
    });
  }, [navigation]);

  React.useEffect(() => {
    const listener = scrollX.addListener(({ value }) => {
      const currentIndex = Math.floor(value / ITEM_SIZE);
      if (currentIndex !== lastVibrationIndex.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        lastVibrationIndex.current = currentIndex; // Update last triggered index
      }
    });

    return () => {
      scrollX.removeListener(listener);
    };
  }, [scrollX]);


  React.useEffect(() => {
    const offset = (goalWeight - start) * ITEM_SIZE;

    scrollX.setValue(offset); // Manually update scrollX
  }, [goalWeight]);


  const handleOnPressNavigation = (item: number) => {
    return (event: any) => {
      if(item !== goalWeight) {
        flatList?.current?.scrollToIndex({
          index: item - start,
          animated: true,
        });
      }
    }
  }

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

    React.useEffect(() => {
    if (bleLoading) {
      Animated.timing(animatedLoadingValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animatedLoadingValue, {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [animatedLoadingValue, bleLoading]);

  const loadingOpacity = animatedLoadingValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const paddingTop = React.useCallback(() => {
    const screenRatio = width / height;
    if(screenRatio > 1) {
      return '0';
    }
    return (-0.5*screenRatio + 0.5)*100 + '%';
  }, [width, height]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ flex: 1 }}>
        <Animated.View style={{ opacity }}>
          <View style={[styles.topBar, styles.horizontal]}>
          <Text style={[styles.titleText, {color: colors.text}]}>shotStopper</Text>
          {bleLoading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
              <Animated.View style={{ opacity: loadingOpacity }}>
                <TouchableOpacity onPress={() => {
                    router.navigate({ pathname: "/settings" });
                  }}>
                  <Feather name="sliders" style={{paddingTop: 10}} size={24} color={colors.text}/>
                </TouchableOpacity>
            </Animated.View>
          )}
          </View>
        </Animated.View>
        <View style={{ flex: 1, paddingTop: paddingTop() }}>
          <Animated.FlatList
            ref={flatList}
            showsHorizontalScrollIndicator={false}
            data={weights}
            keyExtractor={(item) => item.toString()}
            initialScrollIndex={goalWeight - start}
            maxToRenderPerBatch={10}
            windowSize={5}
            horizontal
            getItemLayout={(data, index) => ({
              length: ITEM_SIZE, // Adjust based on item width
              offset: ITEM_SIZE * index, // Width * index
              index,
            })}
            snapToInterval={ITEM_SIZE}
            decelerationRate='fast'
            contentContainerStyle={{ paddingHorizontal: ITEM_SPACING }}
            style={{ flexGrow: 0, opacity }}
            onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const value = weights[Math.round(offsetX / ITEM_SIZE)];
              if (isConnected) {
                updateWeightValue(value)
              }
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            bounces={true}
            renderItem={({ item, index }) => {
              const inputRange = [
                (index - 1) * ITEM_SIZE,
                index * ITEM_SIZE,
                (index + 1) * ITEM_SIZE,
              ];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.5, 1, 0.5],
                extrapolate: "clamp",
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: "clamp",
              });
              return (
                <View style={{ width: ITEM_SIZE }}>
                  <Animated.Text
                    onPress={handleOnPressNavigation(item)}
                    style={[
                      styles.text,
                      {
                        textAlign: "center",
                        opacity,
                        color: enabled ? colors.primary : colors.text,
                        transform: [
                          {
                            perspective: ITEM_SIZE * 4,
                          },
                          {
                            scale,
                          },
                        ],
                      },
                    ]}>
                    {item}
                    <Text style={{fontSize: ITEM_SIZE * 0.3}}>g</Text>
                  </Animated.Text>
                </View>
              );
            }}
          />
        </View>
        <MemorySelector onMemorySelected={(value) => {
          flatList?.current?.scrollToIndex({
            index: value - start,
            animated: true,
          });
        }}/>
        { firmwareVersion > 0 && (
          <Animated.View style={[{ opacity, bottom: 20, width: '100%', marginTop: 10, maxWidth: 480, alignSelf: 'center' } ]}>
            <ScaleStatusBox />
            <EnabledButton />
          </Animated.View>
        )}
        <DemoMode />
        <OTAWizard isVisible={otaModeRequested} onClose={() => {}} disableClose={true} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    justifyContent: 'flex-start',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    top: 0,
    marginRight: 20,
  },
  left: {
    justifyContent: 'flex-start',
  },
  roundButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
    borderRadius: 80,
    backgroundColor: color.black,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  text: {
    fontSize: ITEM_SIZE * 0.65,
    fontFamily: "MenloBold",
  },
  scaleStatus: {
    flex: 1,
    flexDirection: 'row',
    textAlign: "center",
    justifyContent: 'flex-end',
    padding: 10,
  },
  smallText: {
    fontSize: 16,
    fontFamily: "MenloRegular",
    fontWeight: "400",
  },
  titleText: {
    fontSize: 32,
    fontFamily: "InstrumentSherif",
    fontWeight: "400",
  }
});
