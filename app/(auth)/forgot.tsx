import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { colors, spacing, radius, fonts } from '../../src/constants/theme';
import { authForgot } from '../../src/services/api';

export default function ForgotScreen() {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  const handleSubmit = async () => {
    if (!email) { Alert.alert('Error', 'Enter your email'); return; }
    setLoading(true);
    try {
      await authForgot(email.toLowerCase().trim());
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset password</Text>
      {sent ? (
        <>
          <Text style={styles.success}>Check your email for a reset link.</Text>
          <Link href="/(auth)/login" style={styles.backLink}>Back to login</Link>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Enter your email and we'll send a reset link.</Text>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor={colors.muted}
            keyboardType="email-address" autoCapitalize="none" />
          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>SEND RESET LINK</Text>}
          </TouchableOpacity>
          <Link href="/(auth)/login" style={styles.backLink}>Back to login</Link>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: 'center' },
  title:     { fontSize: fonts.sizes.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  subtitle:  { color: colors.muted, fontSize: fonts.sizes.md, marginBottom: spacing.lg },
  label:     { fontSize: fonts.sizes.xs, fontFamily: fonts.mono, color: colors.muted, textTransform: 'uppercase', marginBottom: 4 },
  input:     { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14, color: colors.text, fontSize: fonts.sizes.md, marginBottom: spacing.md },
  btn:       { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  btnText:   { color: '#000', fontWeight: '700', fontFamily: fonts.mono, letterSpacing: 0.1 },
  success:   { color: colors.accent, fontSize: fonts.sizes.md, marginBottom: spacing.lg },
  backLink:  { color: colors.muted, textAlign: 'center', marginTop: spacing.lg },
});
