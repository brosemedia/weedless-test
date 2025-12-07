import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { StepHeader } from './StepHeader';
import { OnboardingProgressBar } from './ProgressBar';
import { useTheme } from '../../../src/theme/useTheme';
import { spacing, radius, typography, touch } from '../../../src/design/tokens';
import { useStrings } from '../i18n/useStrings';

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
}) => {
  const strings = useStrings();
  const { theme } = useTheme();
  const colors = theme.colors;
  const progress = step / total;

  const buttonScale = useSharedValue(1);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Progress Bar ganz oben */}
          <View style={styles.progressContainer}>
            <OnboardingProgressBar progress={progress} />
          </View>

          <StepHeader title={title} subtitle={subtitle} step={step} total={total} />
          
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          
          <View style={styles.footer}>
            {showBack ? (
              <AnimatedPressable
                style={[
                  styles.button,
                  styles.buttonSecondary,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={onBack}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  {strings.common.back}
                </Text>
              </AnimatedPressable>
            ) : (
              <View style={styles.buttonPlaceholder} />
            )}
            <AnimatedPressable
              style={[
                styles.button,
                styles.buttonPrimary,
                {
                  backgroundColor: nextDisabled ? colors.border : colors.primary,
                },
                nextDisabled && styles.buttonDisabled,
                buttonAnimatedStyle,
              ]}
              disabled={nextDisabled}
              onPress={onNext}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Text style={[styles.buttonText, { color: colors.surface }]}>
                {nextLabel ?? strings.common.next}
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  progressContainer: {
    paddingTop: spacing.s,
    paddingBottom: spacing.m,
  },
  content: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.l,
    gap: spacing.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  button: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touch.minSize,
  },
  buttonPrimary: {
    // backgroundColor wird dynamisch gesetzt
  },
  buttonSecondary: {
    borderWidth: 1.5,
    // backgroundColor und borderColor werden dynamisch gesetzt
  },
  buttonText: {
    ...typography.variants.button,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPlaceholder: {
    flex: 1,
  },
});
