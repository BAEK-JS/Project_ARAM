import type { Gender } from './theme';

export type Profile = {
  babyName: string;
  momName: string;
  dadName: string;
  dueDate: string;
  gender?: Gender;
};

export type BirthRecord = {
  recorded: boolean;
  name: string;
  birthDate: string;
  birthTime: string;
  weightG: string;
  heightCm: string;
  hospital: string;
  message: string;
};

export type MediaKind = 'photo' | 'video';

export type MediaItem = {
  id: string;
  kind: MediaKind;
  /** 사진: 저장 키. 영상: file:// 경로 또는 idb:아이디 */
  ref: string;
  week: number | null;
  caption: string;
  createdAt: string;
};

export type TimelineEvent = {
  id: string;
  title: string;
  date: string;
  note: string;
  createdAt: string;
};

export type GrowthRecord = {
  id: string;
  date: string;
  weightG: number | null;
  heightCm: number | null;
  headCm: number | null;
  note: string;
  createdAt: string;
};

export type Store = {
  profile: Profile | null;
  birth: BirthRecord;
  media: MediaItem[];
  events: TimelineEvent[];
  growth: GrowthRecord[];
  weekMemos: Record<string, string>;
};

export type BackupFile = {
  app: 'aram';
  version: 1;
  exportedAt: string;
  omittedVideos: number;
  store: Store;
  photos: Record<string, string>;
};
