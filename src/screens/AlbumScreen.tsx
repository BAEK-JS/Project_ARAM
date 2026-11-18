import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';

import { gestationalAge } from '../pregnancy';
import { compressPhoto } from '../storage';
import { useAram } from '../store';
import type { MediaItem } from '../types';
import { usePalette } from '../palette';
import { colors, fonts, shadow } from '../theme';
import { Bean, PrimaryButton, SecondaryButton, Title } from '../ui';

export function AlbumScreen() {
  const { store, photos, addPhoto, addVideo, removeMedia, resolveVideo } = useAram();
  const palette = usePalette();
  const age = store.profile ? gestationalAge(store.profile.dueDate) : null;
  const [open, setOpen] = useState(false);
  const [week, setWeek] = useState(Math.min(42, Math.max(4, age?.week || 14)));
  const [afterBirth, setAfterBirth] = useState(Boolean(store.birth.recorded));
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const saveAsset = async (kind: 'photo' | 'video' | 'camera') => {
    if (busy) return;
    setBusy(true);
    try {
      const allowed = await ensurePermission(kind === 'camera' ? 'camera' : 'library');
      if (!allowed) return;
      const result =
        kind === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: kind === 'video' ? ['videos'] : ['images'],
              quality: kind === 'video' ? 1 : 0.8,
            });
      if (result.canceled) return;
      const asset = result.assets[0];
      const taggedWeek = afterBirth ? null : week;
      if (kind === 'video' || asset.type === 'video') {
        await addVideo({ sourceUri: asset.uri, fileSize: asset.fileSize, week: taggedWeek, caption: caption.trim() });
      } else {
        const dataUri = await compressPhoto(asset.uri);
        await addPhoto({ dataUri, week: taggedWeek, caption: caption.trim() });
      }
      setCaption('');
      setOpen(false);
    } catch (error) {
      Alert.alert('올리지 못했어요', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <View>
            <Title>앨범</Title>
            <Text style={styles.lead}>초음파와 사진을 주수별로 모아요.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="사진이나 영상 추가" onPress={() => setOpen(true)} style={[styles.add, { backgroundColor: palette.accent, borderBottomColor: palette.accentDark }]}>
            <Text style={styles.addText}>+ 추가</Text>
          </Pressable>
        </View>
        {store.media.length === 0 ? (
          <Pressable onPress={() => setOpen(true)} style={styles.empty}>
            <Bean size={72} color={colors.sky} />
            <Text style={styles.emptyTitle}>아직 앨범이 비어 있어요</Text>
            <Text style={styles.emptyBody}>병원에서 받은 초음파를 주수와 함께 넣어 보세요.</Text>
          </Pressable>
        ) : (
          <View style={styles.grid}>
            {store.media.map((item, index) => (
              <Pressable key={item.id} onPress={() => setSelected(item)} style={[styles.cell, { transform: [{ rotate: index % 2 ? '1.5deg' : '-1.5deg' }] }]}>
                {item.kind === 'photo' && photos[item.id] ? (
                  <Image source={{ uri: photos[item.id] }} style={styles.image} />
                ) : (
                  <View style={styles.videoCell}>
                    <Text style={styles.videoText}>{item.kind === 'video' ? '▶' : '사진'}</Text>
                  </View>
                )}
                <Text style={[styles.meta, { color: palette.accentDark }]}>{item.week ? `${item.week}주` : '출생 후'}</Text>
                {item.caption ? <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text> : null}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>기록 올리기</Text>
            <View style={styles.stepper}>
              <Pressable onPress={() => setWeek((value) => Math.max(4, value - 1))} style={styles.step}>
                <Text style={styles.stepText}>-</Text>
              </Pressable>
              <Text style={styles.weekLabel}>{afterBirth ? '출생 후' : `${week}주`}</Text>
              <Pressable onPress={() => setWeek((value) => Math.min(42, value + 1))} style={styles.step}>
                <Text style={styles.stepText}>+</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setAfterBirth((value) => !value)}>
              <Text style={[styles.toggle, { color: palette.accentDark }]}>{afterBirth ? '주수로 바꾸기' : '출생 후로 표시'}</Text>
            </Pressable>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="한 줄 메모"
              placeholderTextColor="#C9B6AB"
              style={styles.input}
            />
            <PrimaryButton label={busy ? '올리는 중' : '사진 올리기'} onPress={() => void saveAsset('photo')} disabled={busy} />
            <SecondaryButton label="영상 올리기" onPress={() => void saveAsset('video')} />
            <SecondaryButton label="카메라로 찍기" onPress={() => void saveAsset('camera')} />
            <Pressable onPress={() => setOpen(false)} style={styles.cancel}>
              <Text style={styles.cancelText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(selected)} animationType="fade" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            {selected ? (
              <>
                {selected.kind === 'photo' && photos[selected.id] ? (
                  <Image source={{ uri: photos[selected.id] }} style={styles.preview} />
                ) : selected.kind === 'video' ? (
                  <VideoPane mediaRef={selected.ref} resolveVideo={resolveVideo} />
                ) : (
                  <Text style={styles.emptyBody}>사진을 찾지 못했어요.</Text>
                )}
                <Text style={styles.sheetTitle}>{selected.week ? `${selected.week}주` : '출생 후'}</Text>
                {selected.caption ? <Text style={styles.captionFull}>{selected.caption}</Text> : null}
                <SecondaryButton
                  label="이 기록 지우기"
                  onPress={() => {
                    Alert.alert('기록을 지울까요?', '이 기기에서 사진이나 영상이 삭제돼요.', [
                      { text: '취소', style: 'cancel' },
                      {
                        text: '지우기',
                        style: 'destructive',
                        onPress: () => {
                          void removeMedia(selected.id);
                          setSelected(null);
                        },
                      },
                    ]);
                  }}
                />
                <Pressable onPress={() => setSelected(null)} style={styles.cancel}>
                  <Text style={styles.cancelText}>닫기</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function VideoPane({ mediaRef, resolveVideo }: { mediaRef: string; resolveVideo: (ref: string) => Promise<string | null> }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    let created = '';
    resolveVideo(mediaRef).then((next) => {
      if (!next) return;
      if (!alive) {
        if (next.startsWith('blob:')) URL.revokeObjectURL(next);
        return;
      }
      created = next.startsWith('blob:') ? next : '';
      setUri(next);
    });
    return () => {
      alive = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [mediaRef, resolveVideo]);
  if (!uri) return <Text style={styles.emptyBody}>영상을 불러오고 있어요.</Text>;
  return <Clip uri={uri} />;
}

function Clip({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });
  return <VideoView player={player} style={styles.preview} nativeControls contentFit="contain" />;
}

async function ensurePermission(kind: 'camera' | 'library'): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const permission = kind === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.granted) return true;
  Alert.alert('권한이 필요해요', '사진이나 영상을 남기려면 접근을 허용해 주세요.');
  return false;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 28 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  lead: { color: colors.muted, marginTop: 2, fontSize: 15 },
  add: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11, borderBottomWidth: 3 },
  addText: { color: '#FFFFFF', fontFamily: fonts.cute, fontSize: 16 },
  empty: { alignItems: 'center', gap: 8, borderRadius: 30, borderWidth: 1, borderColor: colors.hairline, paddingVertical: 32, paddingHorizontal: 20, backgroundColor: colors.card, ...shadow },
  emptyTitle: { fontFamily: fonts.cute, fontSize: 19, color: colors.ink, marginTop: 6 },
  emptyBody: { color: colors.muted, lineHeight: 21, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cell: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 8, paddingBottom: 12, ...shadow },
  image: { width: '100%', aspectRatio: 0.9, borderRadius: 14, backgroundColor: colors.bgDeep },
  videoCell: { width: '100%', aspectRatio: 0.9, borderRadius: 14, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' },
  videoText: { color: colors.ink, fontFamily: fonts.cute, fontSize: 28 },
  meta: { marginTop: 8, fontFamily: fonts.cute, fontSize: 15, textAlign: 'center' },
  caption: { color: colors.ink, marginTop: 2, textAlign: 'center', fontSize: 13 },
  captionFull: { color: colors.ink, fontSize: 16, lineHeight: 22 },
  backdrop: { flex: 1, backgroundColor: 'rgba(74,58,52,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 34, borderTopRightRadius: 34, padding: 22, gap: 12, maxHeight: '92%' },
  sheetTitle: { fontSize: 24, fontFamily: fonts.cute, color: colors.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 999, padding: 6 },
  step: { width: 48, height: 48, borderRadius: 999, backgroundColor: colors.butter, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 24, fontFamily: fonts.cute, color: colors.ink },
  weekLabel: { fontSize: 24, fontFamily: fonts.cute, color: colors.ink },
  toggle: { fontFamily: fonts.cute, fontSize: 15, textAlign: 'center' },
  input: { backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16, color: colors.ink },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.muted, fontFamily: fonts.cute, fontSize: 16 },
  preview: { width: '100%', height: 260, borderRadius: 22, backgroundColor: '#3A2E29' },
});
