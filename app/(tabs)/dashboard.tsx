import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fonts } from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { authMe, getCarouselHistory } from '../../src/services/api';

export default function DashboardScreen() {
  const { token, user, logout } = useAuth();
  const [userData, setUserData]   = useState<any>(null);
  const [history, setHistory]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [me, hist] = await Promise.all([
        authMe(token),
        getCarouselHistory(token),
      ]);
      if (me.ok) setUserData(me.data);
      if (hist.ok) setHistory(hist.data.history || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const planColor = (plan: string) => {
    if (plan === 'admin') return colors.blue;
    if (plan === 'pro' || plan === 'pro_annual') return colors.purple;
    if (plan === 'creator' || plan === 'creator_annual') return colors.blue;
    return colors.muted;
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>KLYPP<Text style={{ color: colors.accent }}>.ai</Text></Text>
          <Text style={styles.headerSub}>Content automation hub</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.planBadge, { borderColor: planColor(userData?.plan || 'free') }]}>
            <Text style={[styles.planText, { color: planColor(userData?.plan || 'free') }]}>
              {(userData?.plan || 'FREE').toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Carousels', value: userData?.totalGenerated || 0 },
          { label: 'Platforms', value: userData?.platforms?.length || 0 },
          { label: 'Topics', value: userData?.usedTopicIds?.length || 0 },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statVal}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Create CTA */}
      <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(tabs)/generator')}>
        <Ionicons name="flash" size={18} color="#000" />
        <Text style={styles.createBtnText}>CREATE NEW CAROUSEL</Text>
      </TouchableOpacity>

      {/* Recent Carousels */}
      <Text style={styles.sectionTitle}>Recent Carousels</Text>
      <Text style={styles.sectionSub}>Your last 3 generated carousels</Text>

      {history.length === 0 ? (
        <TouchableOpacity onPress={() => router.push('/(tabs)/generator')} style={styles.emptyCard}>
          <Ionicons name="images-outline" size={32} color={colors.muted} />
          <Text style={styles.emptyText}>No carousels yet</Text>
          <Text style={styles.emptySubText}>Tap Create to generate your first one</Text>
        </TouchableOpacity>
      ) : (
        history.map((item) => (
          <View key={item.id} style={styles.carouselCard}>
            <TouchableOpacity
              style={styles.carouselHeader}
              onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.carouselTopic} numberOfLines={1}>{item.topic}</Text>
                <Text style={styles.carouselMeta}>
                  {item.slideCount || 7} slides · {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Ionicons
                name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                size={18} color={colors.muted}
              />
            </TouchableOpacity>

            {expandedId === item.id && (
              <View style={styles.carouselBody}>
                {item.caption && (
                  <Text style={styles.carouselCaption} numberOfLines={3}>{item.caption}</Text>
                )}
                <View style={styles.hashtagRow}>
                  {(item.hashtags || []).slice(0, 5).map((h: string) => (
                    <View key={h} style={styles.hashtag}>
                      <Text style={styles.hashtagText}>{h.startsWith('#') ? h : '#'+h}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.carouselActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.igBtn]}
                    onPress={() => router.push({ pathname: '/(tabs)/generator', params: { repost: item.id } })}
                  >
                    <Text style={styles.igBtnText}>📸 Post to IG</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.dlBtn]}>
                    <Text style={styles.dlBtnText}>↓ Download</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))
      )}

      {/* Connected Platforms */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Connected Accounts</Text>
      {[
        { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', username: userData?.igUsername },
        { key: 'tiktok',    label: 'TikTok',    icon: 'musical-notes-outline', username: userData?.tiktokUsername },
      ].map((p) => {
        const connected = userData?.platforms?.includes(p.key);
        return (
          <View key={p.key} style={styles.platformRow}>
            <Ionicons name={p.icon as any} size={24} color={connected ? colors.accent : colors.muted} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.platformName}>{p.label}</Text>
              <Text style={styles.platformStatus}>
                {connected ? `@${p.username || 'Connected'}` : 'Not connected'}
              </Text>
            </View>
            <View style={[styles.platformBadge, connected ? styles.connectedBadge : styles.disconnectedBadge]}>
              <Text style={[styles.platformBadgeText, { color: connected ? colors.accent : colors.muted }]}>
                {connected ? '✓ Connected' : 'Connect'}
              </Text>
            </View>
          </View>
        );
      })}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.bg },
  content:          { padding: spacing.md, paddingBottom: 40 },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.md },
  logo:             { fontSize: 22, fontWeight: '700', color: colors.text, fontFamily: fonts.mono, letterSpacing: 2 },
  headerSub:        { fontSize: fonts.sizes.xs, color: colors.muted, marginTop: 2 },
  headerRight:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planBadge:        { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  planText:         { fontSize: fonts.sizes.xs, fontFamily: fonts.mono, letterSpacing: 0.1 },
  logoutBtn:        { padding: 4 },
  statsRow:         { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard:         { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statVal:          { fontSize: fonts.sizes.xxl, fontWeight: '700', color: colors.text },
  statLabel:        { fontSize: fonts.sizes.xs, color: colors.muted, fontFamily: fonts.mono, textTransform: 'uppercase', marginTop: 2 },
  createBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 16, marginBottom: spacing.xl },
  createBtnText:    { color: '#000', fontWeight: '700', fontFamily: fonts.mono, fontSize: fonts.sizes.sm, letterSpacing: 0.1 },
  sectionTitle:     { fontSize: fonts.sizes.xl, fontWeight: '700', color: colors.text, fontFamily: fonts.mono, letterSpacing: 0.05 },
  sectionSub:       { fontSize: fonts.sizes.sm, color: colors.muted, marginBottom: spacing.md },
  emptyCard:        { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyText:        { color: colors.text, fontSize: fonts.sizes.md, fontWeight: '600' },
  emptySubText:     { color: colors.muted, fontSize: fonts.sizes.sm },
  carouselCard:     { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.sm, overflow: 'hidden' },
  carouselHeader:   { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  carouselTopic:    { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.text },
  carouselMeta:     { fontSize: fonts.sizes.xs, color: colors.muted, marginTop: 2 },
  carouselBody:     { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  carouselCaption:  { fontSize: fonts.sizes.sm, color: colors.muted, lineHeight: 20, marginBottom: spacing.sm },
  hashtagRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  hashtag:          { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  hashtagText:      { color: colors.accent, fontSize: fonts.sizes.xs, fontFamily: fonts.mono },
  carouselActions:  { flexDirection: 'row', gap: spacing.sm },
  actionBtn:        { flex: 1, borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  igBtn:            { backgroundColor: colors.accent },
  igBtnText:        { color: '#000', fontWeight: '700', fontSize: fonts.sizes.xs },
  dlBtn:            { borderWidth: 1, borderColor: colors.border },
  dlBtnText:        { color: colors.muted, fontSize: fonts.sizes.xs },
  platformRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  platformName:     { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.text },
  platformStatus:   { fontSize: fonts.sizes.xs, color: colors.muted, marginTop: 2 },
  platformBadge:    { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  connectedBadge:   { borderColor: colors.accentBorder, backgroundColor: colors.accentDim },
  disconnectedBadge:{ borderColor: colors.border },
  platformBadgeText:{ fontSize: fonts.sizes.xs, fontFamily: fonts.mono },
});
