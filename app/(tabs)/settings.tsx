import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fonts } from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { authMe, updateUser } from '../../src/services/api';

export default function SettingsScreen() {
  const { token, user, logout } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const { data, ok } = await authMe(token);
      if (ok) setUserData(data);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        }},
      ]
    );
  };

  const handleDisconnect = (platform: string) => {
    Alert.alert(
      `Disconnect ${platform}`,
      `Remove your ${platform} connection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: async () => {
          if (!token) return;
          const update: any = { platforms: (userData?.platforms || []).filter((p: string) => p !== platform.toLowerCase()) };
          if (platform.toLowerCase() === 'instagram') {
            update.igAccessToken  = null;
            update.igAccountId    = null;
            update.igUsername     = null;
          }
          await updateUser(update, token);
          load();
        }},
      ]
    );
  };

  const planColor = (plan: string) => {
    if (plan === 'admin')   return colors.blue;
    if (plan?.includes('pro'))     return colors.purple;
    if (plan?.includes('creator')) return colors.blue;
    return colors.muted;
  };

  const planLimits: Record<string, { carousels: number | string; styles: number | string; automations: number | string }> = {
    free:    { carousels: 3,     styles: 3,  automations: 0 },
    creator: { carousels: 30,    styles: 9,  automations: 2 },
    pro:     { carousels: 120,   styles: 12, automations: 4 },
    admin:   { carousels: '∞',  styles: 12, automations: '∞' },
  };

  const plan     = userData?.plan || 'free';
  const limits   = planLimits[plan] || planLimits.free;
  const used     = userData?.monthlyUsage ? Object.values(userData.monthlyUsage)[0] as number || 0 : 0;

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Profile */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(userData?.name || userData?.email || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{userData?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{userData?.email}</Text>
        </View>
        <View style={[styles.planBadge, { borderColor: planColor(plan) }]}>
          <Text style={[styles.planText, { color: planColor(plan) }]}>
            {plan.toUpperCase().replace('_ANNUAL', '')}
          </Text>
        </View>
      </View>

      {/* Plan usage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan Usage</Text>
        <View style={styles.usageCard}>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>Carousels this month</Text>
            <Text style={styles.usageVal}>{used} / {limits.carousels}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {
              width: limits.carousels === '∞' ? '10%' : `${Math.min(100, (used / Number(limits.carousels)) * 100)}%`
            }]} />
          </View>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>Image styles</Text>
            <Text style={styles.usageVal}>{limits.styles} available</Text>
          </View>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>Automations</Text>
            <Text style={styles.usageVal}>{limits.automations} slots</Text>
          </View>
        </View>

        {plan === 'free' && (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => Linking.openURL('https://klypp.ai/#pricing')}
          >
            <Ionicons name="flash" size={16} color="#000" />
            <Text style={styles.upgradeBtnText}>UPGRADE PLAN</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Connected Accounts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connected Accounts</Text>
        {[
          { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', username: userData?.igUsername, connectUrl: 'https://klypp.ai/app.html' },
          { key: 'tiktok',    label: 'TikTok',    icon: 'musical-notes-outline', username: userData?.tiktokUsername, connectUrl: 'https://klypp.ai/app.html' },
          { key: 'facebook',  label: 'Facebook',  icon: 'logo-facebook', username: userData?.fbUsername, connectUrl: 'https://klypp.ai/app.html' },
        ].map((p) => {
          const connected = userData?.platforms?.includes(p.key);
          return (
            <View key={p.key} style={styles.platformRow}>
              <Ionicons name={p.icon as any} size={22} color={connected ? colors.accent : colors.muted} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.platformName}>{p.label}</Text>
                <Text style={styles.platformStatus}>
                  {connected ? `@${p.username || 'Connected'}` : 'Not connected'}
                </Text>
              </View>
              {connected ? (
                <TouchableOpacity
                  style={styles.disconnectBtn}
                  onPress={() => handleDisconnect(p.label)}
                >
                  <Text style={styles.disconnectBtnText}>Disconnect</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.connectBtn}
                  onPress={() => Linking.openURL(p.connectUrl)}
                >
                  <Text style={styles.connectBtnText}>Connect</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        <Text style={styles.connectNote}>
          To connect accounts, tap Connect — this opens klypp.ai where you can authorize each platform.
        </Text>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <View style={styles.infoCard}>
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'Backend', value: 'klypp.ai' },
            { label: 'Plan', value: plan.toUpperCase() },
          ].map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Links */}
      <View style={styles.section}>
        {[
          { label: 'Terms of Service', url: 'https://klypp.ai/terms.html' },
          { label: 'Privacy Policy',   url: 'https://klypp.ai/privacy.html' },
          { label: 'Website',          url: 'https://klypp.ai' },
        ].map((link) => (
          <TouchableOpacity
            key={link.label}
            style={styles.linkRow}
            onPress={() => Linking.openURL(link.url)}
          >
            <Text style={styles.linkText}>{link.label}</Text>
            <Ionicons name="open-outline" size={14} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={colors.red} />
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.bg },
  content:         { padding: spacing.md, paddingBottom: 60 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  profileCard:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  avatar:          { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accentBorder, justifyContent: 'center', alignItems: 'center' },
  avatarText:      { fontSize: fonts.sizes.xl, fontWeight: '700', color: colors.accent },
  profileName:     { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.text },
  profileEmail:    { fontSize: fonts.sizes.sm, color: colors.muted, marginTop: 2 },
  planBadge:       { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  planText:        { fontSize: fonts.sizes.xs, fontFamily: fonts.mono, letterSpacing: 0.1 },
  section:         { marginBottom: spacing.xl },
  sectionTitle:    { fontSize: fonts.sizes.sm, fontFamily: fonts.mono, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.12, marginBottom: spacing.sm },
  usageCard:       { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  usageRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  usageLabel:      { fontSize: fonts.sizes.sm, color: colors.muted },
  usageVal:        { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.text, fontFamily: fonts.mono },
  progressBar:     { height: 4, backgroundColor: colors.bg3, borderRadius: 2, overflow: 'hidden' },
  progressFill:    { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  upgradeBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, marginTop: spacing.sm },
  upgradeBtnText:  { color: '#000', fontWeight: '700', fontFamily: fonts.mono, fontSize: fonts.sizes.sm },
  platformRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  platformName:    { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.text },
  platformStatus:  { fontSize: fonts.sizes.xs, color: colors.muted, marginTop: 2 },
  connectBtn:      { borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  connectBtnText:  { color: colors.accent, fontSize: fonts.sizes.xs, fontFamily: fonts.mono },
  disconnectBtn:   { borderWidth: 1, borderColor: 'rgba(255,69,58,0.3)', borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  disconnectBtnText:{ color: colors.red, fontSize: fonts.sizes.xs },
  connectNote:     { fontSize: fonts.sizes.xs, color: colors.muted, lineHeight: 16, marginTop: spacing.sm },
  infoCard:        { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  infoRow:         { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:       { fontSize: fonts.sizes.sm, color: colors.muted },
  infoValue:       { fontSize: fonts.sizes.sm, color: colors.text, fontFamily: fonts.mono },
  linkRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  linkText:        { fontSize: fonts.sizes.sm, color: colors.text },
  logoutBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,69,58,0.3)', borderRadius: radius.md, paddingVertical: 14, marginTop: spacing.sm },
  logoutBtnText:   { color: colors.red, fontWeight: '600', fontSize: fonts.sizes.md },
});
