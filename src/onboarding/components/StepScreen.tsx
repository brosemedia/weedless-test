import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StepHeader } from './StepHeader';
import { colors, radii, spacing, typography } from '../theme';
import { strings } from '../i18n/de';

interface Props {
  title: string;
  subtitle?: string;
  step: number;
  total: number;
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  showBack?: boolean;
  children: React.ReactNode;
}

export const StepScreen: React.FC<Props> = ({
  title,
  subtitle,
  step,
  total,
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  showBack = true,
  children,
}) => (
  <SafeAreaView style={styles.safeArea}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <StepHeader title={title} subtitle={subtitle} step={step} total={total} />
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollInner}>
          {children}
        </ScrollView>
        <View style={styles.footer}>
          {showBack ? (
            <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={onBack}>
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>{strings.common.back}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonPlaceholder} />
          )}
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, nextDisabled && styles.buttonDisabled]}
            disabled={nextDisabled}
            onPress={onNext}
          >
            <Text style={styles.buttonText}>{nextLabel ?? strings.common.next}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: spacing.xxl,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: colors.surface,
  },
  buttonTextSecondary: {
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPlaceholder: {
    flex: 1,
  },
});
