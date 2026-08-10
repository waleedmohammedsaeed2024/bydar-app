export const Palette = {
  bgTop: '#f3f5ee',
  bgBottom: '#e6ecdf',
  ink: '#1f3326',
  inkSoft: '#6a7a6e',
  green: '#2d5a3f',
  greenDk: '#1d3f2a',
  greenLt: '#a8c5a8',
  cardA: '#cfdcc6',
  cardB: '#86a37b',
  line: 'rgba(31,51,38,0.08)',
  lineStrong: 'rgba(31,51,38,0.22)',
  white: '#ffffff',
  surface: 'rgba(255,255,255,0.78)',
  surfaceSolid: '#ffffff',
  /** Flat fills used instead of drop shadows to separate layers. */
  tint: 'rgba(31,51,38,0.05)',
  tintStrong: 'rgba(31,51,38,0.09)',
  greenTint: 'rgba(45,90,63,0.10)',
  danger: '#8a3e3e',
  warn: '#8a4f0d',
};

/** Corner radii — one scale, no ad-hoc values. `pill` for fully rounded. */
export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

/** Spacing scale (4pt based); `screen` is the standard horizontal gutter. */
export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 30,
  screen: 22,
} as const;

/**
 * Flat look: layers are separated by hairlines and tinted fills rather than
 * drop shadows. Spread these instead of writing shadow* / elevation props.
 */
export const Flat = {
  hairline: { borderWidth: 1, borderColor: Palette.line },
  hairlineStrong: { borderWidth: 1, borderColor: Palette.lineStrong },
  card: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  cardSolid: {
    backgroundColor: Palette.surfaceSolid,
    borderWidth: 1,
    borderColor: Palette.line,
  },
} as const;

/** Press feedback — subtle and uniform across every tappable surface. */
export const Press = {
  opacity: 0.62,
  scale: 0.98,
} as const;

export const Fonts = {
  arabic: 'NotoSansArabic_400Regular',
  arabicMedium: 'NotoSansArabic_500Medium',
  arabicBold: 'NotoSansArabic_700Bold',
};

export const arDigits = (s: string | number): string => String(s);

export const arMonths = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];

export const arWeekdaysShort = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
