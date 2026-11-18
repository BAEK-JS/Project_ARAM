import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { BackupFile, BirthRecord, GrowthRecord, MediaItem, Store } from './types';

const META_KEY = 'aram.meta.v1';
const PHOTO_PREFIX = 'aram.photo.';
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyBirth(): BirthRecord {
  return {
    recorded: false,
    name: '',
    birthDate: '',
    birthTime: '',
    weightG: '',
    heightCm: '',
    hospital: '',
    message: '',
  };
}

export function emptyStore(): Store {
  return {
    profile: null,
    birth: emptyBirth(),
    media: [],
    events: [],
    growth: [],
    weekMemos: {},
  };
}

function photoKey(id: string): string {
  return `${PHOTO_PREFIX}${id}`;
}

export async function loadMeta(): Promise<Store> {
  const raw = await AsyncStorage.getItem(META_KEY);
  if (!raw) return emptyStore();
  try {
    const parsed = sanitizeStore(JSON.parse(raw));
    return parsed ?? emptyStore();
  } catch {
    return emptyStore();
  }
}

export async function saveMeta(store: Store): Promise<void> {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(store));
}

export async function loadPhoto(id: string): Promise<string | null> {
  return AsyncStorage.getItem(photoKey(id));
}

export async function savePhoto(id: string, dataUri: string): Promise<void> {
  await AsyncStorage.setItem(photoKey(id), dataUri);
}

export async function deletePhoto(id: string): Promise<void> {
  await AsyncStorage.removeItem(photoKey(id));
}

export async function loadPhotos(ids: string[]): Promise<Record<string, string>> {
  const pairs = await Promise.all(
    ids.map(async (id) => {
      const uri = await loadPhoto(id);
      return [id, uri] as const;
    }),
  );
  return Object.fromEntries(pairs.filter((pair): pair is readonly [string, string] => Boolean(pair[1])));
}

export async function compressPhoto(uri: string): Promise<string> {
  const first = await manipulateAsync(uri, [{ resize: { width: 1280 } }], {
    compress: 0.68,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (first.base64 && first.base64.length < 900_000) {
    return `data:image/jpeg;base64,${first.base64}`;
  }
  const second = await manipulateAsync(first.uri || uri, [{ resize: { width: 960 } }], {
    compress: 0.5,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!second.base64) {
    throw new Error('사진을 줄이지 못했어요. 다른 사진으로 다시 올려 주세요.');
  }
  return `data:image/jpeg;base64,${second.base64}`;
}

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('aram-media', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('files')) {
        request.result.createObjectStore('files');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVideoBlob(id: string, blob: Blob): Promise<void> {
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadVideoObjectUrl(id: string): Promise<string | null> {
  if (typeof indexedDB === 'undefined') return null;
  const db = await openMediaDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const request = tx.objectStore('files').get(id);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function deleteVideoBlob(id: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function persistVideo(id: string, sourceUri: string, fileSize?: number): Promise<string> {
  if (fileSize && fileSize > MAX_VIDEO_BYTES) {
    throw new Error('80MB보다 큰 영상은 이 버전에 넣기 어려워요. 휴대폰에서 짧게 줄인 뒤 올려 주세요.');
  }

  if (Platform.OS === 'web') {
    const response = await fetch(sourceUri);
    const blob = await response.blob();
    if (blob.size > MAX_VIDEO_BYTES) {
      throw new Error('80MB보다 큰 영상은 이 버전에 넣기 어려워요.');
    }
    await saveVideoBlob(id, blob);
    return `idb:${id}`;
  }

  const root = FileSystem.documentDirectory;
  if (!root) {
    throw new Error('이 기기에는 영상 저장 공간이 없어요. 사진으로 남겨 주세요.');
  }
  const info = await FileSystem.getInfoAsync(sourceUri);
  if (info.exists && info.size && info.size > MAX_VIDEO_BYTES) {
    throw new Error('80MB보다 큰 영상은 이 버전에 넣기 어려워요.');
  }
  const directory = `${root}videos/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const destination = `${directory}${id}.mp4`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export async function deleteVideoRef(ref: string): Promise<void> {
  if (ref.startsWith('idb:')) {
    await deleteVideoBlob(ref.slice(4));
    return;
  }
  if (ref.startsWith('file:') || ref.includes('/videos/')) {
    await FileSystem.deleteAsync(ref, { idempotent: true });
  }
}

export async function resolveVideoUri(ref: string): Promise<string | null> {
  if (ref.startsWith('idb:')) return loadVideoObjectUrl(ref.slice(4));
  return ref;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function sanitizeStore(value: unknown): Store | null {
  if (!isRecord(value)) return null;
  const birthRaw = isRecord(value.birth) ? value.birth : null;
  if (!birthRaw) return null;
  const birth: BirthRecord = {
    recorded: Boolean(birthRaw.recorded),
    name: typeof birthRaw.name === 'string' ? birthRaw.name : '',
    birthDate: typeof birthRaw.birthDate === 'string' ? birthRaw.birthDate : '',
    birthTime: typeof birthRaw.birthTime === 'string' ? birthRaw.birthTime : '',
    weightG: typeof birthRaw.weightG === 'string' ? birthRaw.weightG : '',
    heightCm: typeof birthRaw.heightCm === 'string' ? birthRaw.heightCm : '',
    hospital: typeof birthRaw.hospital === 'string' ? birthRaw.hospital : '',
    message: typeof birthRaw.message === 'string' ? birthRaw.message : '',
  };

  let profile: Store['profile'] = null;
  if (isRecord(value.profile)) {
    const dueDate = typeof value.profile.dueDate === 'string' ? value.profile.dueDate : '';
    const babyName = typeof value.profile.babyName === 'string' ? value.profile.babyName : '';
    const momName = typeof value.profile.momName === 'string' ? value.profile.momName : '';
    const dadName = typeof value.profile.dadName === 'string' ? value.profile.dadName : '';
    const gender = value.profile.gender === 'girl' || value.profile.gender === 'boy' ? value.profile.gender : 'unknown';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null;
    profile = { dueDate, babyName, momName, dadName, gender };
  }

  const media = Array.isArray(value.media)
    ? value.media.flatMap((item): MediaItem[] => {
        if (!isRecord(item) || typeof item.id !== 'string') return [];
        const kind = item.kind === 'video' ? 'video' : item.kind === 'photo' ? 'photo' : null;
        if (!kind || typeof item.ref !== 'string') return [];
        return [
          {
            id: item.id,
            kind,
            ref: item.ref,
            week: typeof item.week === 'number' ? item.week : null,
            caption: typeof item.caption === 'string' ? item.caption : '',
            createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
          },
        ];
      })
    : [];

  const events = Array.isArray(value.events)
    ? value.events.flatMap((item) => {
        if (!isRecord(item) || typeof item.id !== 'string' || typeof item.title !== 'string') return [];
        if (typeof item.date !== 'string') return [];
        return [
          {
            id: item.id,
            title: item.title,
            date: item.date,
            note: typeof item.note === 'string' ? item.note : '',
            createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
          },
        ];
      })
    : [];

  const measure = (input: unknown) => (typeof input === 'number' && Number.isFinite(input) && input > 0 ? input : null);
  const growth = Array.isArray(value.growth)
    ? value.growth.flatMap((item): GrowthRecord[] => {
        if (!isRecord(item) || typeof item.id !== 'string' || typeof item.date !== 'string') return [];
        return [
          {
            id: item.id,
            date: item.date,
            weightG: measure(item.weightG),
            heightCm: measure(item.heightCm),
            headCm: measure(item.headCm),
            note: typeof item.note === 'string' ? item.note : '',
            createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
          },
        ];
      })
    : [];

  const weekMemos: Record<string, string> = {};
  if (isRecord(value.weekMemos)) {
    for (const [key, memo] of Object.entries(value.weekMemos)) {
      if (typeof memo === 'string') weekMemos[key] = memo;
    }
  }

  return { profile, birth, media, events, growth, weekMemos };
}

function decodeBase64(value: string): string {
  const normalized = value.replace(/^data:.*?;base64,/, '');
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function exportBackup(store: Store): Promise<string> {
  const photos: Record<string, string> = {};
  for (const item of store.media) {
    if (item.kind !== 'photo') continue;
    const data = await loadPhoto(item.id);
    if (data) photos[item.id] = data;
  }
  const omittedVideos = store.media.filter((item) => item.kind === 'video').length;
  const exportedStore: Store = {
    ...store,
    media: store.media.filter((item) => item.kind === 'photo'),
  };
  const payload: BackupFile = {
    app: 'aram',
    version: 1,
    exportedAt: new Date().toISOString(),
    omittedVideos,
    store: exportedStore,
    photos,
  };
  const json = JSON.stringify(payload);
  const stamp = new Date().toISOString().slice(0, 10);

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `aram-backup-${stamp}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    return videoMessage(omittedVideos, '백업 파일을 내려받았어요.');
  }

  const root = FileSystem.cacheDirectory;
  if (!root) throw new Error('백업 파일을 만들 임시 공간이 없어요.');
  const path = `${root}aram-backup-${stamp}.json`;
  await FileSystem.writeAsStringAsync(path, json);
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('이 기기에서는 파일 공유를 열 수 없어요.');
  await Sharing.shareAsync(path, {
    mimeType: 'application/json',
    dialogTitle: '아람 백업 보내기',
    UTI: 'public.json',
  });
  return videoMessage(omittedVideos, '백업 파일을 보냈어요.');
}

function videoMessage(count: number, base: string): string {
  if (count === 0) return `${base} 카톡으로 보내면 다른 폰에서도 글과 사진을 볼 수 있어요.`;
  return `${base} 영상 ${count}개는 용량 때문에 파일에 넣지 않았어요. 영상은 올린 기기에 남아요.`;
}

export async function pickBackup(): Promise<BackupFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    base64: false,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  let text = '';
  if (asset.base64) {
    text = decodeBase64(asset.base64);
  } else if (Platform.OS === 'web') {
    text = await (await fetch(asset.uri)).text();
  } else {
    text = await FileSystem.readAsStringAsync(asset.uri);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('백업 파일을 읽지 못했어요. 아람에서 만든 json 파일인지 확인해 주세요.');
  }
  if (!isRecord(parsed) || parsed.app !== 'aram' || parsed.version !== 1) {
    throw new Error('아람 백업 파일이 아니에요.');
  }
  const store = sanitizeStore(parsed.store);
  if (!store) throw new Error('백업 안의 기록이 비어 있거나 형식이 달라요.');
  const photos: Record<string, string> = {};
  if (isRecord(parsed.photos)) {
    for (const [id, uri] of Object.entries(parsed.photos)) {
      if (typeof uri === 'string' && uri.startsWith('data:image/')) photos[id] = uri;
    }
  }
  return {
    app: 'aram',
    version: 1,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    omittedVideos: typeof parsed.omittedVideos === 'number' ? parsed.omittedVideos : 0,
    store,
    photos,
  };
}

export async function applyBackup(current: Store, backup: BackupFile): Promise<Store> {
  const videos = current.media.filter((item) => item.kind === 'video');
  const photos = backup.store.media.filter((item) => item.kind === 'photo' && backup.photos[item.id]);
  const oldPhotoIds = current.media.filter((item) => item.kind === 'photo').map((item) => item.id);
  await AsyncStorage.multiRemove(oldPhotoIds.map(photoKey));
  await Promise.all(photos.map((item) => savePhoto(item.id, backup.photos[item.id])));
  const next: Store = {
    ...backup.store,
    media: [...photos, ...videos],
  };
  await saveMeta(next);
  return next;
}

export async function clearAll(store: Store): Promise<void> {
  const photoIds = store.media.filter((item) => item.kind === 'photo').map((item) => item.id);
  await AsyncStorage.multiRemove([META_KEY, ...photoIds.map(photoKey)]);
  await Promise.all(store.media.filter((item) => item.kind === 'video').map((item) => deleteVideoRef(item.ref)));
}
