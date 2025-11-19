import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../design/tokens';
import { FrostedSurface } from '../design/FrostedSurface';
import { HEADER_TOTAL_HEIGHT } from '../components/AppHeader';
import { Article, ARTICLES } from '../content/articles';
import { useQuickActionsVisibility } from '../hooks/useQuickActionsVisibility';
import { useHeaderTransparency } from '../hooks/useHeaderTransparency';
import { useUiStore } from '../store/ui';
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

type ArticleOverlayProps = {
  article: Article;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  theme: TagTheme;
};

function ArticleOverlay({
  article,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  theme,
}: ArticleOverlayProps) {
  const insets = useSafeAreaInsets();
  useQuickActionsVisibility('knowledge-article', true);
  const blocks = useMemo(() => parseMarkdown(article.content), [article.content]);

  const handleSourcePress = (url: string) => {
    Linking.openURL(url).catch(() => {
      // eslint-disable-next-line no-console
      console.warn('Konnte Link nicht öffnen', url);
    });
  };

  const blocksToRender: MarkdownBlock[] = blocks.length
    ? blocks
    : [{ type: 'paragraph', text: article.content.trim() }];

  return (
    <View style={styles.readerOverlay}>
      <View
        style={[
          styles.readerSheet,
          {
            paddingTop: Math.max(spacing.xs, insets.top),
            paddingBottom: insets.bottom + spacing.s,
          },
        ]}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Artikel schließen"
          style={({ pressed }) => [styles.readerCloseButton, pressed && styles.readerCloseButtonPressed]}
        >
          <Ionicons name='close' size={20} color={colors.light.text} />
        </Pressable>
        <ScrollView
          style={styles.readerScroll}
          contentContainerStyle={{
            paddingBottom: insets.bottom + spacing.l,
            gap: spacing.l,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.readerHeader}>
            <Text style={styles.readerMeta}>
              {article.tag} • {article.readMinutes} Min Lesezeit
            </Text>
            <Text style={styles.readerTitle}>{article.title}</Text>
          </View>
          <View
            style={[
              styles.readerHero,
              { backgroundColor: theme.heroBackground, borderColor: theme.heroBorder },
            ]}
          >
            <Text style={styles.readerHeroText}>{article.excerpt}</Text>
          </View>
          <View style={styles.readerContent}>
            {blocksToRender.map((block, idx) => {
              if (block.type === 'heading') {
                return (
                  <View key={`heading-${idx}`} style={styles.readerHeadingBlock}>
                    <Text style={styles.readerSectionHeading}>{block.text}</Text>
                    <View style={styles.readerHeadingDivider} />
                  </View>
                );
              }
              if (block.type === 'paragraph') {
                return (
                  <View key={`paragraph-${idx}`} style={styles.readerParagraphCard}>
                    <Text style={styles.readerParagraphText}>{block.text}</Text>
                  </View>
                );
              }
              if (block.type === 'bullet') {
                return (
                  <View key={`bullet-${idx}`} style={[styles.readerParagraphCard, styles.readerListItem]}>
                    <Text style={styles.readerParagraphText}>{block.text}</Text>
                  </View>
                );
              }
              if (block.type === 'numbered') {
                return (
                  <View
                    key={`number-${idx}`}
                    style={[styles.readerParagraphCard, styles.readerNumberedCard]}
                  >
                    <View style={styles.readerNumberBadge}>
                      <Text style={styles.readerNumberBadgeText}>{block.index}</Text>
                    </View>
                    <View style={styles.readerNumberedText}>
                      <Text style={styles.readerParagraphText}>{block.text}</Text>
                    </View>
                  </View>
                );
              }
              if (block.type === 'quote') {
                return (
                  <View key={`quote-${idx}`} style={styles.readerQuote}>
                    <Text style={styles.readerQuoteText}>{block.text}</Text>
                  </View>
                );
              }
              return null;
            })}
            {article.sources.length ? (
              <View style={styles.readerSourcesCard}>
                <Text style={styles.readerSectionHeading}>Quellen</Text>
                {article.sources.map((source) => (
                  <Pressable
                    key={source.url}
                    onPress={() => handleSourcePress(source.url)}
                    style={({ pressed }) => [styles.readerSourceItem, pressed && styles.readerSourceItemPressed]}
                  >
                    <Ionicons name="link-outline" size={16} color={colors.light.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.readerSourceLabel}>{source.label}</Text>
                      <Text style={styles.readerSourceUrl}>{source.url}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>
        <View style={styles.readerPagerSection}>
          <View style={styles.readerPager}>
            <Pressable
              onPress={hasPrev ? onPrev : undefined}
              disabled={!hasPrev}
              accessibilityLabel="Vorheriger Artikel"
              style={[styles.readerPagerButton, !hasPrev && styles.readerPagerButtonDisabled]}
            >
              <Ionicons name="chevron-back" size={18} color={hasPrev ? colors.light.text : colors.light.textMuted} />
            </Pressable>
            <Text style={styles.readerPagerLabel}>
              Artikel {index + 1} von {total}
            </Text>
            <Pressable
              onPress={hasNext ? onNext : undefined}
              disabled={!hasNext}
              accessibilityLabel="Nächster Artikel"
              style={[styles.readerPagerButton, !hasNext && styles.readerPagerButtonDisabled]}
            >
              <Ionicons name="chevron-forward" size={18} color={hasNext ? colors.light.text : colors.light.textMuted} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function KnowledgeScreen() {
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

  const goPrev = () => {
    setActiveArticleIndex((prev) => {
      if (prev === null || prev <= 0) return prev;
      return prev - 1;
    });
  };

  const goNext = () => {
    setActiveArticleIndex((prev) => {
      if (prev === null || prev >= ARTICLES.length - 1) return prev;
      return prev + 1;
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight + spacing.l,
            paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.m),
          },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={styles.title}>Wissen</Text>
        <Text style={styles.intro}>
          Hier findest du kompakte Artikel rund um Konsumreduktion, Gesundheit und Motivation. Die Themen
          werden laufend erweitert – starte mit den Highlights unten.
        </Text>

        <View style={styles.list}>
          {ARTICLES.map((article, index) => {
            const theme = TAG_THEMES[article.tag];
            return (
              <Pressable
                key={article.id}
                onPress={() => openArticle(index)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <FrostedSurface
                  borderRadius={radius.xl}
                  intensity={85}
                  fallbackColor="rgba(255,255,255,0.04)"
                  overlayColor="rgba(255,255,255,0.18)"
                  style={styles.cardInner}
                >
                  <View style={styles.metaRow}>
                    <View style={[styles.tag, { backgroundColor: theme.badgeBackground }]}>
                      <Text style={[styles.tagText, { color: theme.badgeText }]}>{article.tag}</Text>
                    </View>
                    <Text style={styles.readingTime}>{article.readMinutes} Min Lesezeit</Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <Text style={styles.cardDescription} numberOfLines={4}>
                    {article.excerpt}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.cardButton}>
                      <Text style={styles.cardButtonText}>Mehr erfahren</Text>
                    </View>
                  </View>
                </FrostedSurface>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {hasActiveArticle && activeArticle && (
        <ArticleOverlay
          article={activeArticle}
          index={activeArticleIndex as number}
          total={ARTICLES.length}
          onClose={closeArticle}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={(activeArticleIndex as number) > 0}
          hasNext={(activeArticleIndex as number) < ARTICLES.length - 1}
          theme={TAG_THEMES[activeArticle.tag]}
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
  title: {
    fontSize: 30,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    color: colors.light.text,
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
    borderWidth: 2,
    borderColor: colors.light.primary,
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
  readerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  readerSheet: {
    flex: 1,
    backgroundColor: colors.light.surface,
    paddingHorizontal: spacing.l,
    gap: spacing.l,
  },
  readerHeader: {
    gap: spacing.xs,
  },
  readerMeta: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.light.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  readerTitle: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    lineHeight: 32,
    color: colors.light.text,
    marginTop: spacing.xs,
  },
  readerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.light.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: spacing.s,
  },
  readerCloseButtonPressed: {
    opacity: 0.85,
  },
  readerScroll: {
    flex: 1,
  },
  readerHero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    ...shadows.sm,
  },
  readerHeroText: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'Inter-SemiBold',
    color: colors.light.text,
  },
  readerContent: {
    gap: spacing.m,
  },
  readerHeadingBlock: {
    gap: spacing.xs,
    marginTop: spacing.m,
  },
  readerSectionHeading: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.light.navy,
    letterSpacing: 0.2,
  },
  readerHeadingDivider: {
    height: 2,
    width: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.light.primary,
  },
  readerParagraphCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.xl,
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.xl,
    gap: spacing.s,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  readerParagraphText: {
    fontSize: 16,
    lineHeight: 25,
    color: colors.light.text,
    fontFamily: 'Inter-Regular',
    flexShrink: 1,
  },
  readerListItem: {
    gap: spacing.s,
  },
  readerNumberedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.m,
  },
  readerNumberedText: {
    flex: 1,
  },
  readerNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerNumberBadgeText: {
    color: colors.light.surface,
    fontFamily: 'Inter-Bold',
  },
  readerQuote: {
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.light.surfaceMuted,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  readerQuoteText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    color: colors.light.textMuted,
  },
  readerSourcesCard: {
    marginTop: spacing.l,
    padding: spacing.l,
    borderRadius: radius.xl,
    backgroundColor: colors.light.surface,
    gap: spacing.m,
    ...shadows.sm,
  },
  readerSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.m,
    borderRadius: radius.l,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  readerSourceItemPressed: {
    opacity: 0.7,
  },
  readerSourceLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.light.text,
  },
  readerSourceUrl: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.light.textMuted,
  },
  readerPagerSection: {
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.15)',
  },
  readerPager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    marginTop: 0,
  },
  readerPagerLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: colors.light.textMuted,
  },
  readerPagerButton: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.light.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerPagerButtonDisabled: {
    opacity: 0.4,
  },
});
