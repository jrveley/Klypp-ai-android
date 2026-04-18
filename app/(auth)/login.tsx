import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { colors, spacing, radius, fonts } from '../../src/constants/theme';
import { authLogin } from '../../src/services/api';
import { useAuth } from '../../src/hooks/useAuth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please enter email and password'); return; }
    setLoading(true);
    try {
      const { data, ok } = await authLogin(email.toLowerCase().trim(), password);
      if (!ok || !data.token) throw new Error(data.error || 'Login failed');
      await login(data.token);
      router.replace('/(tabs)/dashboard');
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoStack}>
            {[1,0.7,0.4,0.2].map((op, i) => (
              <View key={i} style={[styles.logoBar, { opacity: op, marginBottom: 4 }]} />
            ))}
          </View>
          <Text style={styles.logoText}>KLYPP<Text style={styles.logoDot}>.ai</Text></Text>
        </View>

        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Your AI carousel content engine</Text>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { marginTop: spacing.md }]}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
          />

          <Link href="/(auth)/forgot" style={styles.forgotLink}>
            Forgot password?
          </Link>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnText}>SIGN IN</Text>
            }
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/(auth)/signup" style={styles.signupLink}>Sign up</Link>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  scroll:      { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  logoWrap:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.xl },
  logoStack:   { justifyContent: 'center' },
  logoBar:     { width: 18, height: 3, backgroundColor: colors.accent, borderRadius: 2 },
  logoText:    { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: 3, fontFamily: fonts.mono },
  logoDot:     { color: colors.accent },
  title:       { fontSize: fonts.sizes.hero, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle:    { fontSize: fonts.sizes.md, color: colors.muted, marginBottom: spacing.xl },
  form:        { gap: spacing.xs },
  label:       { fontSize: fonts.sizes.xs, fontFamily: fonts.mono, letterSpacing: 0.12, color: colors.muted, textTransform: 'uppercase', marginBottom: 4 },
  input:       {
    backgroundColor: colors.bg2,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    color: colors.text, fontSize: fonts.sizes.md,
    marginBottom: spacing.sm,
  },
  forgotLink:  { color: colors.muted, fontSize: fonts.sizes.sm, textAlign: 'right', marginBottom: spacing.md },
  btn:         {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#000', fontWeight: '700', fontSize: fonts.sizes.md, fontFamily: fonts.mono, letterSpacing: 0.1 },
  signupRow:   { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  signupText:  { color: colors.muted, fontSize: fonts.sizes.sm },
  signupLink:  { color: colors.accent, fontSize: fonts.sizes.sm, fontWeight: '600' },
});
