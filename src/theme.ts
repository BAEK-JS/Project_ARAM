export const colors = {
  bg: '#FFF9FC',
  bgDeep: '#F7EAF1',
  card: 'rgba(255,255,255,0.88)',
  cardSolid: '#FFFFFF',
  hairline: 'rgba(255,255,255,0.96)',
  field: '#FFF5F8',
  ink: '#4A3A42',
  muted: '#A08A96',
  line: '#F3E4EC',
  accent: '#E9826B',
  accentDark: '#C9604A',
  peach: '#FFE4EF',
  butter: '#FFF3C8',
  mint: '#D9F5E8',
  mintDark: '#4F8F70',
  sky: '#DCEEFF',
  lavender: '#EDE4FF',
  cheek: '#FFB4A6',
  sage: '#4F8F70',
  sageSoft: '#D9F5E8',
  blush: '#FFE4EF',
  gold: '#B48A3C',
};

export const gradients = {
  page: ['#FFFCFE', '#FFEAF3', '#FFF3E8', '#EAF7FF'] as const,
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
  page: readonly [string, string, string, string];
  hero: readonly [string, string, string];
  heroBorn: readonly [string, string, string];
  button: readonly [string, string];
  blobs: readonly [string, string, string];
  motifs: readonly [string, string, string, string];
  edge: string;
  ornament: 'sprout' | 'bow' | 'curl';
};

export const palettes: Record<Gender, Palette> = {
  unknown: {
    accent: '#E9826B',
    accentDark: '#C9604A',
    soft: '#FFE8DE',
    bean: '#FFF6F0',
    page: gradients.page,
    hero: gradients.hero,
    heroBorn: gradients.heroBorn,
    button: gradients.button,
    blobs: ['rgba(255,198,186,0.45)', 'rgba(186,220,255,0.42)', 'rgba(255,232,170,0.48)'],
    motifs: ['#FFB7C5', '#A8D8FF', '#FFE08A', '#C8F0D8'],
    edge: '#FFE8F2',
    ornament: 'sprout',
  },
  girl: {
    accent: '#EC7FA3',
    accentDark: '#C9557E',
    soft: '#FFE4EF',
    bean: '#FFF5F9',
    page: ['#FFFCFE', '#FFE8F2', '#FFF0F8', '#EAF7FF'] as const,
    hero: ['#EE89AC', '#F3A6C0', '#F8CDDB'],
    heroBorn: ['#E57FA6', '#EE9FC0', '#F6CFE0'],
    button: ['#F28FB1', '#E06A93'],
    blobs: ['rgba(255,182,214,0.48)', 'rgba(210,190,255,0.38)', 'rgba(255,220,170,0.42)'],
    motifs: ['#FF9EBF', '#FFD0E4', '#C9B6FF', '#FFE6A8'],
    edge: '#FFE4EF',
    ornament: 'bow',
  },
  boy: {
    accent: '#5E9BE0',
    accentDark: '#3F78BE',
    soft: '#E3F1FF',
    bean: '#F5FAFF',
    page: ['#FBFDFF', '#E8F4FF', '#F0F7FF', '#EAF8FF'] as const,
    hero: ['#6CA4E5', '#8DBBEE', '#BCD8F5'],
    heroBorn: ['#5E98DE', '#85B5EC', '#C0DBF6'],
    button: ['#74AEEA', '#4F8DD6'],
    blobs: ['rgba(158,206,255,0.48)', 'rgba(190,220,255,0.4)', 'rgba(186,236,220,0.4)'],
    motifs: ['#7EB8F5', '#B8DFFF', '#A8E8D8', '#FFE08A'],
    edge: '#E3F1FF',
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
