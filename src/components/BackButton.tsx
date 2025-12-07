import React from 'react';
import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/useTheme';
import { spacing, radius } from '../design/tokens';

export function BackButton() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const palette = theme.colors;

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
      accessibilityRole="button"
      accessibilityLabel="Zurück"
    >
      <MaterialCommunityIcons name="arrow-left" size={24} color={palette.text} />
    </Pressable>
  );
}

