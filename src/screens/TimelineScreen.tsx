import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatKoreanDate, parseISODate, toISODate } from '../pregnancy';
import { useAram } from '../store';
import { usePalette } from '../palette';
import { colors, fonts } from '../theme';
import { Bean, Card, DateFields, PrimaryButton, TextField, Title } from '../ui';

const DOTS = ['#F5C451', '#7BC4A0', '#8DB5E8', '#B79CE6'];

const PRESETS = ['첫 초음파', '심장 소리를 들었어요', '태동', '성별을 알았어요', '출산 가방', '출생', '첫 목욕', '첫 미소'];

export function TimelineScreen() {
  const { store, addEvent, removeEvent } = useAram();
  const palette = usePalette();
  const dots = [palette.accent, ...DOTS];
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toISODate(new Date()));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const events = [...store.events].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const save = async () => {
    const normalized = normalizeDate(date);
    if (!title.trim()) {
      Alert.alert('이름을 적어 주세요', '첫 초음파처럼 기억할 일의 이름을 넣어 주세요.');
      return;
    }
    if (!parseISODate(normalized)) {
      Alert.alert('날짜를 확인해 주세요', '연도, 월, 일을 모두 숫자로 적어 주세요.');
      return;
    }
    setSaving(true);
    try {
      await addEvent({ title: title.trim(), date: normalized, note: note.trim() });
      setTitle('');
      setNote('');
      setDate(toISODate(new Date()));
    } catch {
      Alert.alert('남기지 못했어요', '다시 한번 눌러 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Title>흐름</Title>
        <Text style={styles.lead}>처음 만난 날부터 첫 목욕까지, 우리만의 날들을 이어요.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
          {PRESETS.map((preset) => (
            <Pressable key={preset} accessibilityRole="button" accessibilityLabel={preset} onPress={() => setTitle(preset)} style={[styles.chip, title === preset && styles.chipOn]}>
              <Text style={[styles.chipText, title === preset && styles.chipTextOn]}>{preset}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Card style={styles.form}>
          <TextField label="무슨 일이었나요" value={title} onChangeText={setTitle} placeholder="첫 초음파" />
          <DateFields label="날짜" value={date} onChange={setDate} />
          <TextField label="메모" value={note} onChangeText={setNote} placeholder="한 줄이면 충분해요" multiline />
          <PrimaryButton label={saving ? '남기는 중' : '타임라인에 남기기'} onPress={() => void save()} disabled={saving} />
        </Card>
        {events.length === 0 ? (
          <View style={styles.empty}>
            <Bean size={56} color={colors.mint} />
            <Text style={styles.emptyTitle}>아직 쌓인 날이 없어요</Text>
            <Text style={styles.emptyBody}>위의 동그란 버튼을 누르면 제목이 채워져요.</Text>
          </View>
        ) : (
          events.map((event, index) => (
            <View key={event.id} style={styles.row}>
              <View style={styles.rail}>
                <View style={[styles.dot, { backgroundColor: dots[index % dots.length] }]} />
                {index < events.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <Card style={styles.event}>
                <Text style={[styles.date, { color: palette.accentDark }]}>{formatKoreanDate(event.date)}</Text>
                <Text style={styles.eventTitle}>{event.title}</Text>
                {event.note ? <Text style={styles.note}>{event.note}</Text> : null}
                <Pressable
                  onPress={() => {
                    Alert.alert('이 기록을 지울까요?', event.title, [
                      { text: '취소', style: 'cancel' },
                      { text: '지우기', style: 'destructive', onPress: () => void removeEvent(event.id) },
                    ]);
                  }}
                >
                  <Text style={styles.remove}>지우기</Text>
                </Pressable>
              </Card>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
  presets: { gap: 8, paddingVertical: 4 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#FFFFFF' },
  chipOn: { backgroundColor: colors.mint },
  chipText: { color: colors.muted, fontFamily: fonts.cute, fontSize: 15 },
  chipTextOn: { color: colors.mintDark },
  form: { gap: 14 },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 20 },
  emptyTitle: { fontFamily: fonts.cute, color: colors.ink, fontSize: 18, marginTop: 4 },
  emptyBody: { color: colors.muted },
  row: { flexDirection: 'row', gap: 12 },
  rail: { width: 22, alignItems: 'center' },
  dot: { width: 20, height: 20, borderRadius: 10, marginTop: 22, borderWidth: 4, borderColor: '#FFFFFF' },
  line: { width: 3, flex: 1, backgroundColor: colors.line, marginTop: 2, borderRadius: 2 },
  event: { flex: 1, gap: 4, marginBottom: 4 },
  date: { fontFamily: fonts.cute, fontSize: 14 },
  eventTitle: { fontSize: 20, fontFamily: fonts.cute, color: colors.ink },
  note: { color: colors.muted, lineHeight: 21 },
  remove: { color: '#C9B6AB', fontFamily: fonts.cute, marginTop: 6, fontSize: 14 },
});
