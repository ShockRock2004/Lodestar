import React from 'react';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type IP = { color?: string; size?: number; sw?: number };

// Gradient flame — mirrors the web FlameFire (streak indicator).
let _ffid = 0;
export function FlameFire({ size = 16 }: { size?: number }) {
  const gid = React.useMemo(() => `ff${++_ffid}`, []);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id={gid} x1="0.5" y1="1" x2="0.5" y2="0">
          <Stop offset="0" stopColor="#ff2d16" />
          <Stop offset="0.5" stopColor="#ff6a1e" />
          <Stop offset="1" stopColor="#ff9d1f" />
        </LinearGradient>
      </Defs>
      <Path
        fill={`url(#${gid})`}
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
      />
      <Path
        fill="#ffd23f"
        transform="translate(12 15.2) scale(0.5) translate(-12 -12)"
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
      />
    </Svg>
  );
}
const L = ({ children, color = '#fff', size = 18, sw = 1.9 }: IP & { children: React.ReactNode }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Svg>
);

export const IconHome = (p: IP) => (
  <L {...p}>
    <Path d="M4 11l8-7 8 7" />
    <Path d="M6 10v9h12v-9" />
  </L>
);
export const IconDsa = (p: IP) => (
  <L sw={1.8} {...p}>
    <Path d="M7 8l-4 4 4 4" />
    <Path d="M17 8l4 4-4 4" />
    <Path d="M14 4l-4 16" />
  </L>
);
export const IconCs = (p: IP) => (
  <L sw={1.8} {...p}>
    <Rect x="7" y="7" width="10" height="10" rx="1.5" />
    <Path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3" />
  </L>
);
export const IconSys = (p: IP) => (
  <L sw={1.8} {...p}>
    <Rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
    <Rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
    <Line x1="6" x2="6.01" y1="6" y2="6" />
    <Line x1="6" x2="6.01" y1="18" y2="18" />
  </L>
);
export const IconLld = (p: IP) => (
  <L sw={1.8} {...p}>
    <Rect x="9" y="3" width="6" height="4.4" rx="1" />
    <Rect x="3" y="14.6" width="6" height="4.4" rx="1" />
    <Rect x="15" y="14.6" width="6" height="4.4" rx="1" />
    <Path d="M12 7.4v3.4M6 14.6v-3.8h12v3.8" />
  </L>
);
export const IconMl = (p: IP) => (
  <L sw={1.7} {...p}>
    <Path d="M12 18V5" />
    <Path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
    <Path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
    <Path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
    <Path d="M18 18a4 4 0 0 0 2-7.464" />
    <Path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
    <Path d="M6 18a4 4 0 0 1-2-7.464" />
    <Path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
  </L>
);
export const IconStack = (p: IP) => (
  <L sw={1.7} {...p}>
    <Path d="M12 3.2 3.3 8l8.7 4.8L20.7 8 12 3.2Z" />
    <Path d="M3.3 12l8.7 4.8L20.7 12" />
    <Path d="M3.3 16l8.7 4.8L20.7 16" />
  </L>
);
export const IconSearch = (p: IP) => (
  <L {...p}>
    <Circle cx="11" cy="11" r="7" />
    <Path d="m20 20-3.2-3.2" />
  </L>
);
export const IconBack = (p: IP) => (
  <L sw={2.2} {...p}>
    <Path d="M15 6l-6 6 6 6" />
  </L>
);
export const IconChevron = (p: IP) => (
  <L sw={2.2} {...p}>
    <Path d="M9 6l6 6-6 6" />
  </L>
);
export const IconChevronDown = (p: IP) => (
  <L sw={2.2} {...p}>
    <Path d="M6 9l6 6 6-6" />
  </L>
);
export const IconTrash = (p: IP) => (
  <L {...p}>
    <Path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" />
  </L>
);
export const IconCheck = ({ color = '#0b0b0b', size = 14 }: IP) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M6 12l4 4 8-8" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
