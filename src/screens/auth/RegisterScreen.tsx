import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radius, typography } from '../../design/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const LOGO = require('../../../assets/hazeless_logo_white.png');

// Grüner Farbverlauf: helles Grün unten (#4CAF50) zu dunklerem Grün oben (#1B5E20)
const GRADIENT_START = '#1B5E20';
const GRADIENT_END = '#4CAF50';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ResetPassword: undefined;
  Tabs: undefined;
  [key: string]: any;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Fehler', 'Bitte füllen Sie E-Mail und Passwort aus');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Fehler', 'Die Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);
    const { error, emailConfirmationRequired, session } = await signUp(
      email.trim(),
      password,
      fullName.trim() || undefined
    );
    setLoading(false);

    if (error) {
      let errorMessage = error.message;
      if (error.message.includes('Database error') || error.message.includes('profile')) {
        errorMessage = 'Datenbankfehler: Bitte stellen Sie sicher, dass die Datenbank-Tabellen korrekt eingerichtet sind. Siehe supabase/TROUBLESHOOTING.md für Hilfe.';
      }
      Alert.alert('Registrierung fehlgeschlagen', errorMessage);
    } else {
      // Registration successful - reset onboarding store to ensure new users complete onboarding
      try {
        const { useOnboardingStore } = await import('../../onboarding/store');
        useOnboardingStore.getState().reset();
        console.log('Onboarding store reset for new user');
      } catch (resetError) {
        console.error('Error resetting onboarding store:', resetError);
        // Continue anyway - the app will check for app_profiles on next load
      }

      if (emailConfirmationRequired || !session) {
        Alert.alert(
          'Registrierung erfolgreich',
          'Bitte bestätige deine E-Mail, bevor du dich anmeldest.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert(
          'Willkommen bei Hazeless',
          'Du bist eingeloggt – wir starten direkt mit deinem Onboarding.',
          [{ text: 'Weiter', onPress: () => navigation.navigate('Tabs') }]
        );
      }
    }
  };

  return (
    <LinearGradient
      colors={[GRADIENT_END, GRADIENT_START]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          
          <Text style={styles.title}>Konto erstellen</Text>
          <Text style={styles.subtitle}>
            Registrieren Sie sich, um zu beginnen
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vollständiger Name (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Max Mustermann"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-Mail</Text>
              <TextInput
                style={styles.input}
                placeholder="ihre@email.com"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Passwort</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!loading}
              />
              <Text style={styles.hint}>
                Mindestens 6 Zeichen
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Passwort bestätigen</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!loading}
              />
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={GRADIENT_START} />
              ) : (
                <Text style={styles.buttonText}>Registrieren</Text>
              )}
            </Pressable>

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>
                Bereits ein Konto?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signInLink}>Anmelden</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    minHeight: '100%',
  },
  logo: {
    width: 280,
    height: 112,
    alignSelf: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: '#FFFFFF',
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  form: {
    gap: spacing.l,
  },
  inputContainer: {
    gap: spacing.s,
  },
  label: {
    ...typography.label,
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: radius.m,
    padding: spacing.m,
    ...typography.body,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  hint: {
    ...typography.variants.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  button: {
    borderRadius: radius.m,
    padding: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: spacing.s,
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    color: GRADIENT_START,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.m,
  },
  signInText: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  signInLink: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});
