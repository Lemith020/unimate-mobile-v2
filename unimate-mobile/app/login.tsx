import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const LOGIN_URL = 'http://10.0.2.2:5000/api/auth/login';

export default function LoginScreen() {
  const router = useRouter();
  const submitting = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (submitting.current) return;

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert(
        'Missing details',
        'Please enter both email and password.'
      );
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Login failed',
          data.error || 'Unable to log in. Please try again.'
        );
        return;
      }

      if (
        typeof data.user?.id !== 'string' ||
        typeof data.token !== 'string' ||
        !data.token.trim()
      ) {
        Alert.alert(
          'Login failed',
          'The server did not return a valid login session.'
        );
        return;
      }

      try {
        // Keep the existing user/profile structure.
        // Store this user's token together with their details.
        await AsyncStorage.setItem(
          'userData',
          JSON.stringify({
            ...data.user,
            token: data.token,
          })
        );
      } catch {
        Alert.alert(
          'Unable to save login',
          'Your login could not be saved on this device. Please try again.'
        );
        return;
      }

      setPassword('');
      router.replace('/home_page');
    } catch {
      Alert.alert(
        'Connection problem',
        'Unable to complete login. Check your connection and make sure the backend is running.'
      );
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home_page');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#431407"
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons
                name="school-outline"
                size={36}
                color="#F97316"
              />
            </View>

            <Text style={styles.brand}>UNIMATE</Text>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>
              Log in to continue your campus journey.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#A8A29E"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#A8A29E"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                accessibilityLabel="Email"
              />
            </View>

            <Text style={[styles.label, styles.passwordLabel]}>
              Password
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#A8A29E"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#A8A29E"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                accessibilityLabel="Password"
              />

              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() =>
                  setPasswordVisible((visible) => !visible)
                }
                accessibilityRole="button"
                accessibilityLabel={
                  passwordVisible ? 'Hide password' : 'Show password'
                }
              >
                <Ionicons
                  name={
                    passwordVisible
                      ? 'eye-off-outline'
                      : 'eye-outline'
                  }
                  size={21}
                  color="#78716C"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>
                    Login
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={19}
                    color="#FFFFFF"
                  />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don&apos;t have an account?
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/register')}
              disabled={loading}
              style={styles.registerButton}
              accessibilityRole="button"
            >
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8EE',
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingVertical: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 30,
  },
  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  brand: {
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
    color: '#EA580C',
    marginBottom: 9,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#431407',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#78716C',
  },
  form: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#44403C',
  },
  passwordLabel: {
    marginTop: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#FAFAF9',
    borderRadius: 12,
    paddingLeft: 13,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 14,
    fontSize: 14,
    color: '#292524',
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
    borderRadius: 13,
    backgroundColor: '#F97316',
  },
  disabledButton: {
    opacity: 0.65,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 5,
  },
  footerText: {
    fontSize: 13,
    color: '#78716C',
  },
  registerButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
});