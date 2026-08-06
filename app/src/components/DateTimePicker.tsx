import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { C, F } from '../theme';
import { CalendarCard } from './CalendarCard';
import { Segmented } from './controls';
import { Modal } from './Modal';
import { Tap } from './ui';

const pad = (n: number) => String(n).padStart(2, '0');

export function DateTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const parsed = value ? new Date(value) : null;
  const initH = parsed ? parsed.getHours() : 20;
  const [sel, setSel] = useState<string | null>(parsed ? value.slice(0, 10) : null);
  const [hour, setHour] = useState(((initH + 11) % 12) + 1);
  const [minute, setMinute] = useState(parsed ? parsed.getMinutes() : 0);
  const [ampm, setAmpm] = useState(initH >= 12 ? 'PM' : 'AM');

  const emit = (s: string | null, h: number, mi: number, ap: string) => {
    if (!s) return;
    const h24 = ap === 'PM' ? (h % 12) + 12 : h % 12;
    onChange(`${s}T${pad(h24)}:${pad(mi)}`);
  };
  const label = value
    ? `${new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : 'Pick date & time';

  const unit = (v: number, set: (fn: (x: number) => number) => void, step: number, mod: number, onAfter: (n: number) => void) => (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Tap kind="select" onPress={() => set((x) => { const n = ((x - 1 + step + mod) % mod) + 1; onAfter(n); return n; })}><Text style={{ color: C.ink2, fontSize: 14 }}>▲</Text></Tap>
      <Text style={{ fontFamily: F.d700, fontSize: 22, color: C.ink, fontVariant: ['tabular-nums'] }}>{pad(v)}</Text>
      <Tap kind="select" onPress={() => set((x) => { const n = ((x - 1 - step + mod) % mod) + 1; onAfter(n); return n; })}><Text style={{ color: C.ink2, fontSize: 14 }}>▼</Text></Tap>
    </View>
  );

  return (
    <>
      <Tap
        onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a', backgroundColor: '#101014' }}
      >
        <Text style={{ fontFamily: F.b500, fontSize: 13, color: value ? '#eaeaea' : '#8a8a8a' }}>{label}</Text>
        <Text style={{ color: '#7a7a7a', fontSize: 14 }}>▾</Text>
      </Tap>
      <Modal open={open} onClose={() => setOpen(false)} title="Pick date & time" maxWidth={380}>
        <CalendarCard
          markedDates={sel ? new Set([sel]) : new Set()}
          onPick={(iso) => { setSel(iso); emit(iso, hour, minute, ampm); }}
          onPickHighlight={sel}
        />
        <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          {unit(hour, setHour as any, 1, 12, (n) => emit(sel, n, minute, ampm))}
          <Text style={{ fontFamily: F.d700, fontSize: 22, color: C.ink3 }}>:</Text>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Tap kind="select" onPress={() => setMinute((x) => { const n = (x + 5) % 60; emit(sel, hour, n, ampm); return n; })}><Text style={{ color: C.ink2, fontSize: 14 }}>▲</Text></Tap>
            <Text style={{ fontFamily: F.d700, fontSize: 22, color: C.ink, fontVariant: ['tabular-nums'] }}>{pad(minute)}</Text>
            <Tap kind="select" onPress={() => setMinute((x) => { const n = (x + 55) % 60; emit(sel, hour, n, ampm); return n; })}><Text style={{ color: C.ink2, fontSize: 14 }}>▼</Text></Tap>
          </View>
          <View style={{ marginLeft: 6 }}>
            <Segmented value={ampm} onChange={(v) => { setAmpm(v); emit(sel, hour, minute, v); }} options={[{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }]} />
          </View>
        </View>
        <Tap kind="medium" onPress={() => setOpen(false)} style={{ marginTop: 16, backgroundColor: '#f0f0f0', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.d700, fontSize: 14, color: '#0b0b0b' }}>Done</Text>
        </Tap>
      </Modal>
    </>
  );
}
