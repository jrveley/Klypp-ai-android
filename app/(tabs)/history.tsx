import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fonts } from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { getCarouselHistory } from '../../src/services/api';

export default function HistoryScreen() {
  const { token } = useAuth();
  const [history, setHistory]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const { data, ok } = await getCarouselHistory(token);
      if (ok) setHistory(data.history || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Carousels</Text>
        <Text style={styles.subtitle}>Your last 3 generated carousels</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>No carousels yet</Text>
          <Text style={styles.emptyText}>Generate your first carousel in the Create tab</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTopic} numberOfLines={1}>{item.topic}</Text>
                  <Text style={styles.cardMeta}>
                    {item.slideCount || 7} slides · {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <Ionicons
                  name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                  size={18} color={colors.muted}
                />
              </TouchableOpacity>

              {expandedId === item.id && (
                <View style={styles.cardBody}>
                  {item.caption ? (
                    <Text style={styles.caption} numberOfLines={4}>{item.caption}</Text>
                  ) : null}

                  <View style={styles.hashtagRow}>
                    {(item.hashtags || []).slice(0, 6).map((h: string) => (
                      <View key={h} style={styles.hashtag}>
                        <Text style={styles.hashtagText}>{h.startsWith('#') ? h : '#'+h}</Text>
                      </View>
                    ))}
                  </View>

                  {(item.slides || []).slice(0, 3).map((s: any, i: number) => (
                    <View key={i} style={styles.slidePreview}>
                      <Text style={styles.slideNum}>{s.slideNum}</Text>
                      <Text style={styles.slideHeadline} numberOfLines={1}>{s.headline}</Text>
                    </View>
                  ))}
                  {(item.slides || []).length > 3 && (
                    <Text style={styles.moreSlides}>+ {(item.slides||[]).length - 3} more slides</Text>
                  )}

                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionPrimary}>
                      <Ionicons name="logo-instagram" size={14} color="#000" />
                      <Text style={styles.actionPrimaryText}>Post to IG</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionSecondary}>
                      <Text style={styles.actionSecondaryText}>↓ Download</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.bg },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header:             { padding: spacing.md, paddingTop: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title:              { fontSize: fonts.sizes.xxl, fontWeight: '700', color: colors.text, fontFamily: fonts.mono },
  subtitle:           { fontSize: fonts.sizes.sm, color: colors.muted, marginTop: 4 },
  list:               { padding: spacing.md, paddingBottom: 40 },
  empty:              { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  emptyTitle:         { fontSize: fonts.sizes.lg, fontWeight: '600', color: colors.text },
  emptyText:          { fontSize: fonts.sizes.sm, color: colors.muted, textAlign: 'center' },
  card:               { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.sm, overflow: 'hidden' },
  cardHeader:         { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  cardTopic:          { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.text },
  cardMeta:           { fontSize: fonts.sizes.xs, color: colors.muted, marginTop: 2 },
  cardBody:           { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  caption:            { fontSize: fonts.sizes.sm, color: colors.muted, lineHeight: 20, marginBottom: spacing.sm },
  hashtagRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  hashtag:            { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  hashtagText:        { color: colors.accent, fontSize: fonts.sizes.xs, fontFamily: fonts.mono },
  slidePreview:       { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingVertical: 4 },
  slideNum:           { fontSize: fonts.sizes.xs, fontFamily: fonts.mono, color: colors.accent, width: 24 },
  slideHeadline:      { fontSize: fonts.sizes.sm, color: colors.text2, flex: 1 },
  moreSlides:         { fontSize: fonts.sizes.xs, color: colors.muted, fontFamily: fonts.mono, marginTop: 4, marginBottom: spacing.sm },
  actions:            { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionPrimary:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 10 },
  actionPrimaryText:  { color: '#000', fontWeight: '700', fontSize: fonts.sizes.xs },
  actionSecondary:    { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  actionSecondaryText:{ color: colors.muted, fontSize: fonts.sizes.xs },
});
