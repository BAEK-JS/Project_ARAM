import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

import {
  applyBackup,
  clearAll,
  compressPhoto,
  createId,
  deletePhoto,
  deleteVideoRef,
  emptyStore,
  exportBackup,
  loadMeta,
  loadPhotos,
  persistVideo,
  pickBackup,
  resolveVideoUri,
  saveMeta,
  savePhoto,
} from './storage';
import type { BirthRecord, GrowthRecord, MediaItem, Profile, Store, TimelineEvent } from './types';

type AramContextValue = {
  store: Store;
  photos: Record<string, string>;
  ready: boolean;
  error: string;
  saveProfile: (profile: Profile) => Promise<void>;
  saveBirth: (birth: BirthRecord) => Promise<void>;
  saveMemo: (key: string, value: string) => Promise<void>;
  addEvent: (event: Omit<TimelineEvent, 'id' | 'createdAt'>) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  addGrowth: (record: Omit<GrowthRecord, 'id' | 'createdAt'>) => Promise<void>;
  removeGrowth: (id: string) => Promise<void>;
  addPhoto: (input: { dataUri: string; week: number | null; caption: string }) => Promise<void>;
  addVideo: (input: { sourceUri: string; fileSize?: number; week: number | null; caption: string }) => Promise<void>;
  removeMedia: (id: string) => Promise<void>;
  exportCurrent: () => Promise<string>;
  importCurrent: () => Promise<string | null>;
  reset: () => Promise<void>;
  resolveVideo: (ref: string) => Promise<string | null>;
};

const AramContext = createContext<AramContextValue | null>(null);

export function AramProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(emptyStore());
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const storeRef = useRef(store);

  useEffect(() => {
    let alive = true;
    loadMeta()
      .then(async (loaded) => {
        const photoMap = await loadPhotos(loaded.media.filter((item) => item.kind === 'photo').map((item) => item.id));
        if (!alive) return;
        storeRef.current = loaded;
        setStore(loaded);
        setPhotos(photoMap);
        setReady(true);
      })
      .catch(() => {
        if (!alive) return;
        setError('저장된 기록을 열지 못했어요.');
        setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const commit = async (next: Store) => {
    storeRef.current = next;
    setStore(next);
    await saveMeta(next);
  };

  const value: AramContextValue = {
    store,
    photos,
    ready,
    error,
    saveProfile: async (profile) => {
      await commit({ ...storeRef.current, profile });
    },
    saveBirth: async (birth) => {
      await commit({ ...storeRef.current, birth });
    },
    saveMemo: async (key, memo) => {
      await commit({
        ...storeRef.current,
        weekMemos: { ...storeRef.current.weekMemos, [key]: memo },
      });
    },
    addEvent: async (event) => {
      const nextEvent: TimelineEvent = { ...event, id: createId(), createdAt: new Date().toISOString() };
      await commit({ ...storeRef.current, events: [nextEvent, ...storeRef.current.events] });
    },
    removeEvent: async (id) => {
      await commit({ ...storeRef.current, events: storeRef.current.events.filter((event) => event.id !== id) });
    },
    addGrowth: async (record) => {
      const next: GrowthRecord = { ...record, id: createId(), createdAt: new Date().toISOString() };
      await commit({ ...storeRef.current, growth: [next, ...storeRef.current.growth] });
    },
    removeGrowth: async (id) => {
      await commit({ ...storeRef.current, growth: storeRef.current.growth.filter((record) => record.id !== id) });
    },
    addPhoto: async ({ dataUri, week, caption }) => {
      const id = createId();
      const compressed = dataUri.startsWith('data:image/') ? dataUri : await compressPhoto(dataUri);
      await savePhoto(id, compressed);
      const item: MediaItem = {
        id,
        kind: 'photo',
        ref: id,
        week,
        caption,
        createdAt: new Date().toISOString(),
      };
      setPhotos((current) => ({ ...current, [id]: compressed }));
      try {
        await commit({ ...storeRef.current, media: [item, ...storeRef.current.media] });
      } catch (error) {
        await deletePhoto(id);
        setPhotos((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        throw error;
      }
    },
    addVideo: async ({ sourceUri, fileSize, week, caption }) => {
      const id = createId();
      const ref = await persistVideo(id, sourceUri, fileSize);
      const item: MediaItem = {
        id,
        kind: 'video',
        ref,
        week,
        caption,
        createdAt: new Date().toISOString(),
      };
      try {
        await commit({ ...storeRef.current, media: [item, ...storeRef.current.media] });
      } catch (error) {
        await deleteVideoRef(ref);
        throw error;
      }
    },
    removeMedia: async (id) => {
      const item = storeRef.current.media.find((media) => media.id === id);
      if (!item) return;
      if (item.kind === 'photo') await deletePhoto(id);
      if (item.kind === 'video') await deleteVideoRef(item.ref);
      setPhotos((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await commit({ ...storeRef.current, media: storeRef.current.media.filter((media) => media.id !== id) });
    },
    exportCurrent: () => exportBackup(storeRef.current),
    importCurrent: async () => {
      const backup = await pickBackup();
      if (!backup) return null;
      const next = await applyBackup(storeRef.current, backup);
      const photoMap = await loadPhotos(next.media.filter((item) => item.kind === 'photo').map((item) => item.id));
      storeRef.current = next;
      setStore(next);
      setPhotos(photoMap);
      return '백업을 가져왔어요. 이 기기의 영상은 그대로 두었어요.';
    },
    reset: async () => {
      await clearAll(storeRef.current);
      const fresh = emptyStore();
      storeRef.current = fresh;
      setStore(fresh);
      setPhotos({});
    },
    resolveVideo: resolveVideoUri,
  };

  return <AramContext.Provider value={value}>{children}</AramContext.Provider>;
}

export function useAram(): AramContextValue {
  const value = useContext(AramContext);
  if (!value) throw new Error('아람 기록이 아직 준비되지 않았어요.');
  return value;
}
