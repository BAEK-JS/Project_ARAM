import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { daysBetween, formatKoreanDate, parseISODate } from '../pregnancy';
import { useAram } from '../store';
import type { BirthRecord } from '../types';
import { usePalette } from '../palette';
import { colors, fonts, shadow } from '../theme';
import { Bean, Blob, Card, DateFields, PrimaryButton, TextField, TimeFields, Title } from '../ui';

export function BirthScreen() {
  const { store, saveBirth } = useAram();
  const palette = usePalette();
  const [draft, setDraft] = useState<BirthRecord>(store.birth);
  const [draftSource, setDraftSource] = useState(store.birth);
  const [saving, setSaving] = useState(false);
  if (draftSource !== store.birth) {
    setDraftSource(store.birth);
    setDraft(store.birth);
  }

  const update = (patch: Partial<BirthRecord>) => setDraft((current) => ({ ...current, ...patch }));

  const save = async () => {
    const next = { ...draft, birthDate: normalizeDate(draft.birthDate), birthTime: normalizeTime(draft.birthTime) };
    const problem = validateBirth(next);
    if (problem) {
      Alert.alert('출생 기록을 확인해 주세요', problem);
      return;
    }
    setSaving(true);
    try {
      await saveBirth(next);
      Alert.alert('출생 카드를 저장했어요');
    } catch {
      Alert.alert('저장하지 못했어요', '다시 한번 눌러 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const cardText = birthText(draft.recorded ? draft : store.birth, store.profile?.babyName || '우리 아기');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Title>출생 카드</Title>
        <Text style={styles.lead}>세상에 온 날, 우리 집 첫 번째 공식 기록이에요.</Text>
        <Card style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>아기가 태어났어요</Text>
            <Text style={styles.switchBody}>켜면 오늘 화면이 태어난 지 며칠로 바뀌어요.</Text>
          </View>
          <Switch
            value={draft.recorded}
            onValueChange={(recorded) =>
              update({
                recorded,
                name: draft.name || store.profile?.babyName || '',
              })
            }
            trackColor={{ true: palette.accent, false: colors.line }}
          />
        </Card>
        <Card style={styles.form}>
          <TextField label="이름" value={draft.name} onChangeText={(name) => update({ name })} placeholder={store.profile?.babyName || '이름'} />
          <DateFields label="태어난 날" value={draft.birthDate} onChange={(birthDate) => update({ birthDate })} />
          <TimeFields label="태어난 시각" value={draft.birthTime} onChange={(birthTime) => update({ birthTime })} />
          <TextField label="몸무게 g" value={draft.weightG} onChangeText={(weightG) => update({ weightG: weightG.replace(/[^\d]/g, '').slice(0, 4) })} placeholder="3210" />
          <TextField label="키 cm" value={draft.heightCm} onChangeText={(heightCm) => update({ heightCm: heightCm.replace(/[^\d.]/g, '').slice(0, 5) })} placeholder="50.2" />
          <TextField label="병원" value={draft.hospital} onChangeText={(hospital) => update({ hospital })} placeholder="태어난 병원" />
          <TextField label="한 줄" value={draft.message} onChangeText={(message) => update({ message })} placeholder="오늘 우리 집에 왔어" multiline />
          <PrimaryButton label={saving ? '저장 중' : '출생 카드 저장'} onPress={() => void save()} disabled={saving} />
        </Card>
        <BirthCard record={draft.recorded ? { ...draft, birthDate: normalizeDate(draft.birthDate) } : store.birth} fallbackName={store.profile?.babyName || '우리 아기'} />
        <Pressable
          onPress={() => {
            void shareCard(cardText);
          }}
          style={styles.share}
        >
          <Text style={[styles.shareText, { color: palette.accentDark }]}>카드 문구 복사하기</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function BirthCard({ record, fallbackName }: { record: BirthRecord; fallbackName: string }) {
  const ready = record.recorded && parseISODate(record.birthDate);
  const palette = usePalette();
  return (
    <View style={[styles.cardFrame, { borderColor: palette.soft }]}>
      <Blob size={120} color={palette.soft} style={{ top: -40, left: -30 }} />
      <Blob size={90} color={colors.butter} style={{ bottom: -30, right: -20 }} />
      <Blob size={40} color={colors.mint} style={{ top: 30, right: 40 }} />
      <Bean size={70} sleepy={!ready} />
      <Text style={[styles.cardKicker, { color: palette.accent }]}>{ready ? '반가워, 우리 아기' : '곧 만나요'}</Text>
      <Text style={styles.cardName}>{record.name || fallbackName}</Text>
      {ready ? (
        <Text style={styles.cardDate}>
          {formatKoreanDate(normalizeDate(record.birthDate))}
          {record.birthTime ? ` ${normalizeTime(record.birthTime)}` : ''}
        </Text>
      ) : (
        <Text style={styles.cardDate}>태어난 날을 적으면 카드가 완성돼요</Text>
      )}
      {record.weightG || record.heightCm ? (
        <View style={styles.stats}>
          {record.weightG ? (
            <View style={[styles.stat, { backgroundColor: colors.sky }]}>
              <Text style={styles.statLabel}>몸무게</Text>
              <Text style={styles.statValue}>{Number(record.weightG).toLocaleString('ko-KR')}g</Text>
            </View>
          ) : null}
          {record.heightCm ? (
            <View style={[styles.stat, { backgroundColor: colors.mint }]}>
              <Text style={styles.statLabel}>키</Text>
              <Text style={styles.statValue}>{record.heightCm}cm</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {record.hospital ? <Text style={styles.hospital}>{record.hospital}</Text> : null}
      {record.message ? <Text style={styles.message}>“{record.message}”</Text> : null}
    </View>
  );
}

async function shareCard(message: string) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(message);
    Alert.alert('출생 카드 문구를 복사했어요', '카톡이나 메모에 붙여 넣을 수 있어요.');
    return;
  }
  await Share.share({ message });
}

function birthText(record: BirthRecord, fallbackName: string): string {
  const lines = ['아람 출생 기록', record.name || fallbackName];
  if (parseISODate(record.birthDate)) {
    lines.push(`${formatKoreanDate(normalizeDate(record.birthDate))}${record.birthTime ? ` ${normalizeTime(record.birthTime)}` : ''}`);
  }
  const stats = [record.weightG ? `${record.weightG}g` : '', record.heightCm ? `${record.heightCm}cm` : ''].filter(Boolean);
  if (stats.length) lines.push(stats.join(' · '));
  if (record.hospital) lines.push(record.hospital);
  if (record.message) lines.push(record.message);
  return lines.join('\n');
}

function validateBirth(record: BirthRecord): string | null {
  if (!record.recorded) return null;
  const date = parseISODate(record.birthDate);
  if (!date) return '태어난 날짜를 연, 월, 일 숫자로 적어 주세요.';
  if (daysBetween(date, new Date()) < 0) return '태어난 날짜는 오늘이거나 오늘보다 전이어야 해요.';
  if (record.birthTime) {
    const match = /^(\d{2}):(\d{2})$/.exec(record.birthTime);
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return '시각은 08:24처럼 적어 주세요.';
  }
  if (record.weightG && !/^\d{3,4}$/.test(record.weightG)) return '몸무게는 3210처럼 g 숫자만 적어 주세요.';
  if (record.heightCm && !/^\d{2}(\.\d)?$/.test(record.heightCm)) return '키는 50.2처럼 cm로 적어 주세요.';
  return null;
}

function normalizeDate(value: string): string {
  const [year = '', month = '', day = ''] = value.split('-');
  if (!year || !month || !day) return value;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function normalizeTime(value: string): string {
  const [hour = '', minute = ''] = value.split(':');
  if (!hour || !minute) return value;
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 24 },
  lead: { color: colors.muted, lineHeight: 22, fontSize: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.lavender, shadowOpacity: 0 },
  switchCopy: { flex: 1 },
  switchTitle: { fontFamily: fonts.cute, color: colors.ink, fontSize: 18 },
  switchBody: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  form: { gap: 14 },
  cardFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    borderWidth: 3,
    borderStyle: 'dashed',
    ...shadow,
  },
  cardKicker: { fontFamily: fonts.cute, fontSize: 16, marginTop: 6 },
  cardName: { fontSize: 40, lineHeight: 48, fontFamily: fonts.cute, color: colors.ink },
  cardDate: { color: colors.ink, fontSize: 16, fontFamily: fonts.cute },
  stats: { flexDirection: 'row', gap: 10, marginTop: 8 },
  stat: { borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10, alignItems: 'center', minWidth: 104 },
  statLabel: { color: colors.muted, fontSize: 13, fontFamily: fonts.cute },
  statValue: { color: colors.ink, fontSize: 22, fontFamily: fonts.cute },
  hospital: { color: colors.muted, marginTop: 4 },
  message: { color: colors.ink, fontSize: 19, lineHeight: 28, marginTop: 8, fontFamily: fonts.cute, textAlign: 'center' },
  share: { alignItems: 'center', paddingVertical: 8 },
  shareText: { fontFamily: fonts.cute, fontSize: 16 },
});
