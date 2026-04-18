import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fonts } from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { getTopics, generateCarousel, saveCarousel } from '../../src/services/api';

const CATEGORIES = [
  { key: 'crime',     label: 'True Crime',      color: '#ff453a' },
  { key: 'history',   label: 'History',          color: '#c8f000' },
  { key: 'science',   label: 'Science',          color: '#32ade6' },
  { key: 'myths',     label: 'Myths',            color: '#bf5af2' },
  { key: 'food',      label: 'Food',             color: '#ff9f0a' },
  { key: 'teardowns', label: 'Teardowns',        color: '#32ade6' },
  { key: 'darkpsych', label: 'Dark Psych',       color: '#ff453a' },
  { key: 'psychology',label: 'Psychology',       color: '#bf5af2' },
  { key: 'builds',    label: 'Builds',           color: '#c8f000' },
];

const STYLES = [
  { key: 'cinematic', label: 'Cinematic Dark',  desc: 'High contrast, moody' },
  { key: 'neon',      label: 'Neon Noir',        desc: 'Cyberpunk, electric' },
  { key: 'minimal',   label: 'Minimal Clean',    desc: 'White space, editorial' },
];

export default function GeneratorScreen() {
  const { token, user } = useAuth();
  const [step, setStep]               = useState<'category'|'topic'|'style'|'generating'|'done'>('category');
  const [category, setCategory]       = useState('crime');
  const [topics, setTopics]           = useState<any[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [useCustom, setUseCustom]     = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('cinematic');
  const [carousel, setCarousel]       = useState<any>(null);
  const [generating, setGenerating]   = useState(false);
  const [genStep, setGenStep]         = useState('');
  const [showSlides, setShowSlides]   = useState(false);

  const loadTopics = useCallback(async (cat: string) => {
    if (!token) return;
    setTopicsLoading(true);
    try {
      const { data } = await getTopics(cat, token);
      setTopics(data.topics || []);
    } catch {}
    setTopicsLoading(false);
  }, [token]);

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setSelectedTopic(null);
    loadTopics(cat);
    setStep('topic');
  };

  const handleGenerate = async () => {
    const topicName = useCustom ? customTopic : selectedTopic?.name;
    if (!topicName) { Alert.alert('Select a topic first'); return; }
    if (!token) return;

    setGenerating(true);
    setStep('generating');

    try {
      setGenStep('Writing slide copy & headlines...');
      const system = `You are a social media copywriter for Klypp.ai. Write Instagram/TikTok carousel copy.

CRITICAL RULES:
- Every headline and copy block must be a COMPLETE sentence — never truncate with "..."
- Each slide stands alone and is fully self-contained

Return ONLY valid JSON:
{
  "topic": "string",
  "slides": [
    {"slideNum":"01","slideType":"hook","typeLabel":"Hook Slide","headline":"string max 8 words","copy":"string — complete sentence","visualPrompt":"string image prompt max 30 words"},
    {"slideNum":"02","slideType":"setup","typeLabel":"The Setup","headline":"string","copy":"string","visualPrompt":"string"},
    {"slideNum":"03","slideType":"point1","typeLabel":"Point 1","headline":"string","copy":"string","visualPrompt":"string"},
    {"slideNum":"04","slideType":"point2","typeLabel":"Point 2","headline":"string","copy":"string","visualPrompt":"string"},
    {"slideNum":"05","slideType":"point3","typeLabel":"Point 3","headline":"string","copy":"string","visualPrompt":"string"},
    {"slideNum":"06","slideType":"payoff","typeLabel":"The Payoff","headline":"string","copy":"string","visualPrompt":"string"},
    {"slideNum":"07","slideType":"cta","typeLabel":"CTA","headline":"WANT MORE?","copy":"Follow for daily content. Save this post. Drop a comment below.","visualPrompt":"dark minimalist background"}
  ],
  "caption": "string — engaging hook, 2 sentences value, CTA, relevant hashtags",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5","#klyppai"]
}
Return ONLY JSON.`;

      const { data } = await generateCarousel({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        system,
        messages: [{ role: 'user', content: `Create carousel for: "${topicName}" in style: ${selectedStyle}` }],
      }, token);

      if (!data.content) throw new Error(data.error || 'Generation failed');

      const raw = data.content.map((b: any) => b.text || '').join('');
      const stripped = raw.replace(/```json|```/g, '').trim();
      const start = stripped.search(/[{[]/);
      const carouselData = JSON.parse(stripped.slice(start));

      // Ensure #klyppai
      if (!carouselData.hashtags?.includes('#klyppai')) {
        carouselData.hashtags = [...(carouselData.hashtags || []), '#klyppai'];
      }

      setCarousel(carouselData);
      setGenStep('Saving...');

      // Save to history
      await saveCarousel({
        topic: carouselData.topic,
        caption: carouselData.caption,
        hashtags: carouselData.hashtags,
        slides: carouselData.slides,
        style: selectedStyle,
      }, token);

      setStep('done');
    } catch (e: any) {
      Alert.alert('Generation Failed', e.message);
      setStep('style');
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setStep('category');
    setSelectedTopic(null);
    setCustomTopic('');
    setUseCustom(false);
    setCarousel(null);
  };

  // ── GENERATING SCREEN ──
  if (step === 'generating') {
    return (
      <View style={styles.generatingScreen}>
        <View style={styles.genCard}>
          <ActivityIndicator color={colors.accent} size="large" style={{ marginBottom: spacing.lg }} />
          <Text style={styles.genTitle}>GENERATING</Text>
          <Text style={styles.genStep}>{genStep}</Text>
          <View style={styles.genSteps}>
            {['Writing copy & headlines','Composing captions','Building hashtags'].map((s, i) => (
              <Text key={i} style={styles.genStepItem}>◦ {s}</Text>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ── DONE SCREEN ──
  if (step === 'done' && carousel) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.doneHeader}>
          <Text style={styles.doneTitle}>{carousel.topic}</Text>
          <TouchableOpacity onPress={reset} style={styles.newBtn}>
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {carousel.slides.map((slide: any, i: number) => (
          <View key={i} style={[styles.slideCard, slide.slideType === 'hook' && styles.hookCard]}>
            <View style={styles.slideHeader}>
              <Text style={styles.slideNum}>{slide.slideNum}</Text>
              <Text style={styles.slideType}>{slide.typeLabel}</Text>
            </View>
            <Text style={styles.slideHeadline}>{slide.headline}</Text>
            <Text style={styles.slideCopy}>{slide.copy}</Text>
            <Text style={styles.slideVisual}>// {slide.visualPrompt}</Text>
          </View>
        ))}

        <View style={styles.captionCard}>
          <Text style={styles.captionLabel}>// CAPTION</Text>
          <Text style={styles.captionText}>{carousel.caption}</Text>
          <View style={styles.hashtagRow}>
            {(carousel.hashtags || []).map((h: string) => (
              <View key={h} style={styles.hashtag}>
                <Text style={styles.hashtagText}>{h}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.postBtn}>
          <Ionicons name="logo-instagram" size={20} color="#000" />
          <Text style={styles.postBtnText}>POST TO INSTAGRAM</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={reset} style={styles.regenerateBtn}>
          <Text style={styles.regenerateBtnText}>↺ Generate Another</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── MAIN FLOW ──
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>KLYPP<Text style={{ color: colors.accent }}>.ai</Text></Text>
      <Text style={styles.pageSub}>// PICK A TOPIC. GET 7 SLIDES. POST.</Text>

      {/* Step 1 — Category */}
      <View style={styles.stepSection}>
        <Text style={styles.stepLabel}>01 — CHOOSE A CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryBtn, category === cat.key && { borderColor: cat.color, backgroundColor: `${cat.color}15` }]}
              onPress={() => handleCategorySelect(cat.key)}
            >
              <Text style={[styles.categoryBtnText, category === cat.key && { color: cat.color }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Step 2 — Topic */}
      {(step === 'topic' || step === 'style') && (
        <View style={styles.stepSection}>
          <Text style={styles.stepLabel}>02 — SELECT A TOPIC</Text>

          <TouchableOpacity
            style={[styles.customToggle, useCustom && styles.customToggleActive]}
            onPress={() => setUseCustom(!useCustom)}
          >
            <Text style={[styles.customToggleText, useCustom && { color: colors.accent }]}>
              Custom topic
            </Text>
          </TouchableOpacity>

          {useCustom ? (
            <TextInput
              style={styles.customInput}
              value={customTopic}
              onChangeText={setCustomTopic}
              placeholder="Enter your topic..."
              placeholderTextColor={colors.muted}
            />
          ) : topicsLoading ? (
            <ActivityIndicator color={colors.accent} style={{ margin: spacing.lg }} />
          ) : (
            <View style={styles.topicsGrid}>
              {topics.slice(0, 20).map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.topicBtn, selectedTopic?.id === t.id && styles.topicBtnSelected]}
                  onPress={() => { setSelectedTopic(t); setStep('style'); }}
                >
                  <Text style={[styles.topicName, selectedTopic?.id === t.id && { color: colors.accent }]} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text style={styles.topicHook} numberOfLines={2}>{t.hook}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Step 3 — Style */}
      {step === 'style' && (
        <View style={styles.stepSection}>
          <Text style={styles.stepLabel}>03 — IMAGE STYLE</Text>
          <View style={styles.stylesRow}>
            {STYLES.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.styleBtn, selectedStyle === s.key && styles.styleBtnSelected]}
                onPress={() => setSelectedStyle(s.key)}
              >
                <Text style={[styles.styleName, selectedStyle === s.key && { color: colors.accent }]}>{s.label}</Text>
                <Text style={styles.styleDesc}>{s.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.generateBtn, (!selectedTopic && !customTopic) && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={!selectedTopic && !customTopic}
          >
            <Ionicons name="flash" size={18} color="#000" />
            <Text style={styles.generateBtnText}>⚡ GENERATE</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.bg },
  content:           { padding: spacing.md, paddingBottom: 40 },
  pageTitle:         { fontSize: 26, fontWeight: '700', color: colors.text, fontFamily: fonts.mono, letterSpacing: 2, marginTop: spacing.md },
  pageSub:           { fontSize: fonts.sizes.xs, color: colors.muted, fontFamily: fonts.mono, marginBottom: spacing.lg },
  stepSection:       { marginBottom: spacing.lg },
  stepLabel:         { fontSize: fonts.sizes.xs, fontFamily: fonts.mono, color: colors.muted, letterSpacing: 0.15, marginBottom: spacing.sm },
  categoryScroll:    { flexDirection: 'row' },
  categoryBtn:       { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 8, marginRight: spacing.sm },
  categoryBtnText:   { color: colors.muted, fontSize: fonts.sizes.sm, fontFamily: fonts.mono },
  customToggle:      { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 8, alignSelf: 'flex-start', marginBottom: spacing.sm },
  customToggleActive:{ borderColor: colors.accentBorder, backgroundColor: colors.accentDim },
  customToggleText:  { color: colors.muted, fontSize: fonts.sizes.sm, fontFamily: fonts.mono },
  customInput:       { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.text, fontSize: fonts.sizes.md, marginBottom: spacing.md },
  topicsGrid:        { gap: spacing.sm },
  topicBtn:          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  topicBtnSelected:  { borderColor: colors.accentBorder, backgroundColor: colors.accentDim },
  topicName:         { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.text, marginBottom: 4 },
  topicHook:         { fontSize: fonts.sizes.xs, color: colors.muted, lineHeight: 16 },
  stylesRow:         { gap: spacing.sm, marginBottom: spacing.md },
  styleBtn:          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  styleBtnSelected:  { borderColor: colors.accentBorder, backgroundColor: colors.accentDim },
  styleName:         { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.text },
  styleDesc:         { fontSize: fonts.sizes.xs, color: colors.muted, marginTop: 2 },
  generateBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 18 },
  generateBtnDisabled:{ opacity: 0.4 },
  generateBtnText:   { color: '#000', fontWeight: '700', fontFamily: fonts.mono, fontSize: fonts.sizes.md, letterSpacing: 0.1 },
  // Generating
  generatingScreen:  { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  genCard:           { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.xl, width: '100%', alignItems: 'center' },
  genTitle:          { fontSize: fonts.sizes.xxl, fontWeight: '700', color: colors.text, fontFamily: fonts.mono, letterSpacing: 0.1, marginBottom: spacing.sm },
  genStep:           { color: colors.accent, fontSize: fonts.sizes.sm, fontFamily: fonts.mono, marginBottom: spacing.lg },
  genSteps:          { gap: 8, alignSelf: 'stretch' },
  genStepItem:       { color: colors.muted, fontSize: fonts.sizes.sm, fontFamily: fonts.mono },
  // Done
  doneHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingTop: spacing.md },
  doneTitle:         { fontSize: fonts.sizes.xl, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.md },
  newBtn:            { backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accentBorder, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 6 },
  newBtnText:        { color: colors.accent, fontSize: fonts.sizes.sm, fontFamily: fonts.mono },
  slideCard:         { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  hookCard:          { borderColor: colors.accentBorder, backgroundColor: colors.accentDim },
  slideHeader:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  slideNum:          { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.accent, fontFamily: fonts.mono },
  slideType:         { fontSize: fonts.sizes.xs, color: colors.muted, fontFamily: fonts.mono, textTransform: 'uppercase' },
  slideHeadline:     { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.accent, marginBottom: 6 },
  slideCopy:         { fontSize: fonts.sizes.sm, color: colors.text, lineHeight: 20, marginBottom: 8 },
  slideVisual:       { fontSize: fonts.sizes.xs, color: colors.muted, fontFamily: fonts.mono, fontStyle: 'italic' },
  captionCard:       { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.blue + '44', borderLeftWidth: 3, borderLeftColor: colors.blue, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  captionLabel:      { fontSize: fonts.sizes.xs, color: colors.blue, fontFamily: fonts.mono, marginBottom: 6 },
  captionText:       { fontSize: fonts.sizes.sm, color: colors.text, lineHeight: 20, marginBottom: spacing.sm },
  hashtagRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hashtag:           { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  hashtagText:       { color: colors.accent, fontSize: fonts.sizes.xs, fontFamily: fonts.mono },
  postBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 16, marginBottom: spacing.sm },
  postBtnText:       { color: '#000', fontWeight: '700', fontFamily: fonts.mono, fontSize: fonts.sizes.sm },
  regenerateBtn:     { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  regenerateBtnText: { color: colors.muted, fontSize: fonts.sizes.sm, fontFamily: fonts.mono },
});
