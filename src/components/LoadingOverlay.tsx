import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal, Text } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { BlurView } from 'expo-blur';
import { LoadingBarAnimation } from './LoadingBarAnimation';

type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
  useAnimation?: boolean;
};

export function LoadingOverlay({ visible, message, useAnimation = false }: LoadingOverlayProps) {
  const { theme, mode } = useTheme();
  const palette = theme.colors;

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.container}>
        <BlurView
          intensity={80}
          tint={mode === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.content, { backgroundColor: palette.cardBg + 'E6' }]}>
          {useAnimation ? (
            <LoadingBarAnimation message={message} imageSize={120} textColor={palette.text} />
          ) : (
            <>
              <ActivityIndicator size="large" color={palette.primary} />
              {message && (
                <Text style={[styles.message, { color: palette.text }]}>{message}</Text>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 120,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

