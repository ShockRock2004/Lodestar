import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Text, TextInput, View } from 'react-native';
import { IconBack, IconChevron } from '../components/icons';
import { Screen } from '../components/Screen';
import { Ring } from '../components/svg';
import { Bar, Card, Cols, Tap } from '../components/ui';
import { useResponsive } from '../lib/responsive';
import { scheduleInfo, fmtDate, fmtDateFull } from '../lib/schedule';
import { useStore } from '../lib/store';
import {
  LLD_DAYS, LLD_TOTAL_DAYS, TYPE_LABEL,
  dayComplete, currentDayIndex, lldPct, phaseStats, doneDaysCount, writeLldStats,
} from '../lib/lld';
import { C, F } from '../theme';

const PAGE = 12;
const PHASE_SHORT: Record<string, string> = { 'OOP Foundations': 'OOP', 'Design Principles': 'PRIN', 'UML & Patterns': 'PAT', 'Interview Tips': 'TIPS', Questions: 'Q' };
const METHOD = [
  'Clarify requirements & scope cuts', 'Core entities → classes (SRP)', 'Map relationships (has-a vs owns-a)',
  'Apply 1–3 patterns, justified', 'Define public APIs', 'Concurrency & edge cases', 'Code a clean skeleton',
];

function ChevLeft() {
  return <View style={{ transform: [{ rotate: '180deg' }] }}><IconChevron color={C.ink} size={18} sw={2.2} /></View>;
}
function Check({ done, onPress }: { done: boolean; onPress: () => void }) {
  return (
    <Tap kind="light" onPress={onPress} hitSlop={8}
      style={{ width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: done ? '#e6e6e6' : '#3f3f3f', backgroundColor: done ? '#e6e6e6' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {done ? <Text style={{ color: '#0b0b0b', fontSize: 13, fontWeight: '900', lineHeight: 19 }}>✓</Text> : null}
    </Tap>
  );
}

export default function Lld() {
  const nav = useNavigation<any>();
  const { isWide, isTablet } = useResponsive();
  const [done, setDone] = useStore<Record<string, any>>('lld:done', {});
  const [notes, setNotes] = useStore<Record<string, any>>('lld:notes', {});
  const setNote = (n: number, text: string) => setNotes((s: any) => ({ ...s, [n]: text }));
  const [selDay, setSelDay] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  const days = LLD_DAYS;
  const total = LLD_TOTAL_DAYS;
  const toggle = (key: string) => setDone((s: any) => { const n = { ...s }; if (n[key]) delete n[key]; else n[key] = new Date().toISOString(); return n; });
  const markDay = (day: any, complete: boolean) => setDone((s: any) => { const n = { ...s }; day.items.forEach((it: any) => { if (complete) n[it.key] = new Date().toISOString(); else delete n[it.key]; }); return n; });

  const curIdx = useMemo(() => currentDayIndex(done), [done]);
  const cal = useMemo(() => scheduleInfo('lld', total), [total]);
  const focusDay = Math.min(cal.todayN || curIdx, total);
  const isToday = (n: number) => cal.todaySet.has(n);
  const active = selDay && selDay <= total ? selDay : focusDay;
  useEffect(() => { setPage(Math.floor((active - 1) / PAGE)); }, [active]);
  const goDay = (delta: number) => setSelDay((prev) => { const cur = prev && prev <= total ? prev : focusDay; return Math.min(total, Math.max(1, cur + delta)); });

  const { doneItems, pct } = lldPct(done);
  const phases = phaseStats(done);
  const doneDays = doneDaysCount(done);
  const allComplete = doneDays >= total;
  const behind = Math.max(0, cal.due - doneDays);
  const ahead = Math.max(0, doneDays - cal.due);
  const paceText = allComplete ? 'Complete' : behind ? `${behind}d behind` : ahead ? `${ahead}d ahead` : 'On track';
  const paceCol = allComplete || ahead ? C.easy : behind ? C.hard : C.ink2;
  const remaining = total - doneDays;
  const estFinish = cal.finishISO ? new Date(cal.finishISO + 'T00:00') : new Date();

  useEffect(() => { writeLldStats(done); }, [done]);

  const activeDay = days[active - 1];
  const dayDone = dayComplete(activeDay, done);
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const pg = Math.min(page, pageCount - 1);
  const slice = days.slice(pg * PAGE, pg * PAGE + PAGE);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 16 }}>
        <Tap kind="select" onPress={() => nav.navigate('Home')} style={{ width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}><IconBack color={C.ink} size={18} /></Tap>
        <View>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>Curriculum · awesome-low-level-design</Text>
          <Text style={{ fontFamily: F.d800, fontSize: 26, color: C.ink, letterSpacing: -0.5 }}>Low Level Design</Text>
        </View>
      </View>

      <Cols active={isWide} weights={[1, 1.1, 1]} gap={14}>
        {/* LEFT COLUMN · stats + method */}
        <View style={{ gap: 14 }}>
        {/* STATS */}
        <Card>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>LLD prep · Oct 1 – Nov 15</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <Ring pct={pct} size={92} stroke={9}><Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink }}>{pct}%</Text></Ring>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink }}>{fmtDate(cal.dates[focusDay - 1])} <Text style={{ fontFamily: F.d700, fontSize: 14, color: C.ink3 }}>/ {total} days</Text></Text>
              <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3, marginTop: 3 }}>{doneDays} of {total} days · {doneItems} items done</Text>
              <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: `${paceCol}1f` }}>
                <Text style={{ fontFamily: F.b700, fontSize: 11, color: paceCol }}>{paceText}</Text>
              </View>
            </View>
          </View>
          <View style={{ marginTop: 14, gap: 8 }}>
            {phases.map((p) => (
              <View key={p.phase} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink2, flex: 1 }} numberOfLines={1}>{p.phase}</Text>
                <View style={{ width: 90 }}><Bar pct={p.pct} height={5} /></View>
                <Text style={{ fontFamily: F.b700, fontSize: 11, color: C.ink3, width: 34, textAlign: 'right' }}>{p.pct}%</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3, marginTop: 14 }}>{allComplete ? 'Plan complete — you’re interview-ready.' : `Ends ${estFinish.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${remaining} day${remaining === 1 ? '' : 's'} left`}</Text>
        </Card>

        {/* METHOD */}
        <Card>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3, marginBottom: 8 }}>The method · every problem</Text>
          <View style={{ gap: 6 }}>
            {METHOD.map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ fontFamily: F.b700, fontSize: 12, color: C.ink4, width: 16 }}>{i + 1}.</Text>
                <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.ink2, flex: 1 }}>{m}</Text>
              </View>
            ))}
          </View>
        </Card>
        </View>

        {/* CENTER COLUMN · day detail */}
        {/* DETAIL */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Tap kind="select" onPress={() => goDay(-1)} disabled={active <= 1} style={{ opacity: active <= 1 ? 0.3 : 1, padding: 4 }}><ChevLeft /></Tap>
            <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>{isToday(active) ? 'Today · ' : ''}{fmtDateFull(cal.dates[active - 1])}</Text>
            <Tap kind="select" onPress={() => goDay(1)} disabled={active >= total} style={{ opacity: active >= total ? 0.3 : 1, padding: 4 }}><IconChevron color={C.ink} size={18} sw={2.2} /></Tap>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <Text style={{ fontFamily: F.b600, fontSize: 11, color: C.ink2 }}>{activeDay.phase}</Text>
            </View>
            {activeDay.tag ? <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,125,41,0.35)' }}><Text style={{ fontFamily: F.b700, fontSize: 10, color: C.flame }}>{activeDay.tag}</Text></View> : null}
            {isToday(active) ? <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: '#f0f0f0' }}><Text style={{ fontFamily: F.b700, fontSize: 10.5, color: '#0b0b0b' }}>Today</Text></View> : null}
          </View>
          <Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink, marginTop: 12 }}>{activeDay.title}</Text>
          <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink2, marginTop: 4 }}>{activeDay.focus}</Text>
          <View style={{ marginTop: 14, gap: 8 }}>
            {activeDay.items.map((it: any) => (
              <View key={it.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: C.line3, borderRadius: 12, padding: 12, opacity: done[it.key] ? 0.6 : 1 }}>
                <Check done={!!done[it.key]} onPress={() => toggle(it.key)} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={{ fontFamily: F.d700, fontSize: 13.5, color: C.ink }}>{it.title}</Text>
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)' }}><Text style={{ fontFamily: F.b700, fontSize: 9, color: C.ink2 }}>{TYPE_LABEL[it.type] || it.type}</Text></View>
                  </View>
                  {it.hours ? <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: C.ink3, marginTop: 2 }}>~{it.hours}h</Text> : null}
                </View>
                {it.url ? <Tap kind="light" onPress={() => Linking.openURL(it.url)}><Text style={{ fontFamily: F.b600, fontSize: 11.5, color: C.ink2 }}>Open ↗</Text></Tap> : null}
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: F.b600, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: C.ink3, marginTop: 16, marginBottom: 6 }}>Notes</Text>
          <TextInput
            value={notes[active] || ''} onChangeText={(t) => setNote(active, t)} multiline
            placeholder="Key ideas, class sketches, patterns to remember, links to your solutions…" placeholderTextColor={C.ink4}
            style={{ fontFamily: F.b500, fontSize: 13, color: C.ink, backgroundColor: C.chip, borderColor: C.line, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 96, textAlignVertical: 'top' }}
          />
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Tap kind="medium" onPress={() => markDay(activeDay, !dayDone)} style={{ width: '100%', borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: dayDone ? `${C.easy}26` : '#f0f0f0' }}>
              <Text style={{ fontFamily: F.d700, fontSize: 14, color: dayDone ? C.easy : '#0b0b0b' }}>{dayDone ? 'Completed ✓' : 'Mark day complete'}</Text>
            </Tap>
          </View>
        </Card>

        {/* RIGHT COLUMN · day grid */}
        {/* GRID */}
        <Card>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3, marginBottom: 12 }}>Full plan · {total} days</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {slice.map((d: any, i: number) => {
              const n = pg * PAGE + i + 1;
              const isDone = dayComplete(d, done);
              const sel = n === active;
              return (
                <Tap key={n} kind="select" onPress={() => setSelDay(n)}
                  style={{ width: isWide ? '12.5%' : isTablet ? '18.5%' : '31%', aspectRatio: 1, borderRadius: 14, borderWidth: 1, borderColor: sel ? '#4a4a4a' : isDone ? 'rgba(0,184,163,0.4)' : C.line3, backgroundColor: isDone ? 'rgba(0,184,163,0.08)' : isToday(n) ? '#17171c' : 'transparent', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {isDone ? <Text style={{ color: C.easy, fontSize: 18 }}>✓</Text> : <Ring pct={sel ? 100 : 0} size={26} stroke={3} />}
                  <Text style={{ fontFamily: F.d700, fontSize: 11, color: C.ink }}>{fmtDate(cal.dates[n - 1])}</Text>
                  <Text style={{ fontFamily: F.b500, fontSize: 9, color: C.ink4 }}>{PHASE_SHORT[d.phase]}</Text>
                </Tap>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <Tap kind="select" onPress={() => setPage(Math.max(0, pg - 1))} disabled={pg === 0} style={{ opacity: pg === 0 ? 0.3 : 1, padding: 6 }}><ChevLeft /></Tap>
            <Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink3 }}>Page {pg + 1} of {pageCount}</Text>
            <Tap kind="select" onPress={() => setPage(Math.min(pageCount - 1, pg + 1))} disabled={pg >= pageCount - 1} style={{ opacity: pg >= pageCount - 1 ? 0.3 : 1, padding: 6 }}><IconChevron color={C.ink} size={18} sw={2.2} /></Tap>
          </View>
        </Card>
      </Cols>
    </Screen>
  );
}
