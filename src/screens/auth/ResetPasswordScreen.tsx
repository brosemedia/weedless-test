import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie Ihre E-Mail-Adresse ein');
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);

    if (error) {
      Alert.alert('Fehler', error.message);
    } else {
      setSent(true);
      Alert.alert(
        'E-Mail gesendet',
        'Bitte überprüfen Sie Ihre E-Mail für weitere Anweisungen zum Zurücksetzen Ihres Passworts.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  if (sent) {
    return (
      <LinearGradient
        colors={[GRADIENT_END, GRADIENT_START]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.content}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>E-Mail gesendet</Text>
          <Text style={styles.subtitle}>
            Bitte überprüfen Sie Ihre E-Mail für weitere Anweisungen zum Zurücksetzen Ihres Passworts.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Zurück zur Anmeldung</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[GRADIENT_END, GRADIENT_START]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.content}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Passwort zurücksetzen</Text>
        <Text style={styles.subtitle}>
          Geben Sie Ihre E-Mail-Adresse ein, und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
        </Text>

        <View style={styles.form}>
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

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={GRADIENT_START} />
            ) : (
              <Text style={styles.buttonText}>Link senden</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>
              Zurück zur Anmeldung
            </Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
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
  backButton: {
    marginTop: spacing.m,
    alignItems: 'center',
  },
  backButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});
