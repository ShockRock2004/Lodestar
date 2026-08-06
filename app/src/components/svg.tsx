import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

export const TECH_LABEL: Record<string, string> = { html: 'HTML', css: 'CSS', javascript: 'JavaScript', git: 'Git', react: 'React', node: 'Node.js', express: 'Express', sql: 'SQL', code: 'Full Stack' };

export function TechLogo({ tech = 'code', size = 128 }: { tech?: string; size?: number }) {
  const g = 'url(#tgrad)';
  const marks: Record<string, React.ReactNode> = {
    html: <Path fill={g} d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z" />,
    css: <Path fill={g} d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414z" />,
    javascript: (
      <>
        <Rect x={3} y={3} width={18} height={18} rx={2.5} fill={g} />
        <SvgText x={12.2} y={16.4} textAnchor="middle" fontSize={8.4} fontWeight="800" fill="#0c0c0e">JS</SvgText>
      </>
    ),
    react: (
      <>
        <G fill="none" stroke={g} strokeWidth={1.25}>
          <Ellipse cx={12} cy={12} rx={10} ry={4.15} />
          <Ellipse cx={12} cy={12} rx={10} ry={4.15} transform="rotate(60 12 12)" />
          <Ellipse cx={12} cy={12} rx={10} ry={4.15} transform="rotate(120 12 12)" />
        </G>
        <Circle cx={12} cy={12} r={2.05} fill={g} />
      </>
    ),
    node: <Path fill={g} d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z" />,
    express: <Path fill={g} d="M24 18.588a1.529 1.529 0 01-1.895-.72l-3.45-4.771-.5-.667-4.003 5.444a1.466 1.466 0 01-1.802.708l5.158-6.92-4.798-6.251a1.595 1.595 0 011.9.666l3.576 4.83 3.596-4.81a1.435 1.435 0 011.788-.668L21.708 7.9l-2.522 3.283a.666.666 0 000 .994l4.804 6.412zM.002 11.576l.42-2.075c1.154-4.103 5.858-5.81 9.094-3.27 1.895 1.489 2.368 3.597 2.275 5.973H1.116C.943 16.447 4.005 19.009 7.92 17.7a4.078 4.078 0 002.582-2.876c.207-.666.548-.78 1.174-.588a5.417 5.417 0 01-2.589 3.957 6.272 6.272 0 01-7.306-.933 6.575 6.575 0 01-1.64-3.858c0-.235-.08-.455-.134-.666A88.33 88.33 0 010 11.577zm1.127-.286h9.654c-.06-3.076-2.001-5.258-4.59-5.278-2.882-.04-4.944 2.094-5.071 5.264z" />,
    git: (
      <>
        <Path fill="none" stroke={g} strokeWidth={1.5} strokeLinecap="round" d="M12 20V9M12 12l4.3-4.3" />
        <G fill={g}>
          <Circle cx={12} cy={8.3} r={2} />
          <Circle cx={12} cy={20} r={2} />
          <Circle cx={17} cy={5.6} r={2} />
        </G>
      </>
    ),
    sql: (
      <G fill={g}>
        <Ellipse cx={12} cy={5.6} rx={7} ry={2.6} />
        <Path d="M5 5.6v12.8c0 1.44 3.13 2.6 7 2.6s7-1.16 7-2.6V5.6c0 1.44-3.13 2.6-7 2.6s-7-1.16-7-2.6Z" fillOpacity={0.82} />
        <Ellipse cx={12} cy={12} rx={7} ry={2.4} fill="#0c0c0e" fillOpacity={0.28} />
      </G>
    ),
    code: (
      <G fill="none" stroke={g} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 3.2 3.3 8l8.7 4.8L20.7 8 12 3.2Z" />
        <Path d="M3.3 12l8.7 4.8L20.7 12" />
        <Path d="M3.3 16l8.7 4.8L20.7 16" />
      </G>
    ),
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="tgrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#5b5b5b" /><Stop offset="0.5" stopColor="#ededed" /><Stop offset="1" stopColor="#5b5b5b" />
        </LinearGradient>
      </Defs>
      {marks[tech] || marks.code}
    </Svg>
  );
}

export function LodestarMark({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="lsg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3b3b3b" />
          <Stop offset="0.28" stopColor="#8a8a8a" />
          <Stop offset="0.5" stopColor="#ffffff" />
          <Stop offset="0.72" stopColor="#8a8a8a" />
          <Stop offset="1" stopColor="#3b3b3b" />
        </LinearGradient>
      </Defs>
      <Path
        fill="url(#lsg)"
        d="M12 0C12.3 7.7 16.3 11.7 24 12C16.3 12.3 12.3 16.3 12 24C11.7 16.3 7.7 12.3 0 12C7.7 11.7 11.7 7.7 12 0Z"
      />
    </Svg>
  );
}

// Monochrome progress ring (mirrors web SmallRing).
export function Ring({
  pct,
  size = 92,
  stroke = 9,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (c * Math.max(0, Math.min(100, pct))) / 100;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Defs>
          <LinearGradient id="rgm" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#7a7a7a" />
            <Stop offset="1" stopColor="#f4f4f4" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#rgm)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}

export type Seg = { label: string; value: number; color: string };

// Difficulty donut (mirrors web Donut).
export function Donut({
  segments,
  size = 104,
  stroke = 13,
  children,
}: {
  segments: Seg[];
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sum = segments.reduce((a, s) => a + s.value, 0);
  let offset = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#1a1a1e" strokeWidth={stroke} fill="none" />
        {sum > 0 &&
          segments.map((s) => {
            if (!s.value) return null;
            const len = (s.value / sum) * c;
            const el = (
              <Circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={s.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
