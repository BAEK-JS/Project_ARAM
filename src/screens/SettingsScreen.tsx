import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { dueDateInRange } from '../pregnancy';
import { useAram } from '../store';
import { colors, fonts, Gender } from '../theme';
import { Card, DateFields, GenderPicker, PrimaryButton, QuietButton, SecondaryButton, TextField, Title } from '../ui';

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const { store, saveProfile, exportCurrent, importCurrent, reset } = useAram();
  const profile = store.profile;
  const [babyName, setBabyName] = useState(profile?.babyName ?? '');
  const [momName, setMomName] = useState(profile?.momName ?? '');
  const [dadName, setDadName] = useState(profile?.dadName ?? '');
  const [dueDate, setDueDate] = useState(profile?.dueDate ?? '');
  const [busy, setBusy] = useState(false);
  const gender = profile?.gender ?? 'unknown';

  const changeGender = (next: Gender) => {
    if (!profile) return;
    saveProfile({ ...profile, gender: next }).catch(() => Alert.alert('저장하지 못했어요', '다시 한번 눌러 주세요.'));
  };

  const save = async () => {
    const normalized = normalizeDate(dueDate);
    const problem = dueDateInRange(normalized);
    if (problem) {
      Alert.alert('예정일을 확인해 주세요', problem);
      return;
    }
    setBusy(true);
    try {
      await saveProfile({
        babyName: babyName.trim() || '우리 아기',
        momName: momName.trim(),
        dadName: dadName.trim(),
        dueDate: normalized,
        gender,
      });
      Alert.alert('기본 정보를 저장했어요');
    } catch {
      Alert.alert('저장하지 못했어요', '다시 한번 눌러 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Title>설정</Title>
          <QuietButton label="닫기" onPress={onClose} />
        </View>
        <Card style={styles.block}>
          <Text style={styles.heading}>우리 집</Text>
          <TextField label="아기 이름" value={babyName} onChangeText={setBabyName} placeholder="우리 아기" />
          <TextField label="엄마 이름" value={momName} onChangeText={setMomName} />
          <TextField label="아빠 이름" value={dadName} onChangeText={setDadName} />
          <DateFields label="출산 예정일" value={dueDate} onChange={setDueDate} />
          <GenderPicker value={gender} onChange={changeGender} />
          <PrimaryButton label={busy ? '저장 중' : '기본 정보 저장'} onPress={() => void save()} disabled={busy} />
        </Card>
        <Card style={styles.block}>
          <Text style={styles.heading}>부부 백업</Text>
          <Text style={styles.body}>
            기록은 이 기기에만 있어요. 백업 파일을 만들면 글과 사진을 다른 폰으로 옮길 수 있어요. 영상은 용량이 커서 올린 기기에 남아요.
          </Text>
          <SecondaryButton
            label="백업 파일 만들기"
            onPress={() => {
              void exportCurrent()
                .then((message) => Alert.alert('백업', message))
                .catch((error: unknown) => Alert.alert('백업을 만들지 못했어요', error instanceof Error ? error.message : '다시 시도해 주세요.'));
            }}
          />
          <SecondaryButton
            label="백업 파일 가져오기"
            onPress={() => {
              Alert.alert('백업으로 글과 사진을 바꿀까요?', '이 기기에 있는 영상은 그대로 남아요.', [
                { text: '취소', style: 'cancel' },
                {
                  text: '가져오기',
                  onPress: () => {
                    void importCurrent()
                      .then((message) => {
                        if (message) Alert.alert('가져오기', message);
                      })
                      .catch((error: unknown) => Alert.alert('가져오지 못했어요', error instanceof Error ? error.message : '파일을 다시 확인해 주세요.'));
                  },
                },
              ]);
            }}
          />
        </Card>
        <Card>
          <Text style={styles.heading}>기록 지우기</Text>
          <Text style={styles.body}>연습으로 넣은 내용을 지우고 처음부터 다시 시작할 수 있어요.</Text>
          <QuietButton
            label="이 기기의 기록 전체 지우기"
            onPress={() => {
              Alert.alert('기록을 모두 지울까요?', '사진, 영상, 출생 카드가 이 기기에서 삭제돼요.', [
                { text: '취소', style: 'cancel' },
                { text: '모두 지우기', style: 'destructive', onPress: () => void reset().then(onClose) },
              ]);
            }}
          />
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
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  block: { gap: 14 },
  heading: { fontSize: 20, fontFamily: fonts.cute, color: colors.ink },
  body: { color: colors.muted, lineHeight: 22 },
});
