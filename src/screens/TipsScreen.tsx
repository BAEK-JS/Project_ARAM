import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gestationalAge, postpartumStage } from '../pregnancy';
import { useAram } from '../store';
import { sizeForWeek, TIP_NOTE, tipForWeek } from '../tips';
import { usePalette } from '../palette';
import { colors, fonts, radius, shadow } from '../theme';
import { Badge, Bean, Card, Title } from '../ui';

export function TipsScreen() {
  const { store } = useAram();
  const palette = usePalette();
  const age = store.profile ? gestationalAge(store.profile.dueDate) : null;
  const stage = store.birth.recorded ? postpartumStage(store.birth.birthDate) : null;
  const current = Math.min(42, Math.max(4, age?.week || 4));
  const [week, setWeek] = useState(current);
  const tip = stage ?? tipForWeek(week);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>꿀팁</Title>
        <Text style={styles.lead}>{stage ? '태어난 뒤 지금 시기의 이야기예요.' : '이번 주, 우리 셋이 같이 볼 이야기예요.'}</Text>

        {!stage ? (
          <View style={styles.stepper}>
            <Pressable accessibilityRole="button" accessibilityLabel="이전 주수" onPress={() => setWeek((value) => Math.max(4, value - 1))} style={styles.step}>
              <Text style={styles.stepText}>‹</Text>
            </Pressable>
            <View style={styles.weekBox}>
              <Text style={styles.week}>{week}주</Text>
              <Text style={styles.size}>{sizeForWeek(week)}만 해요</Text>
              {week !== current ? (
                <Pressable onPress={() => setWeek(current)}>
                  <Text style={[styles.back, { color: palette.accentDark }]}>이번 주로 돌아가기</Text>
                </Pressable>
              ) : (
                <Badge label="이번 주" color={colors.mint} textColor={colors.mintDark} />
              )}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="다음 주수" onPress={() => setWeek((value) => Math.min(42, value + 1))} style={styles.step}>
              <Text style={styles.stepText}>›</Text>
            </Pressable>
          </View>
        ) : (
          <Badge label={stage.label} color={colors.lavender} textColor="#7A5BB0" />
        )}

        <Text style={styles.title}>{tip.title}</Text>
        <TipCard label="아기" body={tip.baby} color={palette.soft} bean={palette.soft} />
        <TipCard label="엄마" body={tip.mom} color="#FFEFF3" bean="#FFD6E0" />
        <TipCard label="아빠" body={tip.dad} color={colors.sky} bean="#C9DDF5" />
        <View style={styles.together}>
          <Text style={styles.togetherLabel}>우리 같이</Text>
          <Text style={styles.togetherBody}>{tip.together}</Text>
        </View>
        <Text style={styles.note}>{TIP_NOTE}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function TipCard({ label, body, color, bean }: { label: string; body: string; color: string; bean: string }) {
  return (
    <Card style={[styles.tipCard, { backgroundColor: color }]}>
      <View style={styles.avatar}>
        <Bean size={40} color={bean} />
      </View>
      <View style={styles.tipCopy}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 24 },
  lead: { color: colors.muted, lineHeight: 22, fontSize: 15 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, backgroundColor: colors.card, borderRadius: 32, padding: 12, borderWidth: 1, borderColor: colors.hairline, ...shadow },
  step: { width: 52, height: 52, borderRadius: radius.pill, backgroundColor: colors.butter, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: fonts.cute, fontSize: 30, color: colors.ink, lineHeight: 34 },
  weekBox: { alignItems: 'center', gap: 4 },
  week: { fontSize: 40, fontFamily: fonts.cute, color: colors.ink, lineHeight: 46 },
  size: { color: colors.muted, fontSize: 14 },
  back: { fontFamily: fonts.cute, fontSize: 14 },
  title: { fontSize: 23, fontFamily: fonts.cute, color: colors.ink, marginTop: 4 },
  tipCard: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', shadowOpacity: 0 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  tipCopy: { flex: 1 },
  cardLabel: { color: colors.ink, fontFamily: fonts.cute, fontSize: 17, marginBottom: 4 },
  body: { color: colors.ink, fontSize: 15, lineHeight: 23 },
  together: { backgroundColor: colors.mint, borderRadius: 28, padding: 20, borderWidth: 2, borderColor: '#BFE3CE', borderStyle: 'dashed' },
  togetherLabel: { color: colors.mintDark, fontFamily: fonts.cute, fontSize: 17 },
  togetherBody: { color: colors.ink, fontSize: 16, lineHeight: 24, marginTop: 6 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 4 },
});
