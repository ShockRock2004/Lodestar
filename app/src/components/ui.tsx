import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { C, F } from '../theme';

export function Card({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderColor: C.line,
          borderWidth: 1,
          borderRadius: 20,
          padding: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Bar({
  pct,
  height = 6,
  track = '#17171b',
  fill = '#e2e2e2',
}: {
  pct: number;
  height?: number;
  track?: string;
  fill?: string;
}) {
  return (
    <View style={{ height, borderRadius: 99, backgroundColor: track, overflow: 'hidden' }}>
      <View
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height: '100%',
          borderRadius: 99,
          backgroundColor: fill,
        }}
      />
    </View>
  );
}

// Responsive multi-column layout. On phone (active=false) it stacks children with a
// vertical gap; on tablet (active=true) it lays them side-by-side as columns, sized by
// optional `weights`. Each child should be one column (a View wrapping that column's cards).
export function Cols({
  children,
  weights,
  gap = 14,
  active,
}: {
  children: React.ReactNode;
  weights?: number[];
  gap?: number;
  active: boolean;
}) {
  const arr = React.Children.toArray(children);
  if (!active) return <View style={{ gap }}>{arr}</View>;
  return (
    <View style={{ flexDirection: 'row', gap, alignItems: 'flex-start' }}>
      {arr.map((c, i) => (
        <View key={i} style={{ flex: weights?.[i] ?? 1 }}>
          {c}
        </View>
      ))}
    </View>
  );
}

export function Eyebrow({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Text
      style={[
        { fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Chip({
  children,
  tone,
  outline,
}: {
  children: React.ReactNode;
  tone?: 'easy' | 'med' | 'hard';
  outline?: boolean;
}) {
  const col = tone === 'easy' ? C.easy : tone === 'med' ? C.med : tone === 'hard' ? C.hard : C.ink2;
  if (outline) {
    return (
      <View style={{ borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3.5, borderWidth: 1, borderColor: `${col}80` }}>
        <Text style={{ fontFamily: F.b700, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: col }}>
          {children}
        </Text>
      </View>
    );
  }
  return (
    <View style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: tone ? `${col}26` : 'rgba(255,255,255,0.05)' }}>
      <Text style={{ fontFamily: F.b600, fontSize: 11.5, color: tone ? col : C.ink2 }}>{children}</Text>
    </View>
  );
}

type HapticKind = 'light' | 'medium' | 'select';
export function haptic(kind: HapticKind = 'light') {
  try {
    if (kind === 'select') Haptics.selectionAsync();
    else
      Haptics.impactAsync(
        kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
      );
  } catch {
    // haptics unavailable
  }
}

export function Tap({
  onPress,
  children,
  style,
  hitSlop,
  kind = 'light',
  disabled,
}: {
  onPress?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle> | ((s: { pressed: boolean }) => StyleProp<ViewStyle>);
  hitSlop?: number;
  kind?: HapticKind;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={() => {
        if (disabled) return;
        haptic(kind);
        onPress?.();
      }}
      style={style as any}
    >
      {children}
    </Pressable>
  );
}
