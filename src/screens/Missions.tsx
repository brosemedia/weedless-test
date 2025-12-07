import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Linking, Modal, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../design/tokens';
import { HEADER_TOTAL_HEIGHT } from '../components/AppHeader';
import { Article, ARTICLES } from '../content/articles';
import { useQuickActionsVisibility } from '../hooks/useQuickActionsVisibility';
import { useHeaderTransparency } from '../hooks/useHeaderTransparency';
import { useUiStore } from '../store/ui';
import { FrostedSurface } from '../design/FrostedSurface';
import { useTheme } from '../theme/useTheme';
import { ThemedText, PrimaryButton } from '../design/theme';
import type { ThemeColors, ThemeMode } from '../theme/themes';
type TagTheme = {
  badgeBackground: string;
  badgeText: string;
  heroBackground: string;
  heroBorder: string;
};

const TAG_THEMES: Record<Article['tag'], TagTheme> = {
  Strategie: {
    badgeBackground: '#F8D294',
    badgeText: '#5C3310',
    heroBackground: '#FFF8EC',
    heroBorder: '#F5D9A8',
  },
  Wissen: {
    badgeBackground: '#D1E8FF',
    badgeText: '#12446B',
    heroBackground: '#F3F8FF',
    heroBorder: '#D8E9FF',
  },
  Selbstfürsorge: {
    badgeBackground: '#F9B9C4',
    badgeText: '#65192E',
    heroBackground: '#FFF1F4',
    heroBorder: '#F9C6CF',
  },
  Mindset: {
    badgeBackground: '#F4D4FF',
    badgeText: '#4A1771',
    heroBackground: '#FBF3FF',
    heroBorder: '#E8C4FF',
  },
};

type MarkdownBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'numbered'; index: string; text: string }
  | { type: 'quote'; text: string };

const normalizeInline = (text: string) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .trim();

const parseMarkdown = (input: string): MarkdownBlock[] => {
  const lines = input.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: normalizeInline(paragraph.join(' ')) });
      paragraph = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      blocks.push({ type: 'heading', text: normalizeInline(trimmed.slice(3)) });
      return;
    }
    if (trimmed.startsWith('- ')) {
      flushParagraph();
      blocks.push({ type: 'bullet', text: normalizeInline(trimmed.slice(2)) });
      return;
    }
    const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s*(.*)$/);
    if (numberedMatch) {
      flushParagraph();
      blocks.push({
        type: 'numbered',
        index: numberedMatch[1],
        text: normalizeInline(numberedMatch[2]),
      });
      return;
    }
    if (trimmed.startsWith('> ')) {
      flushParagraph();
      blocks.push({ type: 'quote', text: normalizeInline(trimmed.slice(2)) });
      return;
    }
    paragraph.push(trimmed);
  });

  flushParagraph();
  if (!blocks.length && input.trim().length) {
    blocks.push({ type: 'paragraph', text: normalizeInline(input) });
  }
  return blocks;
};

type ArticleModalProps = {
  visible: boolean;
  article: Article | null;
  theme: TagTheme;
  onClose: () => void;
};

function ArticleModal({ visible, article, theme, onClose }: ArticleModalProps) {
  const { theme: appTheme } = useTheme();
  const palette = appTheme.colors;
  const insets = useSafeAreaInsets();
  useQuickActionsVisibility('knowledge-article', visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const blocks = useMemo(() => (article ? parseMarkdown(article.content) : []), [article]);

  const handleSourcePress = (url: string) => {
    Linking.openURL(url).catch(() => {
      // eslint-disable-next-line no-console
      console.warn('Konnte Link nicht öffnen', url);
    });
  };

  if (!article) return null;

  const blocksToRender: MarkdownBlock[] = blocks.length
    ? blocks
    : [{ type: 'paragraph', text: article.content.trim() }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.modalBackdrop}
        onPress={onClose}
        accessible={false}
        importantForAccessibility="no"
      >
        <Animated.View
          style={[
            styles.modalBackdropOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        />
      </Pressable>
      <View style={styles.modalContainer} pointerEvents="box-none">
        <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: palette.surface,
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
                paddingBottom: Math.max(insets.bottom, spacing.xl as any),
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Schließen"
              onPress={onClose}
              style={({ pressed }) => [
                styles.modalCloseButton,
                {
                  backgroundColor: pressed ? palette.border : 'transparent',
                },
              ]}
              hitSlop={8}
            >
              <Text style={[styles.modalCloseIcon, { color: palette.text }]}>✕</Text>
            </Pressable>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
              scrollEnabled={true}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <ThemedText kind="label" muted style={styles.modalTimeLabel}>
                  {article.tag.toUpperCase()} • {article.readMinutes} MIN LESEZEIT
                </ThemedText>
                <ThemedText kind="h1" style={styles.modalTitle}>
                  {article.title}
                </ThemedText>
              </View>

              {/* Excerpt */}
              {article.excerpt ? (
                <View
                  style={[
                    styles.modalExcerpt,
                    {
                      backgroundColor:
                        appTheme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : theme.heroBackground,
                      borderColor: appTheme.mode === 'dark' ? palette.border : theme.heroBorder,
                    },
                  ]}
                >
                  <ThemedText style={[styles.modalExcerptText, { color: palette.text }]}>
                    {article.excerpt}
                  </ThemedText>
                </View>
              ) : null}

              {/* Body */}
              <View style={styles.modalBody}>
                {blocksToRender.map((block, idx) => {
                  if (block.type === 'heading') {
                    return (
                      <View key={`heading-${idx}`} style={styles.modalHeadingBlock}>
                        <ThemedText kind="h2" style={styles.modalSectionHeading}>
                          {block.text}
                        </ThemedText>
                      </View>
                    );
                  }
                  if (block.type === 'paragraph') {
                    return (
                      <ThemedText key={`paragraph-${idx}`} style={styles.modalParagraph}>
                        {block.text}
                      </ThemedText>
                    );
                  }
                  if (block.type === 'bullet') {
                    return (
                      <View key={`bullet-${idx}`} style={styles.modalBulletItem}>
                        <Text style={[styles.modalBullet, { color: palette.text }]}>•</Text>
                        <ThemedText style={styles.modalBulletText}>{block.text}</ThemedText>
                      </View>
                    );
                  }
                  if (block.type === 'numbered') {
                    return (
                      <View key={`number-${idx}`} style={styles.modalNumberedItem}>
                        <View style={[styles.modalNumberBadge, { backgroundColor: palette.primary }]}>
                          <Text style={[styles.modalNumberBadgeText, { color: palette.surface }]}>
                            {block.index}
                          </Text>
                        </View>
                        <ThemedText style={styles.modalNumberedText}>{block.text}</ThemedText>
                      </View>
                    );
                  }
                  if (block.type === 'quote') {
                    return (
                      <View key={`quote-${idx}`} style={[styles.modalQuote, { backgroundColor: palette.border }]}>
                        <ThemedText style={styles.modalQuoteText}>{block.text}</ThemedText>
                      </View>
                    );
                  }
                  return null;
                })}
              </View>

              {/* Sources */}
              {article.sources && article.sources.length > 0 ? (
                <View style={[styles.modalSourcesSection, { borderTopWidth: 1, borderTopColor: palette.border }]}>
                  <ThemedText kind="label" muted style={styles.modalSourcesTitle}>
                    Quellen (Auswahl)
                  </ThemedText>
                  {article.sources.map((source, idx) => (
                    <Pressable
                      key={idx}
                      accessibilityRole="link"
                      accessibilityLabel={`Quelle öffnen: ${source.label}`}
                      onPress={() => handleSourcePress(source.url)}
                      style={({ pressed }) => [
                        styles.modalSourceItem,
                        {
                          backgroundColor: pressed ? palette.border : 'transparent',
                        },
                      ]}
                    >
                      <ThemedText style={styles.modalSourceLabel}>{source.label}</ThemedText>
                      <Text style={[styles.modalSourceIcon, { color: palette.primary }]}>→</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </ScrollView>

            {/* Close Button */}
            <View style={[styles.modalFooter, { borderTopWidth: 1, borderTopColor: palette.border }]}>
              <PrimaryButton title="Schließen" onPress={onClose} />
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

export default function KnowledgeScreen() {
  const { theme } = useTheme();
  const palette = theme.colors;
  const sectionStyles = useMemo(() => createKnowledgeSectionStyles(palette, theme.mode), [palette, theme.mode]);
  const insets = useSafeAreaInsets();
  const headerAccessoryHeight = useUiStore((s) => s.headerAccessoryHeight);
  const { handleScroll } = useHeaderTransparency();
  const [activeArticleIndex, setActiveArticleIndex] = useState<number | null>(null);
  const hasActiveArticle = activeArticleIndex !== null;
  const activeArticle = useMemo(
    () => (activeArticleIndex === null ? null : ARTICLES[activeArticleIndex]),
    [activeArticleIndex]
  );

  const openArticle = (index: number) => setActiveArticleIndex(index);
  const closeArticle = () => setActiveArticleIndex(null);

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <ScrollView
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight + spacing.l,
            paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.m) + 100, // Extra Padding für TabBar
          },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[sectionStyles.section, styles.introCard]}>
          <Text
            style={[
              styles.intro,
              { color: theme.mode === 'dark' ? palette.text : colors.light.textMuted },
            ]}
          >
            Hier findest du kompakte Artikel rund um Konsumreduktion, Gesundheit und Motivation. Die Themen
            werden laufend erweitert – starte mit den Highlights unten.
          </Text>
        </View>

        <View style={styles.list}>
          {ARTICLES.map((article, index) => {
            const tagTheme = TAG_THEMES[article.tag];
            return (
              <Pressable
                key={article.id}
                onPress={() => openArticle(index)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={[styles.cardFrame, { borderColor: palette.border }]}>
                  <FrostedSurface
                    borderRadius={radius.xl}
                    intensity={85}
                    fallbackColor={theme.mode === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.04)'}
                    overlayColor={theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.18)'}
                    style={[
                      sectionStyles.section,
                      styles.cardInner,
                      theme.mode === 'dark' ? styles.cardGlassDark : styles.cardGlassLight,
                    ]}
                  >
                    <View style={styles.metaRow}>
                      <View style={[styles.tag, { backgroundColor: tagTheme.badgeBackground }]}>
                        <Text style={[styles.tagText, { color: tagTheme.badgeText }]}>{article.tag}</Text>
                      </View>
                      <Text
                        style={[
                          styles.readingTime,
                          { color: theme.mode === 'dark' ? palette.textMuted : colors.light.textMuted },
                        ]}
                      >
                        {article.readMinutes} Min Lesezeit
                      </Text>
                    </View>
                    <Text
                      style={[styles.cardTitle, { color: palette.text }]}
                      numberOfLines={2}
                    >
                      {article.title}
                    </Text>
                    <Text
                      style={[
                        styles.cardDescription,
                        { color: theme.mode === 'dark' ? palette.textMuted : colors.light.text },
                      ]}
                      numberOfLines={4}
                    >
                      {article.excerpt}
                    </Text>
                    <View style={styles.cardFooter}>
                      <View style={[styles.cardButton, { backgroundColor: palette.primary }]}>
                        <Text style={[styles.cardButtonText, { color: palette.buttonText }]}>Mehr erfahren</Text>
                      </View>
                    </View>
                  </FrostedSurface>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {activeArticle && (
        <ArticleModal
          visible={hasActiveArticle}
          article={activeArticle}
          theme={TAG_THEMES[activeArticle.tag]}
          onClose={closeArticle}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    paddingHorizontal: spacing.xl,
    backgroundColor: 'transparent',
    gap: spacing.m,
  },
  introCard: {
    paddingVertical: spacing.m,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
    color: colors.light.textMuted,
  },
  list: {
    marginTop: spacing.s,
    gap: spacing.l,
  },
  card: {
    borderRadius: radius.xl,
  },
  cardInner: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.l,
    gap: spacing.m,
  },
  cardFrame: {
    borderWidth: 1,
    borderRadius: radius.xl + 6,
    padding: spacing.s,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  cardGlassLight: {
    borderWidth: 2,
    borderColor: colors.light.primary,
    shadowColor: colors.light.primary,
  },
  cardGlassDark: {
    borderWidth: 2,
    borderColor: colors.dark.primary,
    shadowColor: '#000',
  },
  cardPressed: {
    opacity: 0.95,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.3,
  },
  readingTime: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: colors.light.textMuted,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: colors.light.text,
    marginTop: spacing.s,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
    color: colors.light.text,
    marginTop: spacing.xs,
    marginBottom: spacing.s,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing.s,
  },
  cardButton: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.light.primary,
    alignSelf: 'flex-end',
  },
  cardButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: colors.light.surface,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBackdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
    position: 'relative',
  },
  modalScrollContent: {
    paddingHorizontal: spacing.xl as any,
    paddingTop: spacing.xl as any,
  },
  modalCloseButton: {
    position: 'absolute',
    top: spacing.l as any,
    right: spacing.l as any,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalCloseIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalHeader: {
    marginBottom: spacing.l as any,
    alignItems: 'center',
    paddingTop: spacing.l as any,
    position: 'relative',
  },
  modalTimeLabel: {
    marginBottom: 4,
    letterSpacing: 1,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalExcerpt: {
    borderRadius: radius.l,
    padding: spacing.l as any,
    borderWidth: 1,
    marginBottom: spacing.l as any,
  },
  modalExcerptText: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalBody: {
    gap: spacing.l as any,
    marginBottom: spacing.xl as any,
  },
  modalHeadingBlock: {
    marginTop: spacing.m as any,
    marginBottom: spacing.s as any,
  },
  modalSectionHeading: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalParagraph: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalBulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.s as any,
  },
  modalBullet: {
    fontSize: 18,
    marginRight: spacing.s as any,
    marginTop: 2,
  },
  modalBulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  modalNumberedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.m as any,
    gap: spacing.m as any,
  },
  modalNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalNumberBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalNumberedText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  modalQuote: {
    padding: spacing.l as any,
    borderRadius: radius.l,
    marginVertical: spacing.m as any,
    borderLeftWidth: 3,
  },
  modalQuoteText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  modalSourcesSection: {
    marginTop: spacing.l as any,
    marginBottom: spacing.m as any,
    paddingTop: spacing.l as any,
  },
  modalSourcesTitle: {
    marginBottom: spacing.m as any,
    letterSpacing: 1,
  },
  modalSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.m as any,
    paddingHorizontal: spacing.m as any,
    borderRadius: radius.m,
    marginBottom: spacing.xs as any,
  },
  modalSourceLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  modalSourceIcon: {
    fontSize: 18,
    marginLeft: spacing.s as any,
  },
  modalFooter: {
    paddingHorizontal: spacing.xl as any,
    paddingTop: spacing.l as any,
    paddingBottom: spacing.m as any,
  },
});

const createKnowledgeSectionStyles = (colors: ThemeColors, mode: ThemeMode) =>
  StyleSheet.create({
    section: {
      width: '100%',
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: mode === 'dark' ? 'rgba(26,40,31,0.92)' : 'rgba(255,255,255,0.96)',
      padding: spacing.l as number,
      gap: spacing.m as number,
      shadowColor: mode === 'dark' ? '#000' : colors.primary,
      shadowOpacity: mode === 'dark' ? 0.35 : 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
  });
