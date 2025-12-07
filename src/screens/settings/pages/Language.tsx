import React, { useState, useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import { ThemedView, ThemedText } from '../../../design/theme';
import { spacing } from '../../../design/tokens';
import { useTheme } from '../../../theme/useTheme';
import { useStore } from '../../../store/useStore';
import { getLocaleFromString, getDeviceLocale, type Locale } from '../../../onboarding/i18n';
import { useAppStrings } from '../../../i18n/useStrings';

export default function Language() {
  const { theme } = useTheme();
  const palette = theme.colors;
  const profileLocale = useStore((state) => state.profile.locale);
  const updateProfile = useStore((state) => state.updateProfile);
  const strings = useAppStrings();
  
  const currentLocale = profileLocale 
    ? getLocaleFromString(profileLocale) 
    : getDeviceLocale();
  
  const [lang, setLang] = useState<Locale>(currentLocale);

  useEffect(() => {
    // Update local state when profile locale changes
    const locale = profileLocale 
      ? getLocaleFromString(profileLocale) 
      : getDeviceLocale();
    setLang(locale);
  }, [profileLocale]);

  const handleLanguageChange = (newLang: Locale) => {
    setLang(newLang);
    // Save to profile: 'de' -> 'de-DE', 'en' -> 'en-US'
    const localeString = newLang === 'en' ? 'en-US' : 'de-DE';
    updateProfile({ locale: localeString });
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={{ padding: spacing.l, gap: spacing.m }}>
        <ThemedText kind="h2">{strings.settings.languageTitle}</ThemedText>
        {([
          { id: 'de' as Locale, label: 'Deutsch' },
          { id: 'en' as Locale, label: 'English' },
        ] as const).map((l) => (
          <Pressable
            key={l.id}
            onPress={() => handleLanguageChange(l.id)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: lang === l.id ? palette.primaryMuted : palette.surface,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 16, color: palette.text }}>{l.label}</Text>
          </Pressable>
        ))}
        <ThemedText muted>
          {strings.settings.languageDescription}
        </ThemedText>
      </View>
    </ThemedView>
  );
}
