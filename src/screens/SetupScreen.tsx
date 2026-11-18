import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { dueDateInRange } from '../pregnancy';
import { useAram } from '../store';
import { usePalette } from '../palette';
import { colors, fonts, Gender, shadow } from '../theme';
import { Bean, Card, DateFields, GenderPicker, PrimaryButton, TextField, Title } from '../ui';

export function SetupScreen({ gender, onGenderChange }: { gender: Gender; onGenderChange: (gender: Gender) => void }) {
  const { saveProfile } = useAram();
  const palette = usePalette();
  const [babyName, setBabyName] = useState('');
  const [momName, setMomName] = useState('');
  const [dadName, setDadName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const start = async () => {
    const normalized = normalizeDate(dueDate);
    const problem = dueDateInRange(normalized);
    if (problem) {
      Alert.alert('예정일을 확인해 주세요', problem);
      return;
    }
    setSaving(true);
    try {
      await saveProfile({
        babyName: babyName.trim() || '우리 아기',
        momName: momName.trim(),
        dadName: dadName.trim(),
        dueDate: normalized,
        gender,
      });
    } catch {
      Alert.alert('저장하지 못했어요', '다시 한번 눌러 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.halo}>
            <Bean size={92} />
          </View>
          <Text style={[styles.kicker, { color: palette.accent }]}>안녕, 반가워요</Text>
          <Title size={44}>아람</Title>
          <Text style={styles.lead}>우리 아기의 첫 1년을 둘이서 차곡차곡 모아 봐요. 기록은 이 기기에만 담겨요.</Text>
        </View>
        <Card style={styles.form}>
          <TextField label="아기 태명" value={babyName} onChangeText={setBabyName} placeholder="콩이, 복덩이..." />
          <TextField label="엄마 이름" value={momName} onChangeText={setMomName} placeholder="비워 두면 엄마" />
          <TextField label="아빠 이름" value={dadName} onChangeText={setDadName} placeholder="비워 두면 아빠" />
          <DateFields label="출산 예정일" value={dueDate} onChange={setDueDate} />
          <GenderPicker value={gender} onChange={onGenderChange} />
          <PrimaryButton label={saving ? '준비하는 중...' : '우리 기록 시작하기'} onPress={start} disabled={saving} />
        </Card>
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
  content: { padding: 22, gap: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingTop: 28, paddingBottom: 8, gap: 6 },
  halo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  kicker: { fontFamily: fonts.cute, fontSize: 17, marginTop: 10 },
  lead: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center', paddingHorizontal: 12 },
  form: { gap: 16 },
});
