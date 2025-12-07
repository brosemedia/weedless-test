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

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Anmeldung fehlgeschlagen', error.message);
    } else {
      // Navigation wird automatisch durch useEffect in NavigationWithTheme gehandhabt
      navigation.navigate('Tabs');
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
            
            <Text style={styles.title}>Willkommen zurück</Text>
            <Text style={styles.subtitle}>
              Melden Sie sich an, um fortzufahren
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
                autoComplete="password"
                editable={!loading}
              />
            </View>

            <Pressable
              onPress={() => navigation.navigate('ResetPassword')}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>
                Passwort vergessen?
              </Text>
            </Pressable>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={GRADIENT_START} />
              ) : (
                <Text style={styles.buttonText}>Anmelden</Text>
              )}
            </Pressable>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>
                Noch kein Konto?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signUpLink}>Registrieren</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    ...typography.variants.caption,
    color: '#FFFFFF',
  },
  button: {
    borderRadius: radius.m,
    padding: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    color: GRADIENT_START,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.m,
  },
  signUpText: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  signUpLink: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});

