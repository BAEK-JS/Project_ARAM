export type GestationalAge = {
  week: number;
  day: number;
  totalDays: number;
  untilDue: number;
  beforeStart: boolean;
};

export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function toISODate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / 86400000);
}

export function formatKoreanDate(value: string): string {
  const date = parseISODate(value);
  if (!date) return value;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function gestationalAge(dueDate: string, today = new Date()): GestationalAge | null {
  const due = parseISODate(dueDate);
  if (!due) return null;
  const untilDue = daysBetween(today, due);
  const totalDays = 280 - untilDue;
  if (totalDays < 0) {
    return { week: 0, day: 0, totalDays, untilDue, beforeStart: true };
  }
  const week = Math.floor(totalDays / 7);
  const day = totalDays - week * 7;
  return { week, day, totalDays, untilDue, beforeStart: false };
}

export function trimesterLabel(week: number): string {
  if (week < 14) return '초기';
  if (week < 28) return '중기';
  return '후기';
}

export function ageFromBirth(birthDate: string, today = new Date()): { days: number; week: number; day: number } | null {
  const date = parseISODate(birthDate);
  if (!date) return null;
  const days = daysBetween(date, today);
  if (days < 0) return null;
  return { days, week: Math.floor(days / 7), day: days % 7 };
}

export type PostpartumStage = {
  id: string;
  label: string;
  title: string;
  baby: string;
  mom: string;
  dad: string;
  together: string;
};

const POSTPARTUM: { min: number; max: number; stage: PostpartumStage }[] = [
  {
    min: 0,
    max: 6,
    stage: {
      id: 'week0',
      label: '태어난 첫 일주일',
      title: '이름을 적는 주',
      baby: '체중이 잠깐 줄었다가 회복하는 아기가 많아요. 수유 간격은 퇴원 안내를 기준으로 보세요.',
      mom: '출혈과 통증은 퇴원 안내문과 비교해 보세요. 안내와 다르면 병원에 연락하세요.',
      dad: '식사, 물, 방문자 응대를 맡아 주세요. 아기를 안아 주는 시간도 이쪽 몫으로 두면 좋아요.',
      together: '출생 시간, 키, 몸무게를 출생 카드에 채워요.',
    },
  },
  {
    min: 7,
    max: 27,
    stage: {
      id: 'newborn',
      label: '신생아',
      title: '밤이 길어도 기록은 짧게',
      baby: '배꼽, 황달, 체중은 소아 진료에서 보는 항목이에요.',
      mom: '잠이 끊기면 낮에 역할을 바꿔, 한쪽이라도 연속으로 자 보세요.',
      dad: '밤 기저귀와 트림 중 하나를 고정 담당으로 가져가 보세요.',
      together: '첫 목욕이나 첫 외출을 타임라인에 남겨요.',
    },
  },
  {
    min: 28,
    max: 59,
    stage: {
      id: 'month1',
      label: '한 달 무렵',
      title: '한 달 사진',
      baby: '고개가 흔들리고 시선이 잠시 머무는 때가 있어요. 속도는 아기마다 달라요.',
      mom: '산후 검진 날짜를 달력에 고정해 두세요.',
      dad: '검진에 같이 가거나, 집에 남아 빨래와 설거지를 끝내는 쪽을 정하세요.',
      together: '한 달 사진은 주수 대신 출생 후로 올려요.',
    },
  },
  {
    min: 60,
    max: 119,
    stage: {
      id: 'month2',
      label: '두세 달',
      title: '미소와 외출',
      baby: '사람을 보고 웃는 시기를 지나요. 아직 없어도 다음 검진 때 이야기하면 돼요.',
      mom: '외출이 늘면 본인 물과 간식을 가방에 먼저 넣으세요.',
      dad: '유모차와 카시트에 실제로 태워 보고, 흔들리는 나사를 미리 조여 두세요.',
      together: '조부모와 나눌 돌봄 규칙을 한 장으로 적어요.',
    },
  },
  {
    min: 120,
    max: 179,
    stage: {
      id: 'month4',
      label: '네다섯 달',
      title: '뒤집기 전에 자리 비우기',
      baby: '뒤집기를 시도할 수 있어요. 침대와 소파 끝은 비워 두세요.',
      mom: '이유식 시작 시기는 소아 진료에서 정하세요.',
      dad: '낮잠 시간에는 집을 어둡고 조용하게 만드는 역할을 맡아 보세요.',
      together: '이유식 식기와 의자를 빌릴지 살지 정해요.',
    },
  },
  {
    min: 180,
    max: 364,
    stage: {
      id: 'half',
      label: '반년에서 돌 전',
      title: '돌까지의 기록',
      baby: '앉기, 기어 다니기, 붙잡고 서기가 겹쳐요. 못 하는 항목이 있어도 검진에서 보면 돼요.',
      mom: '낮과 밤이 바뀌면 저녁 루틴을 짧게 고정해 보세요.',
      dad: '모서리 보호대와 콘센트 마개를 주말에 설치해 두세요.',
      together: '돌 사진과 출생 카드를 나란히 보며 앨범을 정리해요.',
    },
  },
  {
    min: 365,
    max: 100000,
    stage: {
      id: 'year1',
      label: '돌 이후',
      title: '비교가 아니라 기억',
      baby: '걸음과 말의 속도는 정말 달라요. 이 기록은 비교용이 아니라 기억용이에요.',
      mom: '본인만의 시간을 일주일에 한 번이라도 달력에 넣으세요.',
      dad: '병원과 놀이 일정을 반복 일정으로 만들어 두세요.',
      together: '첫 1년 타임라인을 처음부터 한번 넘겨 봐요.',
    },
  },
];

export function postpartumStage(birthDate: string, today = new Date()): PostpartumStage | null {
  const age = ageFromBirth(birthDate, today);
  if (!age) return null;
  const found = POSTPARTUM.find((item) => age.days >= item.min && age.days <= item.max);
  return found?.stage ?? POSTPARTUM[POSTPARTUM.length - 1].stage;
}

export function memoKey(age: GestationalAge | null, birthRecorded: boolean, birthDate: string, today = new Date()): string {
  if (birthRecorded) {
    const stage = postpartumStage(birthDate, today);
    if (stage) return `post:${stage.id}`;
  }
  return `week:${Math.max(age?.week ?? 0, 0)}`;
}

/** 마지막 글자에 받침이 있으면 태명 뒤에 '이'를 붙인다. 아람 → 아람이, 하늘 → 하늘이, 콩이 → 콩이 */
export function withCuteI(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  const last = trimmed.charCodeAt(trimmed.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return trimmed;
  const hasBatchim = (last - 0xac00) % 28 !== 0;
  return hasBatchim ? `${trimmed}이` : trimmed;
}

export function dueDateInRange(dueDate: string, today = new Date()): string | null {
  const due = parseISODate(dueDate);
  if (!due) return '예정일은 2027-05-15처럼 숫자로 적어 주세요.';
  const until = daysBetween(today, due);
  if (until > 294) return '예정일이 너무 멀어요. 날짜를 다시 확인해 주세요.';
  if (until < -320) return '예정일이 너무 오래됐어요. 이미 태어났다면 출생 카드에 적어 주세요.';
  return null;
}
