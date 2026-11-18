import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ageFromBirth, formatKoreanDate, gestationalAge, memoKey, postpartumStage, trimesterLabel, withCuteI } from '../pregnancy';
import { useAram } from '../store';
import { sizeForWeek, tipForWeek } from '../tips';
import { LinearGradient } from 'expo-linear-gradient';

import { babyLines } from '../babyTalk';
import { usePalette } from '../palette';
import { colors, fonts, radius, shadow } from '../theme';
import { Badge, Bean, Blob, Card, Title } from '../ui';

type Tab = 'home' | 'tips' | 'album' | 'timeline' | 'birth';

export function HomeScreen({ onNavigate, onOpenSettings }: { onNavigate: (tab: Tab) => void; onOpenSettings: () => void }) {
  const { store, photos, saveMemo } = useAram();
  const palette = usePalette();
  const profile = store.profile;
  const age = profile ? gestationalAge(profile.dueDate) : null;
  const born = store.birth.recorded ? ageFromBirth(store.birth.birthDate) : null;
  const stage = store.birth.recorded ? postpartumStage(store.birth.birthDate) : null;
  const tip = age ? tipForWeek(age.week) : null;
  const key = memoKey(age, store.birth.recorded, store.birth.birthDate);
  const savedMemo = store.weekMemos[key] ?? '';
  const [memo, setMemo] = useState(savedMemo);
  const [memoSource, setMemoSource] = useState(savedMemo);
  if (memoSource !== savedMemo) {
    setMemoSource(savedMemo);
    setMemo(savedMemo);
  }

  if (!profile || !age) return null;

  const baby = store.birth.recorded && store.birth.name ? store.birth.name : profile.babyName || '우리 아기';
  const mom = profile.momName || '엄마';
  const dad = profile.dadName || '아빠';
  const featured = stage ?? tip;
  const recent = store.media.slice(0, 6);
  const progress = Math.min(100, Math.max(4, Math.round((age.totalDays / 280) * 100)));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <View>
            <Text style={styles.hello}>{mom}, {dad}의</Text>
            <Title size={30}>{baby} 이야기</Title>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="설정" onPress={onOpenSettings} style={styles.settings}>
            <Text style={styles.settingsText}>설정</Text>
          </Pressable>
        </View>

        <LinearGradient colors={born ? palette.heroBorn : palette.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { shadowColor: palette.accentDark }]}>
          <Blob size={200} color="rgba(255,255,255,0.18)" style={{ top: -70, right: -60 }} />
          <Blob size={120} color="rgba(255,255,255,0.12)" style={{ bottom: -50, left: -40 }} />
          <View style={styles.heroBody}>
            <View style={styles.heroCopy}>
              <Badge label={born ? '태어난 지' : age.beforeStart ? '예정일 확인' : `임신 ${trimesterLabel(age.week)}`} color="rgba(255,255,255,0.28)" textColor="#FFFFFF" />
              <View style={styles.heroRow}>
                <Text style={styles.number}>{born ? born.days : age.beforeStart ? '?' : age.week}</Text>
                <Text style={styles.unit}>{born ? '일째' : '주'}</Text>
              </View>
              <Text style={styles.detail}>
                {born
                  ? `${formatKoreanDate(store.birth.birthDate)}에 왔어요`
                  : age.beforeStart
                    ? '예정일이 너무 멀어요'
                    : `${age.week}주 ${age.day}일`}
              </Text>
            </View>
            <View style={styles.beanHalo}>
              <Bean size={84} color={palette.bean} sleepy={Boolean(born)} lines={babyLines(baby, Boolean(born))} />
            </View>
          </View>
          {!born && !age.beforeStart ? (
            <>
              <View style={styles.sizeBubble}>
                <Text style={styles.sizeText}>
                  지금 {withCuteI(baby)}는 <Text style={[styles.sizeStrong, { color: palette.accentDark }]}>{sizeForWeek(age.week)}</Text>만 해요
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.due}>
                {age.untilDue > 0 ? `만나기까지 ${age.untilDue}일` : age.untilDue === 0 ? '오늘이 예정일이에요' : `예정일이 ${Math.abs(age.untilDue)}일 지났어요`}
                {'  ·  '}
                {formatKoreanDate(profile.dueDate)}
              </Text>
            </>
          ) : null}
        </LinearGradient>

        {featured ? (
          <Pressable onPress={() => onNavigate('tips')}>
            <Card style={styles.tipCard}>
              <Badge label={born ? stage?.label ?? '' : `${tip?.week}주 꿀팁`} color={colors.butter} textColor={colors.gold} />
              <Text style={styles.tipTitle}>{born ? stage?.title : tip?.title}</Text>
              <Text style={styles.together}>{featured.together}</Text>
              <Text style={[styles.link, { color: palette.accentDark }]}>더 보기 →</Text>
            </Card>
          </Pressable>
        ) : null}

        <Card style={styles.memoCard}>
          <Text style={styles.section}>오늘의 한 줄</Text>
          <TextInput
            value={memo}
            onChangeText={setMemo}
            onBlur={() => {
              void saveMemo(key, memo.trim());
            }}
            placeholder={`${baby}에게 하고 싶은 말`}
            placeholderTextColor="#C9B6AB"
            style={styles.memo}
            multiline
          />
        </Card>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>최근 기록</Text>
          <Pressable onPress={() => onNavigate('album')}>
            <Text style={[styles.link, { color: palette.accentDark }]}>전체 보기</Text>
          </Pressable>
        </View>
        {recent.length === 0 ? (
          <Pressable onPress={() => onNavigate('album')} style={styles.empty}>
            <Bean size={48} color={colors.sky} />
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>첫 초음파를 올려 볼까요?</Text>
              <Text style={styles.emptyBody}>주수와 함께 차곡차곡 남겨요.</Text>
            </View>
          </Pressable>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.film}>
            {recent.map((item, index) => (
              <Pressable key={item.id} onPress={() => onNavigate('album')} style={[styles.thumb, { transform: [{ rotate: index % 2 ? '2deg' : '-2deg' }] }]}>
                {item.kind === 'photo' && photos[item.id] ? (
                  <Image source={{ uri: photos[item.id] }} style={styles.thumbImage} />
                ) : (
                  <View style={styles.videoThumb}>
                    <Text style={styles.videoLabel}>{item.kind === 'video' ? '▶' : '사진'}</Text>
                  </View>
                )}
                <Text style={styles.thumbWeek}>{item.week ? `${item.week}주` : '출생 후'}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 24 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { color: colors.muted, fontFamily: fonts.cute, fontSize: 16 },
  settings: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.hairline, ...shadow },
  settingsText: { color: colors.ink, fontFamily: fonts.cute, fontSize: 15 },
  hero: {
    borderRadius: 30,
    padding: 22,
    overflow: 'hidden',
    gap: 14,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  heroBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroCopy: { flex: 1, gap: 4 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  number: { fontFamily: fonts.cute, fontSize: 82, lineHeight: 90, color: '#FFFFFF' },
  unit: { fontFamily: fonts.cute, fontSize: 26, color: '#FFFFFF', marginBottom: 14 },
  detail: { color: 'rgba(255,255,255,0.92)', fontSize: 16, fontFamily: fonts.cute },
  beanHalo: { width: 116, height: 116, borderRadius: 58, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  sizeBubble: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  sizeText: { color: colors.ink, fontFamily: fonts.cute, fontSize: 18, lineHeight: 26 },
  sizeStrong: { fontFamily: fonts.cute, color: colors.accentDark, fontSize: 22, lineHeight: 28 },
  track: { height: 8, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 99, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#FFFFFF', borderRadius: 99 },
  due: { color: 'rgba(255,255,255,0.92)', fontSize: 14 },
  tipCard: { gap: 8 },
  tipTitle: { fontFamily: fonts.cute, fontSize: 21, color: colors.ink },
  section: { fontSize: 19, fontFamily: fonts.cute, color: colors.ink },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  together: { color: colors.ink, fontSize: 16, lineHeight: 24 },
  link: { color: colors.accentDark, fontFamily: fonts.cute, fontSize: 15 },
  memoCard: { gap: 10 },
  memo: {
    backgroundColor: colors.field,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 64,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 26, borderWidth: 1, borderColor: colors.hairline, padding: 18, backgroundColor: colors.card, ...shadow },
  emptyCopy: { flex: 1 },
  emptyTitle: { fontFamily: fonts.cute, color: colors.ink, fontSize: 17 },
  emptyBody: { color: colors.muted, marginTop: 4 },
  film: { gap: 12, paddingVertical: 6, paddingHorizontal: 2 },
  thumb: { width: 112, backgroundColor: '#FFFFFF', padding: 6, paddingBottom: 8, borderRadius: 16, ...shadow },
  thumbImage: { width: 100, height: 112, borderRadius: 12, backgroundColor: colors.bgDeep },
  videoThumb: { width: 100, height: 112, borderRadius: 12, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' },
  videoLabel: { color: colors.ink, fontFamily: fonts.cute, fontSize: 22 },
  thumbWeek: { marginTop: 6, color: colors.muted, fontSize: 13, fontFamily: fonts.cute, textAlign: 'center' },
});
