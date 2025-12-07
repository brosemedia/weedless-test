import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { haptics } from '../services/haptics';

type HapticPressableProps = PressableProps & {
  hapticType?: 'selection' | 'impact' | 'light' | 'medium' | 'heavy';
  hapticMode?: 'general' | 'dashboard' | 'pause' | 'game';
};

/**
 * Wrapper für Pressable, der automatisch Haptik-Feedback auslöst
 */
export const HapticPressable: React.FC<HapticPressableProps> = ({
  onPress,
  hapticType = 'selection',
  hapticMode = 'general',
  children,
  ...props
}) => {
  const handlePress = React.useCallback(
    (event: any) => {
      // Haptik auslösen
      if (hapticType === 'selection') {
        haptics.trigger(hapticMode, 'selection');
      } else if (hapticType === 'impact' || hapticType === 'light' || hapticType === 'medium' || hapticType === 'heavy') {
        haptics.trigger(hapticMode, 'impact', {
          intensity: hapticType === 'light' ? 'light' : hapticType === 'heavy' ? 'heavy' : 'medium',
        });
      }
      
      // Original onPress aufrufen
      onPress?.(event);
    },
    [onPress, hapticType, hapticMode]
  );

  return (
    <Pressable onPress={handlePress} {...props}>
      {children}
    </Pressable>
  );
};

