import React, { useEffect, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Linking, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText, PrimaryButton } from '../design/theme';
import { useTheme } from '../theme/useTheme';
import { spacing, radius } from '../design/tokens';
import type { RecoveryMilestone } from '../types/recoveryMilestone';

type Props = {
  visible: boolean;
  milestone: RecoveryMilestone | null;
  onClose: () => void;
};

export function RecoveryMilestoneModal({ visible, milestone, onClose }: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!milestone) return null;

  const handleSourcePress = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.warn('Failed to open URL:', err);
    });
  };

  const paragraphs = milestone.detailBody.split('\n\n').filter((p) => p.trim().length > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessible={false}
        importantForAccessibility="no"
      >
        <Animated.View
          style={[
            styles.backdropOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        />
      </Pressable>
      <View style={styles.container} pointerEvents="box-none">
        <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: palette.surface,
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
                paddingBottom: Math.max(insets.bottom, spacing.xl as any),
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Schließen"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: pressed ? palette.border : 'transparent',
                },
              ]}
              hitSlop={8}
            >
              <Text style={[styles.closeIcon, { color: palette.text }]}>✕</Text>
            </Pressable>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
              scrollEnabled={true}
            >
              {/* Header */}
              <View style={styles.header}>
                {milestone.emoji ? (
                  <Text style={styles.emoji}>{milestone.emoji}</Text>
                ) : null}
                <ThemedText kind="label" muted style={styles.timeLabel}>
                  {milestone.timeLabel.toUpperCase()}
                </ThemedText>
                <ThemedText kind="h1" style={styles.detailTitle}>
                  {milestone.detailTitle}
                </ThemedText>
              </View>

              {/* Body */}
              <View style={styles.body}>
                {paragraphs.map((paragraph, idx) => (
                  <ThemedText key={idx} style={styles.paragraph}>
                    {paragraph}
                  </ThemedText>
                ))}
              </View>

              {/* Sources */}
              {milestone.sources && milestone.sources.length > 0 ? (
                <View style={[styles.sourcesSection, { borderTopWidth: 1, borderTopColor: palette.border }]}>
                  <ThemedText kind="label" muted style={styles.sourcesTitle}>
                    Quellen (Auswahl)
                  </ThemedText>
                  {milestone.sources.map((source, idx) => (
                    <Pressable
                      key={idx}
                      accessibilityRole="link"
                      accessibilityLabel={`Quelle öffnen: ${source.label}`}
                      onPress={() => handleSourcePress(source.url)}
                      style={({ pressed }) => [
                        styles.sourceItem,
                        {
                          backgroundColor: pressed ? palette.border : 'transparent',
                        },
                      ]}
                    >
                      <ThemedText style={styles.sourceLabel}>{source.label}</ThemedText>
                      <Text style={[styles.sourceIcon, { color: palette.primary }]}>→</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </ScrollView>

            {/* Close Button */}
            <View style={[styles.footer, { borderTopWidth: 1, borderTopColor: palette.border }]}>
              <PrimaryButton title="Schließen" onPress={onClose} />
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl as any,
    paddingTop: spacing.xl as any,
  },
  header: {
    marginBottom: spacing.l as any,
    alignItems: 'center',
    paddingTop: spacing.l as any,
    position: 'relative',
  },
  emoji: {
    fontSize: 48,
    marginTop: spacing.s as any,
    marginBottom: spacing.s as any,
  },
  timeLabel: {
    marginBottom: 4,
    letterSpacing: 1,
    textAlign: 'center',
  },
  detailTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.l as any,
    right: spacing.l as any,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    gap: spacing.l as any,
    marginBottom: spacing.xl as any,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: undefined, // wird von ThemedText gesetzt
  },
  sourcesSection: {
    marginTop: spacing.l as any,
    marginBottom: spacing.m as any,
    paddingTop: spacing.l as any,
  },
  sourcesTitle: {
    marginBottom: spacing.m as any,
    letterSpacing: 1,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.m as any,
    paddingHorizontal: spacing.m as any,
    borderRadius: radius.m,
    marginBottom: spacing.xs as any,
  },
  sourceLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  sourceIcon: {
    fontSize: 18,
    marginLeft: spacing.s as any,
  },
  footer: {
    paddingHorizontal: spacing.xl as any,
    paddingTop: spacing.l as any,
    paddingBottom: spacing.m as any,
  },
});

