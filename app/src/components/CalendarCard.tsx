import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { todayISO } from '../lib/store';
import { C, F } from '../theme';
import { IconChevron } from './icons';
import { Card, Tap } from './ui';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const pad = (n: number) => String(n).padStart(2, '0');

const HEAT_BG = ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.32)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.82)'];
const HEAT_TX = ['#e8e8e8', '#f2f2f2', '#fbfbfb', '#0c0c0e', '#0b0b0b'];

export function CalendarCard({
  markedDates,
  heatLevels,
  onPick,
  title,
  subtitle,
  legend,
}: {
  markedDates?: Set<string>;
  heatLevels?: Record<string, number>;
  onPick: (iso: string) => void;
  title?: string;
  subtitle?: string;
  legend?: boolean;
}) {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const first = new Date(ym.y, ym.m, 1);
  const startDow = first.getDay();
  const dim = new Date(ym.y, ym.m + 1, 0).getDate();
  const iso = (d: number) => `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const nav = (delta: number) =>
    setYm((p) => {
      let m = p.m + delta,
        y = p.y;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { y, m };
    });
  const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card style={{ padding: 22 }}>
      {title ? <Text style={{ fontFamily: F.d800, fontSize: 15, color: '#e8e8e8', marginBottom: 12 }}>{title}</Text> : null}
      {subtitle ? <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.ink3, marginTop: -6, marginBottom: 12 }}>{subtitle}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Tap kind="select" onPress={() => nav(-1)} hitSlop={8} style={{ width: 30, height: 30, borderRadius: 10, borderWidth: 1, borderColor: '#262626', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ transform: [{ rotate: '180deg' }] }}><IconChevron color="#cacaca" size={16} sw={2.4} /></View>
        </Tap>
        <Text style={{ fontFamily: F.d700, fontSize: 13.5, color: C.ink }}>{monthLabel}</Text>
        <Tap kind="select" onPress={() => nav(1)} hitSlop={8} style={{ width: 30, height: 30, borderRadius: 10, borderWidth: 1, borderColor: '#262626', alignItems: 'center', justifyContent: 'center' }}>
          <IconChevron color="#cacaca" size={16} sw={2.4} />
        </Tap>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {DOW.map((d, i) => (
          <View key={'h' + i} style={{ width: `${100 / 7}%`, height: 22, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.b500, fontSize: 10.5, color: C.ink3 }}>{d}</Text>
          </View>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          const day = iso(d);
          const isToday = day === todayISO();
          let bg = 'transparent';
          let tx = C.ink2;
          let lvl = 0;
          if (heatLevels) {
            lvl = Math.min(5, heatLevels[day] || 0);
            if (lvl > 0) { bg = HEAT_BG[lvl - 1]; tx = HEAT_TX[lvl - 1]; }
          } else if (markedDates && markedDates.has(day)) {
            bg = 'rgba(255,255,255,0.10)';
            tx = '#fafafa';
          }
          return (
            <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 1.5 }}>
              <Tap
                kind="select"
                onPress={() => onPick(day)}
                style={{
                  flex: 1,
                  borderRadius: 9,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: bg,
                  borderWidth: isToday ? 1 : 0,
                  borderColor: '#4d4d4d',
                }}
              >
                <Text style={{ fontFamily: F.b500, fontSize: 12, color: isToday ? '#fff' : tx }}>{d}</Text>
              </Tap>
            </View>
          );
        })}
      </View>
      {legend ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }}>
          <Text style={{ fontFamily: F.b500, fontSize: 10.5, color: C.ink4 }}>Less</Text>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            <View style={{ width: 13, height: 13, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: '#242424' }} />
            {HEAT_BG.map((bg, i) => (
              <View key={i} style={{ width: 13, height: 13, borderRadius: 3, backgroundColor: bg }} />
            ))}
          </View>
          <Text style={{ fontFamily: F.b500, fontSize: 10.5, color: C.ink4 }}>More</Text>
        </View>
      ) : null}
    </Card>
  );
}
