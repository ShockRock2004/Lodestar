import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { C, F } from '../theme';
import { IconChevronDown } from './icons';
import { Modal } from './Modal';
import { Tap } from './ui';

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'center', backgroundColor: C.chip, borderColor: C.line, borderWidth: 1, borderRadius: 999, padding: 4, gap: 3 }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <Tap
            key={o.value}
            kind="select"
            onPress={() => onChange(o.value)}
            style={{ borderRadius: 999, paddingHorizontal: 15, paddingVertical: 8, backgroundColor: on ? '#f0f0f0' : 'transparent' }}
          >
            <Text style={{ fontFamily: F.d600, fontSize: 12.5, color: on ? '#0b0b0b' : C.ink2 }}>{o.label}</Text>
          </Tap>
        );
      })}
    </View>
  );
}

export function Dropdown({
  value,
  onChange,
  options,
  title = 'Select',
}: {
  value: any;
  onChange: (v: any) => void;
  options: { v: any; l: string }[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.v === value) || options[0];
  return (
    <>
      <Tap
        onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a', backgroundColor: '#101014' }}
      >
        <Text style={{ fontFamily: F.b500, fontSize: 13, color: '#eaeaea' }}>{cur ? cur.l : title}</Text>
        <IconChevronDown color="#7a7a7a" size={16} sw={2} />
      </Tap>
      <Modal open={open} onClose={() => setOpen(false)} title={title} maxWidth={360}>
        <View style={{ gap: 2 }}>
          {options.map((o) => {
            const on = o.v === value;
            return (
              <Tap
                key={String(o.v)}
                onPress={() => { onChange(o.v); setOpen(false); }}
                style={{ paddingHorizontal: 11, paddingVertical: 11, borderRadius: 9, backgroundColor: on ? '#20202a' : 'transparent' }}
              >
                <Text style={{ fontFamily: on ? F.b600 : F.b500, fontSize: 13.5, color: on ? '#fff' : '#c2c2c2' }}>{o.l}</Text>
              </Tap>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

export function Stepper({ value, onDec, onInc }: { value: number; onDec: () => void; onInc: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontFamily: F.b600, fontSize: 11, color: C.ink3 }}>Attempts</Text>
      <Tap kind="select" onPress={onDec} style={{ width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.ink, fontSize: 16 }}>−</Text>
      </Tap>
      <Text style={{ fontFamily: F.d700, fontSize: 14, color: C.ink, minWidth: 16, textAlign: 'center' }}>{value || 0}</Text>
      <Tap kind="select" onPress={onInc} style={{ width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.ink, fontSize: 16 }}>+</Text>
      </Tap>
    </View>
  );
}

export function Check({ done, onPress, size = 22 }: { done: boolean; onPress: () => void; size?: number }) {
  return (
    <Tap
      kind="light"
      onPress={onPress}
      hitSlop={10}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: done ? '#e6e6e6' : '#3f3f3f',
        backgroundColor: done ? '#e6e6e6' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {done ? <Text style={{ color: '#0b0b0b', fontSize: size * 0.6, fontWeight: '900', lineHeight: size * 0.9 }}>✓</Text> : null}
    </Tap>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Tap kind="select" onPress={() => onChange(!value)}>
      <View style={{ width: 44, height: 26, borderRadius: 999, padding: 3, backgroundColor: value ? '#e6e6e6' : '#2a2a2a', alignItems: value ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: value ? '#0b0b0b' : '#8a8a8a' }} />
      </View>
    </Tap>
  );
}
