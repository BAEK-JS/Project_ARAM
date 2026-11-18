import { daysBetween, parseISODate } from './pregnancy';
import type { Gender } from './theme';
import type { BirthRecord, GrowthRecord } from './types';

export type Reference = { cm: number; g: number };

export const FETAL_FIRST_WEEK = 8;
export const FETAL_LAST_WEEK = 40;
export const INFANT_LAST_MONTH = 12;

/** 주수별 평균 태아 크기. 20주 전은 머리~엉덩이 길이, 20주부터는 머리~발끝 길이. */
const FETAL: Record<number, Reference> = {
  8: { cm: 1.6, g: 1 },
  9: { cm: 2.3, g: 2 },
  10: { cm: 3.1, g: 4 },
  11: { cm: 4.1, g: 7 },
  12: { cm: 5.4, g: 14 },
  13: { cm: 7.4, g: 23 },
  14: { cm: 8.7, g: 43 },
  15: { cm: 10.1, g: 70 },
  16: { cm: 11.6, g: 100 },
  17: { cm: 13, g: 140 },
  18: { cm: 14.2, g: 190 },
  19: { cm: 15.3, g: 240 },
  20: { cm: 25.6, g: 300 },
  21: { cm: 26.7, g: 360 },
  22: { cm: 27.8, g: 430 },
  23: { cm: 28.9, g: 501 },
  24: { cm: 30, g: 600 },
  25: { cm: 34.6, g: 660 },
  26: { cm: 35.6, g: 760 },
  27: { cm: 36.6, g: 875 },
  28: { cm: 37.6, g: 1005 },
  29: { cm: 38.6, g: 1153 },
  30: { cm: 39.9, g: 1319 },
  31: { cm: 41.1, g: 1502 },
  32: { cm: 42.4, g: 1702 },
  33: { cm: 43.7, g: 1918 },
  34: { cm: 45, g: 2146 },
  35: { cm: 46.2, g: 2383 },
  36: { cm: 47.4, g: 2622 },
  37: { cm: 48.6, g: 2859 },
  38: { cm: 49.8, g: 3083 },
  39: { cm: 50.7, g: 3288 },
  40: { cm: 51.2, g: 3462 },
};

/** WHO 성장 기준 중앙값. [딸 kg, 딸 cm, 아들 kg, 아들 cm] */
const INFANT: [number, number, number, number][] = [
  [3.2, 49.1, 3.3, 49.9],
  [4.2, 53.7, 4.5, 54.7],
  [5.1, 57.1, 5.6, 58.4],
  [5.8, 59.8, 6.4, 61.4],
  [6.4, 62.1, 7.0, 63.9],
  [6.9, 64.0, 7.5, 65.9],
  [7.3, 65.7, 7.9, 67.6],
  [7.6, 67.3, 8.3, 69.2],
  [7.9, 68.7, 8.6, 70.6],
  [8.2, 70.1, 8.9, 72.0],
  [8.5, 71.5, 9.2, 73.3],
  [8.7, 72.8, 9.4, 74.5],
  [8.9, 74.0, 9.6, 75.7],
];

export function fetalReference(week: number): Reference {
  return FETAL[Math.min(FETAL_LAST_WEEK, Math.max(FETAL_FIRST_WEEK, week))];
}

export function infantReference(month: number, gender: Gender = 'unknown'): Reference {
  const [girlKg, girlCm, boyKg, boyCm] = INFANT[Math.min(INFANT_LAST_MONTH, Math.max(0, month))];
  if (gender === 'girl') return { g: girlKg * 1000, cm: girlCm };
  if (gender === 'boy') return { g: boyKg * 1000, cm: boyCm };
  return { g: ((girlKg + boyKg) / 2) * 1000, cm: Math.round(((girlCm + boyCm) / 2) * 10) / 10 };
}

export function weekAtDate(dueDate: string, date: string): number | null {
  const due = parseISODate(dueDate);
  const at = parseISODate(date);
  if (!due || !at) return null;
  return Math.floor((280 - daysBetween(at, due)) / 7);
}

export function monthAtDate(birthDate: string, date: string): number | null {
  const birth = parseISODate(birthDate);
  const at = parseISODate(date);
  if (!birth || !at) return null;
  const days = daysBetween(birth, at);
  if (days < 0) return null;
  return Math.floor(days / 30.4375);
}

export type PlacedRecord = GrowthRecord & { fromBirthCard?: boolean };

/** 기록을 뱃속(주수)과 태어난 뒤(개월)로 나눠 칸에 놓는다. 출생 카드 수치는 0개월에 넣는다. */
export function placeRecords(
  records: GrowthRecord[],
  dueDate: string,
  birth: BirthRecord,
): { prenatal: Map<number, PlacedRecord[]>; postnatal: Map<number, PlacedRecord[]> } {
  const prenatal = new Map<number, PlacedRecord[]>();
  const postnatal = new Map<number, PlacedRecord[]>();
  const push = (map: Map<number, PlacedRecord[]>, key: number, record: PlacedRecord) => {
    map.set(key, [...(map.get(key) ?? []), record]);
  };

  for (const record of records) {
    const month = birth.recorded ? monthAtDate(birth.birthDate, record.date) : null;
    if (month !== null) {
      push(postnatal, Math.min(INFANT_LAST_MONTH, month), record);
      continue;
    }
    const week = weekAtDate(dueDate, record.date);
    if (week === null) continue;
    push(prenatal, Math.min(FETAL_LAST_WEEK, Math.max(FETAL_FIRST_WEEK, week)), record);
  }

  if (birth.recorded && parseISODate(birth.birthDate)) {
    const weightG = Number(birth.weightG);
    const heightCm = Number(birth.heightCm);
    if (weightG > 0 || heightCm > 0) {
      push(postnatal, 0, {
        id: 'birth-card',
        date: birth.birthDate,
        weightG: weightG > 0 ? weightG : null,
        heightCm: heightCm > 0 ? heightCm : null,
        headCm: null,
        note: '출생 카드',
        createdAt: '',
        fromBirthCard: true,
      });
    }
  }

  for (const map of [prenatal, postnatal]) {
    for (const list of map.values()) list.sort((a, b) => a.date.localeCompare(b.date));
  }
  return { prenatal, postnatal };
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams >= 10000 ? 1 : 2).replace(/\.?0+$/, '')}kg`;
  return `${Math.round(grams)}g`;
}
