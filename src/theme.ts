export const colors = {
  bg: '#FBF6F1',
  bgDeep: '#F1E6DC',
  card: 'rgba(255,255,255,0.86)',
  cardSolid: '#FFFFFF',
  hairline: 'rgba(255,255,255,0.95)',
  field: '#F7F0EA',
  ink: '#3B2E2A',
  muted: '#9A887E',
  line: '#EFE2D8',
  accent: '#E9826B',
  accentDark: '#C9604A',
  peach: '#FDE4DA',
  butter: '#FCF0CF',
  mint: '#E1F1E7',
  mintDark: '#4F8F70',
  sky: '#E3ECF8',
  lavender: '#ECE6F7',
  cheek: '#FFB4A6',
  sage: '#4F8F70',
  sageSoft: '#E1F1E7',
  blush: '#FDE4DA',
  gold: '#B48A3C',
};

export const gradients = {
  page: ['#FFF9F4', '#FBEDE6', '#F2ECF7'] as const,
  hero: ['#F4A08A', '#F2B49B', '#F6D0BC'] as const,
  heroBorn: ['#B9A3E3', '#D3B8E6', '#F2CDD8'] as const,
  button: ['#F09178', '#E2735C'] as const,
};

export type Gender = 'girl' | 'boy' | 'unknown';

export type Palette = {
  accent: string;
  accentDark: string;
  soft: string;
  bean: string;
  page: readonly [string, string, string];
  hero: readonly [string, string, string];
  heroBorn: readonly [string, string, string];
  button: readonly [string, string];
  blobs: readonly [string, string, string];
  edge: string;
  ornament: 'sprout' | 'bow' | 'curl';
};

export const palettes: Record<Gender, Palette> = {
  unknown: {
    accent: '#E9826B',
    accentDark: '#C9604A',
    soft: '#FDE4DA',
    bean: '#FFF3EC',
    page: gradients.page,
    hero: gradients.hero,
    heroBorn: gradients.heroBorn,
    button: gradients.button,
    blobs: ['rgba(255,206,186,0.35)', 'rgba(214,200,240,0.35)', 'rgba(255,236,196,0.4)'],
    edge: '#EFE4DC',
    ornament: 'sprout',
  },
  girl: {
    accent: '#EC7FA3',
    accentDark: '#C9557E',
    soft: '#FCE1EA',
    bean: '#FFF1F5',
    page: ['#FFF8FA', '#FCEAF0', '#F5E9F6'],
    hero: ['#EE89AC', '#F3A6C0', '#F8CDDB'],
    heroBorn: ['#E57FA6', '#EE9FC0', '#F6CFE0'],
    button: ['#F28FB1', '#E06A93'],
    blobs: ['rgba(255,186,210,0.38)', 'rgba(230,205,240,0.35)', 'rgba(255,222,232,0.45)'],
    edge: '#F2E2E8',
    ornament: 'bow',
  },
  boy: {
    accent: '#5E9BE0',
    accentDark: '#3F78BE',
    soft: '#DFEBFA',
    bean: '#F1F7FF',
    page: ['#F6FAFF', '#E8F1FC', '#EAEFFA'],
    hero: ['#6CA4E5', '#8DBBEE', '#BCD8F5'],
    heroBorn: ['#5E98DE', '#85B5EC', '#C0DBF6'],
    button: ['#74AEEA', '#4F8DD6'],
    blobs: ['rgba(165,202,245,0.38)', 'rgba(200,210,245,0.35)', 'rgba(212,234,250,0.45)'],
    edge: '#E2E9F2',
    ornament: 'curl',
  },
};

export const fonts = {
  cute: 'Jua_400Regular',
};

export const radius = {
  card: 26,
  pill: 999,
  field: 16,
};

export const shadow = {
  shadowColor: '#8A5A48',
  shadowOpacity: 0.08,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
  elevation: 2,
};
