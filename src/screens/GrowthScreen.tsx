import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import {
  FETAL_FIRST_WEEK,
  FETAL_LAST_WEEK,
  fetalReference,
  formatWeight,
  INFANT_LAST_MONTH,
  infantReference,
  type PlacedRecord,
  placeRecords,
  type Reference,
} from '../growth';
import { usePalette } from '../palette';
import { ageFromBirth, formatKoreanDate, gestationalAge, parseISODate, toISODate } from '../pregnancy';
import { useAram } from '../store';
import { colors, fonts, shadow } from '../theme';
import { sizeForWeek } from '../tips';
import { Badge, Blob, Card, DateFields, PrimaryButton, SecondaryButton, TextField, Title } from '../ui';

type Phase = 'prenatal' | 'postnatal';

const CHART_HEIGHT = 120;

export function GrowthScreen() {
  const { store, addGrowth, removeGrowth } = useAram();
  const palette = usePalette();
  const [phase, setPhase] = useState<Phase>(store.birth.recorded ? 'postnatal' : 'prenatal');
  const [formOpen, setFormOpen] = useState(false);
  const [date, setDate] = useState(toISODate(new Date()));
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const profile = store.profile;
  if (!profile) return null;

  const gender = profile.gender ?? 'unknown';
  const placed = placeRecords(store.growth, profile.dueDate, store.birth);
  const age = gestationalAge(profile.dueDate);
  const bornAge = store.birth.recorded ? ageFromBirth(store.birth.birthDate) : null;

  const prenatal = phase === 'prenatal';
  const keys = prenatal ? range(FETAL_FIRST_WEEK, FETAL_LAST_WEEK) : range(0, INFANT_LAST_MONTH);
  const recordsByKey = prenatal ? placed.prenatal : placed.postnatal;
  const reference = (key: number): Reference => (prenatal ? fetalReference(key) : infantReference(key, gender));
  const label = (key: number) => (prenatal ? `${key}주` : key === 0 ? '출생' : `${key}개월`);
  const current = prenatal
    ? !store.birth.recorded && age && !age.beforeStart
      ? age.week
      : null
    : bornAge
      ? Math.floor(bornAge.days / 30.4375)
      : null;

  const latest = keys
    .flatMap((key) => (recordsByKey.get(key) ?? []).map((record) => ({ key, record })))
    .filter(({ record }) => record.weightG !== null)
    .sort((a, b) => b.record.date.localeCompare(a.record.date))[0];

  const save = async () => {
    const normalized = normalizeDate(date);
    if (!parseISODate(normalized)) {
      Alert.alert('날짜를 확인해 주세요', '연도, 월, 일을 모두 숫자로 적어 주세요.');
      return;
    }
    const weightG = toMeasure(weight);
    const heightCm = toMeasure(height);
    const headCm = toMeasure(head);
    if (weightG === null && heightCm === null && headCm === null) {
      Alert.alert('숫자를 하나 이상 적어 주세요', '몸무게, 키, 머리둘레 중 아는 것만 적어도 돼요.');
      return;
    }
    if ((weightG !== null && weightG > 30000) || (heightCm !== null && heightCm > 130) || (headCm !== null && headCm > 60)) {
      Alert.alert('숫자를 확인해 주세요', '몸무게는 g, 키와 머리둘레는 cm 단위예요.');
      return;
    }
    setSaving(true);
    try {
      await addGrowth({ date: normalized, weightG, heightCm, headCm, note: note.trim() });
      setWeight('');
      setHeight('');
      setHead('');
      setNote('');
      setFormOpen(false);
      if (store.birth.recorded && parseISODate(store.birth.birthDate)) {
        setPhase(normalized >= normalizeDate(store.birth.birthDate) ? 'postnatal' : 'prenatal');
      }
    } catch {
      Alert.alert('저장하지 못했어요', '다시 한번 눌러 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (record: PlacedRecord) => {
    const title = `${formatKoreanDate(record.date)} 기록을 지울까요?`;
    if (Platform.OS === 'web') {
      if (window.confirm(title)) void removeGrowth(record.id);
      return;
    }
    Alert.alert(title, undefined, [
      { text: '취소', style: 'cancel' },
      { text: '지우기', style: 'destructive', onPress: () => void removeGrowth(record.id) },
    ]);
  };

  const chartMax = Math.max(
    ...keys.map((key) => reference(key).g),
    ...keys.flatMap((key) => (recordsByKey.get(key) ?? []).map((record) => record.weightG ?? 0)),
  );
  // 뱃속 몸무게는 몇 g에서 3kg까지 커서 제곱근 눈금이어야 초기 기록도 보인다.
  const chartY = (grams: number) => (prenatal ? Math.sqrt(grams / chartMax) : grams / chartMax) * CHART_HEIGHT;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Title>성장</Title>
        <Text style={styles.lead}>초음파에서 들은 숫자, 검진 때 잰 키와 몸무게를 한 줄로 이어요.</Text>

        <View style={styles.segment}>
          {(['prenatal', 'postnatal'] as const).map((item) => {
            const active = item === phase;
            return (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setPhase(item)}
                style={[styles.segmentItem, active && { backgroundColor: palette.soft }]}
              >
                <Text style={[styles.segmentText, active && { color: palette.accentDark }]}>{item === 'prenatal' ? '뱃속에서' : '태어난 뒤'}</Text>
              </Pressable>
            );
          })}
        </View>

        <LinearGradient colors={palette.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { shadowColor: palette.accentDark }]}>
          <Blob size={160} color="rgba(255,255,255,0.18)" style={{ top: -60, right: -40 }} />
          <Text style={styles.heroKicker}>가장 최근 몸무게</Text>
          {latest && latest.record.weightG !== null ? (
            <>
              <Text style={styles.heroValue}>{formatWeight(latest.record.weightG)}</Text>
              <Text style={styles.heroSub}>
                {label(latest.key)} · 평균 {formatWeight(reference(latest.key).g)}
              </Text>
              <Text style={styles.heroDate}>{formatKoreanDate(latest.record.date)}</Text>
            </>
          ) : (
            <>
              <Text style={styles.heroEmpty}>아직 기록이 없어요</Text>
              <Text style={styles.heroSub}>
                {prenatal ? '초음파 때 들은 추정 몸무게를 남겨 보세요.' : '검진 때 잰 키와 몸무게를 남겨 보세요.'}
              </Text>
            </>
          )}
          <View style={styles.chart}>
            {keys.map((key) => {
              const ref = reference(key);
              const mine = (recordsByKey.get(key) ?? []).filter((record) => record.weightG !== null).at(-1);
              const isCurrent = key === current;
              return (
                <View key={key} style={styles.column}>
                  <View style={styles.columnArea}>
                    <View
                      style={[
                        styles.bar,
                        { height: Math.max(2, chartY(ref.g)) },
                        isCurrent && styles.barCurrent,
                      ]}
                    />
                    {mine?.weightG ? (
                      <View style={[styles.mark, { bottom: chartY(mine.weightG) - 5, borderColor: palette.accentDark }]} />
                    ) : null}
                  </View>
                  <Text style={styles.axis}>{(prenatal ? key % 4 === 0 : key % 2 === 0) ? key : ''}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={styles.legendBar} />
              <Text style={styles.legendText}>평균</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendMark, { borderColor: palette.accentDark }]} />
              <Text style={styles.legendText}>우리 아기</Text>
            </View>
            <Text style={styles.legendUnit}>{prenatal ? '주' : '개월'}</Text>
          </View>
        </LinearGradient>

        {formOpen ? (
          <Card style={styles.form}>
            <Text style={styles.formTitle}>측정 기록 남기기</Text>
            <DateFields label="잰 날짜" value={date} onChange={setDate} />
            <TextField
              label={store.birth.recorded ? '몸무게 (g)' : '추정 몸무게 (g)'}
              value={weight}
              onChangeText={(value) => setWeight(cleanNumber(value))}
              placeholder={store.birth.recorded ? '4500' : '120'}
              numeric
            />
            <View style={styles.pair}>
              <View style={styles.pairItem}>
                <TextField label="키 (cm)" value={height} onChangeText={(value) => setHeight(cleanNumber(value))} placeholder="12.4" numeric />
              </View>
              <View style={styles.pairItem}>
                <TextField label="머리둘레 (cm)" value={head} onChangeText={(value) => setHead(cleanNumber(value))} placeholder="선택" numeric />
              </View>
            </View>
            <TextField label="메모" value={note} onChangeText={setNote} placeholder="정기 검진, 2차 초음파..." />
            <PrimaryButton label={saving ? '남기는 중' : '성장 기록 남기기'} onPress={() => void save()} disabled={saving} />
            <SecondaryButton label="닫기" onPress={() => setFormOpen(false)} />
          </Card>
        ) : (
          <PrimaryButton label="+ 측정 기록 남기기" onPress={() => setFormOpen(true)} />
        )}

        <View style={styles.list}>
          {keys.map((key, index) => {
            const ref = reference(key);
            const records = recordsByKey.get(key) ?? [];
            const isCurrent = key === current;
            const isPast = current !== null && key < current;
            const future = !isCurrent && !isPast && records.length === 0;
            return (
              <View key={key} style={[styles.row, future && styles.rowFuture]}>
                <View style={styles.rail}>
                  <View
                    style={[
                      styles.dot,
                      isPast && { backgroundColor: palette.soft, borderColor: palette.accent },
                      isCurrent && { backgroundColor: palette.accent, borderColor: palette.accentDark, width: 20, height: 20, borderRadius: 10 },
                      records.length > 0 && !isCurrent && { backgroundColor: palette.accent, borderColor: palette.accent },
                    ]}
                  />
                  {index < keys.length - 1 ? <View style={[styles.line, (isPast || isCurrent) && { backgroundColor: palette.soft }]} /> : null}
                </View>
                <View style={styles.rowBody}>
                  <View style={styles.rowHead}>
                    <Text style={[styles.rowTitle, isCurrent && { color: palette.accentDark }]}>{label(key)}</Text>
                    {prenatal ? <Text style={styles.fruit}>{sizeForWeek(key)}</Text> : null}
                    {isCurrent ? <Badge label="지금" /> : null}
                  </View>
                  <Text style={styles.rowRef}>
                    평균 {ref.cm}cm · {formatWeight(ref.g)}
                  </Text>
                  {records.map((record) => (
                    <View key={record.id} style={[styles.record, { borderColor: palette.soft }]}>
                      <View style={styles.recordHead}>
                        <Text style={[styles.recordDate, { color: palette.accentDark }]}>{formatKoreanDate(record.date)}</Text>
                        {record.fromBirthCard ? (
                          <Text style={styles.recordTag}>출생 카드</Text>
                        ) : (
                          <Pressable accessibilityRole="button" accessibilityLabel="성장 기록 지우기" onPress={() => remove(record)} hitSlop={8}>
                            <Text style={styles.remove}>지우기</Text>
                          </Pressable>
                        )}
                      </View>
                      <Text style={styles.recordValue}>{describe(record)}</Text>
                      {record.note && !record.fromBirthCard ? <Text style={styles.recordNote}>{record.note}</Text> : null}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.footnote}>
          {prenatal
            ? '평균값은 참고용이에요. 20주 전 길이는 머리부터 엉덩이까지, 20주부터는 머리부터 발끝까지 잰 값이에요. 걱정되는 숫자는 진료 때 물어보세요.'
            : `WHO 성장 기준 중앙값${gender === 'unknown' ? '(딸·아들 평균)' : ''}이에요. 아기마다 속도가 달라서 비교보다는 기억용으로 봐 주세요.`}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function cleanNumber(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('').slice(0, 1)}` : whole.slice(0, 5);
}

function toMeasure(value: string): number | null {
  const parsed = Number(value);
  return value.trim() && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function describe(record: PlacedRecord): string {
  const parts: string[] = [];
  if (record.weightG !== null) parts.push(formatWeight(record.weightG));
  if (record.heightCm !== null) parts.push(`키 ${record.heightCm}cm`);
  if (record.headCm !== null) parts.push(`머리 ${record.headCm}cm`);
  return parts.join(' · ');
}

function normalizeDate(value: string): string {
  const [year = '', month = '', day = ''] = value.split('-');
  if (!year || !month || !day) return value;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 24 },
  lead: { color: colors.muted, lineHeight: 22, fontSize: 15 },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 999,
    padding: 5,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  segmentItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 42, borderRadius: 999 },
  segmentText: { fontFamily: fonts.cute, fontSize: 16, color: colors.muted },
  hero: {
    borderRadius: 30,
    padding: 22,
    overflow: 'hidden',
    ...shadow,
    shadowOpacity: 0.22,
  },
  heroKicker: { color: 'rgba(255,255,255,0.9)', fontFamily: fonts.cute, fontSize: 15 },
  heroValue: { color: '#FFFFFF', fontFamily: fonts.cute, fontSize: 46, lineHeight: 54, marginTop: 2 },
  heroEmpty: { color: '#FFFFFF', fontFamily: fonts.cute, fontSize: 28, lineHeight: 36, marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.95)', fontSize: 15, marginTop: 2 },
  heroDate: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 18 },
  column: { flex: 1, alignItems: 'center' },
  columnArea: { width: '100%', height: CHART_HEIGHT, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '100%', maxWidth: 14, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.42)' },
  barCurrent: { backgroundColor: '#FFFFFF' },
  mark: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
  },
  axis: { width: 28, textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: 10, marginTop: 4, height: 14 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBar: { width: 10, height: 10, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  legendMark: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 2.5 },
  legendText: { color: '#FFFFFF', fontSize: 12 },
  legendUnit: { marginLeft: 'auto', color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  form: { gap: 14 },
  formTitle: { fontFamily: fonts.cute, fontSize: 20, color: colors.ink },
  pair: { flexDirection: 'row', gap: 10 },
  pairItem: { flex: 1, minWidth: 0 },
  list: { marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  rowFuture: { opacity: 0.5 },
  rail: { width: 22, alignItems: 'center' },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: colors.line,
  },
  line: { width: 3, flex: 1, backgroundColor: colors.line, borderRadius: 2, marginVertical: 2 },
  rowBody: { flex: 1, paddingBottom: 14, gap: 2 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontFamily: fonts.cute, fontSize: 18, color: colors.ink },
  fruit: { color: colors.muted, fontFamily: fonts.cute, fontSize: 14 },
  rowRef: { color: colors.muted, fontSize: 13 },
  record: {
    marginTop: 8,
    backgroundColor: colors.cardSolid,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    gap: 2,
  },
  recordHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordDate: { fontFamily: fonts.cute, fontSize: 13 },
  recordTag: { color: colors.muted, fontSize: 12 },
  recordValue: { fontFamily: fonts.cute, fontSize: 18, color: colors.ink },
  recordNote: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  remove: { color: '#C9B6AB', fontFamily: fonts.cute, fontSize: 13 },
  footnote: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 8 },
});
