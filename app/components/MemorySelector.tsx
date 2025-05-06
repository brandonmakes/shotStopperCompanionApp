import * as React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useThemeContext } from "../hooks/useThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBLEConnectionContext } from "../contexts/BLEConnectionContext";
import * as Haptics from 'expo-haptics';


interface ThemeBoxProps {
    mode: 'light' | 'dark' | 'auto';
    label: string;
    onClear: () => void;
    onSelect: () => void;
    index: number;
    memory: number | null;
  }
  
  const MemoryBox: React.FC<ThemeBoxProps> = ({ onClear, onSelect, index, memory }) => {
    const { theme } = useThemeContext();
    const colors = theme.colors;
    const { weightValue, enabled } = useBLEConnectionContext();
    
    const boxStyle = [
        styles.themeBox,
        memory === weightValue && { borderWidth: 2, borderColor: theme.colors.primary },
        { borderWidth: 1, borderColor: colors.card }
    ];

    const textColor = () => {
        if (enabled) {
            if (memory) {
                return colors.primary;
            } else {
                return colors.text;
            }
        } else {
            return colors.text;
        }
    }
    
    return (
        <TouchableOpacity style={styles.themeBoxContainer} onPress={onSelect} onLongPress={onClear}>
            <View style={[boxStyle, { backgroundColor: colors.background }]}>
                <View style={styles.themeBoxCenter}>
                    <Text style={[styles.themeNumber, { color: textColor() }]}>{ memory ? memory : "M" + index}
                        { memory && <Text style={{ fontSize: 16, color: textColor() }}>g</Text> }
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
  };
  
  export default function  MemorySelector({ onMemorySelected }: { onMemorySelected: (weight: number) => void })  {
    const { weightValue } = useBLEConnectionContext();
    const [memory, setMemory] = React.useState<{ memory01: any; memory02: any; memory03: any }>({
        memory01: null,
        memory02: null,
        memory03: null,
    });

    const updateMemory = (key: keyof typeof memory, value: any) => {
        const newMemory = {
            ...memory,
            [key]: value,
        };
        setMemory(newMemory);
        AsyncStorage.setItem('memory', JSON.stringify(newMemory));
    };

    React.useEffect(() => {
        const loadMemory = async () => {
            const storedMemory = await AsyncStorage.getItem('memory');
            if (storedMemory) {
                setMemory(JSON.parse(storedMemory));
            }
        };
        loadMemory();
    }, []);

    const handleMemorySelect = (key: keyof typeof memory) => {
        return () => {
            if (memory[key]) {
                onMemorySelected(memory[key]);
            } else {
                updateMemory(key, weightValue);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        };
    };

    const handleMemoryClear = (key: keyof typeof memory) => {
        return () => {
            updateMemory(key, null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        };
    };
    
    return (
        <View style={styles.itemContainer}>
            <View style={[styles.item, { padding: 20 }]}>
                <View style={styles.themeBoxesContainer}>
                    <MemoryBox 
                        mode="light" 
                        label="Light" 
                        index={1}
                        memory={memory.memory01}
                        onSelect={handleMemorySelect('memory01')}
                        onClear={handleMemoryClear('memory01')}
                    />
                    <MemoryBox 
                        mode="dark" 
                        label="Dark" 
                        index={2}
                        memory={memory.memory02}
                        onSelect={handleMemorySelect('memory02')}
                        onClear={handleMemoryClear('memory02')}
                    />
                    <MemoryBox 
                        mode="auto" 
                        label="Auto" 
                        index={3}
                        memory={memory.memory03}
                        onSelect={handleMemorySelect('memory03')}
                        onClear={handleMemoryClear('memory03')}
                    />
                </View>
            </View>
        </View>
    );
  };


  const styles = StyleSheet.create({
    themeBoxesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    themeBoxContainer: {
        alignItems: 'center',
    },
    themeBox: {
        width: 100,
        height: 100,
        borderRadius: 16,
        marginBottom: 8,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    themeBoxCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeBoxHalf: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeNumber: {
        fontSize: 40,
        fontFamily: 'MenloBold',
        fontWeight: '600',
    },
    themeLabel: {
        fontSize: 12,
        fontFamily: 'InterRegular',
        marginTop: 4,
    },
    itemContainer: {
      alignItems: 'center',
      width: '100%',
    },
    item: {
        flexDirection: 'column',
        borderRadius: 24,
        maxWidth: 480,
        width: '100%',
    },
    title: {
        fontSize: 16,
        fontFamily: "InterMedium",
        flex: 1,
    },
  });
  