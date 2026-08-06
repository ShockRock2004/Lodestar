// Design tokens ported from the web app's CryptGen theme.
export const C = {
  bg: '#050506',
  bg2: '#0a0a0d',
  card: '#0f0f13',
  cardHi: '#141419',
  chip: '#131317',
  line: '#242424',
  line2: '#1c1c1c',
  line3: '#161616',
  ink: '#ededed',
  ink2: '#a1a1a1',
  ink3: '#7a7a7a',
  ink4: '#6f6f6f',
  white: '#ffffff',
  easy: '#00b8a3',
  med: '#ffc01e',
  hard: '#ff375f',
  danger: '#ff375f',
  flame: '#ff7d29',
};

// Signature metallic silver gradient (the "cgLogoGrad") + the ring gradient.
export const SILVER = ['#3b3b3b', '#8a8a8a', '#ffffff', '#8a8a8a', '#3b3b3b'];
export const SILVER_OFF = [0, 0.28, 0.5, 0.72, 1];
export const RINGMONO = ['#7a7a7a', '#f4f4f4'];
export const BAR = ['#9a9a9a', '#eaeaea'];

export const DIFF_COLOR: Record<string, string> = { Easy: C.easy, Medium: C.med, Hard: C.hard };
export const diffTone = (d?: string) => (d === 'Hard' ? 'hard' : d === 'Easy' ? 'easy' : 'med');

// Font families (loaded via @expo-google-fonts). d = display (Plus Jakarta Sans), b = body (Inter).
export const F = {
  d600: 'PlusJakartaSans_600SemiBold',
  d700: 'PlusJakartaSans_700Bold',
  d800: 'PlusJakartaSans_800ExtraBold',
  b400: 'Inter_400Regular',
  b500: 'Inter_500Medium',
  b600: 'Inter_600SemiBold',
  b700: 'Inter_700Bold',
  b800: 'Inter_800ExtraBold',
};

export const R = { sm: 10, md: 14, lg: 18, xl: 20, xxl: 22, pill: 999 };
