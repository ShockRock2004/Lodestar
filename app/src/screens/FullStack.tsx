import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { IconBack, IconChevron } from '../components/icons';
import { Screen } from '../components/Screen';
import { Ring, TECH_LABEL, TechLogo } from '../components/svg';
import { Card, Cols, Tap } from '../components/ui';
import { useResponsive } from '../lib/responsive';
import {
  courseStats, currentDayIndex, dayHours, fmtHours, ODIN_ITEMS, ODIN_PACE,
  ODIN_TOTAL_HOURS, odinPct, packOdinDays, techForDay, writeOdinStats,
} from '../lib/odin';
import { activityRange } from '../lib/progress';
import { scheduleInfo, fmtDate, fmtDateFull } from '../lib/schedule';
import { useStore } from '../lib/store';
import { C, F } from '../theme';

// Consistency chart reused from ReadingTracker's internal — reimplement inline (same math).
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

const PAGE = 12;
const SHORT: Record<string, string> = { Foundations: 'FND', 'Intermediate HTML and CSS': 'HTML', JavaScript: 'JS', 'Advanced HTML and CSS': 'ADV', React: 'RCT', Databases: 'DB', NodeJS: 'NODE', 'Getting Hired': 'HIRE' };
const RANGES = [{ k: 14, label: '2W' }, { k: 42, label: '6W' }, { k: 84, label: '12W' }];

function ChevLeft({ size = 18 }: { size?: number }) {
  return <View style={{ transform: [{ rotate: '180deg' }] }}><IconChevron color={C.ink} size={size} sw={2.2} /></View>;
}

function smoothPath(pts: number[][]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function Consistency() {
  const [ri, setRi] = useState(1);
  const range = RANGES[ri];
  const { series, activeDays } = useMemo(() => {
    const arr = activityRange(range.k);
    const N = 14, size = Math.max(1, Math.ceil(arr.length / N));
    const s: number[] = [];
    for (let i = 0; i < arr.length; i += size) s.push(arr.slice(i, i + size).reduce((a: number, c: any) => a + c.count, 0));
    return { series: s, activeDays: arr.filter((d: any) => d.count > 0).length };
  }, [ri]);
  const W = 300, H = 120, pad = 8, top = 12, bot = 12;
  const max = Math.max(1, ...series);
  const pts = series.map((v, i) => [pad + i * ((W - 2 * pad) / Math.max(1, series.length - 1)), H - bot - (v / max) * (H - top - bot)]);
  const line = smoothPath(pts);
  const area = pts.length ? `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z` : '';
  const tip = pts[pts.length - 1] || [0, 0];
  const grid = [0.25, 0.5, 0.75, 1].map((gv) => H - bot - gv * (H - top - bot));
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>Consistency</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {RANGES.map((r, i) => (
            <Tap key={r.k} kind="select" onPress={() => setRi(i)} style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: i === ri ? '#20202a' : 'transparent', borderWidth: 1, borderColor: i === ri ? '#3a3a3a' : 'transparent' }}>
              <Text style={{ fontFamily: F.b600, fontSize: 11, color: i === ri ? '#fff' : C.ink3 }}>{r.label}</Text>
            </Tap>
          ))}
        </View>
      </View>
      <Text style={{ fontFamily: F.d700, fontSize: 20, color: C.ink, marginBottom: 6 }}>{activeDays} <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3 }}>active {activeDays === 1 ? 'day' : 'days'} · last {range.label}</Text></Text>
      <Svg width="100%" height={120} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs><LinearGradient id="odinline-a" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#ffffff" stopOpacity="0.16" /><Stop offset="1" stopColor="#ffffff" stopOpacity="0" /></LinearGradient></Defs>
        {grid.map((y, i) => <Line key={i} x1="0" y1={y} x2={W} y2={y} stroke="rgba(255,255,255,.05)" strokeWidth={1} />)}
        {area ? <Path d={area} fill="url(#odinline-a)" /> : null}
        {line ? <Path d={line} fill="none" stroke="#cfcfcf" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {pts.length ? <Circle cx={tip[0]} cy={tip[1]} r={4} fill="#fafafa" /> : null}
      </Svg>
    </Card>
  );
}

function Check({ done, onPress }: { done: boolean; onPress: () => void }) {
  return (
    <Tap kind="light" onPress={onPress} hitSlop={8}
      style={{ width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: done ? '#e6e6e6' : '#3f3f3f', backgroundColor: done ? '#e6e6e6' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {done ? <Text style={{ color: '#0b0b0b', fontSize: 13, fontWeight: '900', lineHeight: 19 }}>✓</Text> : null}
    </Tap>
  );
}

export default function FullStack() {
  const nav = useNavigation<any>();
  const { isWide, isTablet } = useResponsive();
  const [done, setDone] = useStore<Record<string, any>>('odin:done', {});
  const [selDay, setSelDay] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  const days = useMemo(() => packOdinDays(ODIN_ITEMS, ODIN_PACE), []);
  const total = days.length;
  const isDone = (r: any) => !!done[r.key];
  const toggle = (r: any) => setDone((s: any) => { const n = { ...s }; if (n[r.key]) delete n[r.key]; else n[r.key] = new Date().toISOString(); return n; });
  const markDay = (rows: any[], complete: boolean) => setDone((s: any) => { const n = { ...s }; rows.forEach((r) => { if (complete) n[r.key] = new Date().toISOString(); else delete n[r.key]; }); return n; });

  const curIdx = useMemo(() => currentDayIndex(days, done), [days, done]);
  // Date-based schedule with 2 days of work each Sat/Sun (weekend-double).
  const cal = useMemo(() => scheduleInfo('full-stack', total), [total]);
  const focusDay = Math.min(cal.todayN || curIdx, total);
  const isToday = (n: number) => cal.todaySet.has(n);
  const dayLabel = (n: number) => {
    const dt = cal.dates[n - 1];
    if (n > 1 && cal.dates[n - 2] === dt) return `${fmtDate(dt)} ②`;
    if (n < total && cal.dates[n] === dt) return `${fmtDate(dt)} ①`;
    return fmtDate(dt);
  };
  const active = selDay && selDay <= total ? selDay : focusDay;
  useEffect(() => { setPage(Math.floor((active - 1) / PAGE)); }, [active]);
  const goDay = (delta: number) => setSelDay((prev) => { const cur = prev && prev <= total ? prev : focusDay; return Math.min(total, Math.max(1, cur + delta)); });

  const { done: doneCount, pct } = odinPct(done);
  const cstats = courseStats(done);
  const doneDays = days.filter((rows: any[]) => rows.every((r) => done[r.key])).length;
  const remaining = total - doneDays;
  const allComplete = doneCount >= ODIN_ITEMS.length;
  const behind = Math.max(0, cal.due - doneDays);
  const ahead = Math.max(0, doneDays - cal.due);
  const paceText = allComplete ? 'Complete' : behind ? `${behind}d behind` : ahead ? `${ahead}d ahead` : 'On track';
  const paceCol = allComplete || ahead ? C.easy : behind ? C.hard : C.ink2;
  const estFinish = cal.finishISO ? new Date(cal.finishISO + 'T00:00') : new Date(Date.now() + remaining * 86400000);

  useEffect(() => { writeOdinStats(done); }, [done]);

  const activeRows = days[active - 1];
  const dayItem = activeRows[0];
  const isSpan = activeRows.length === 1 && dayItem.spanTotal > 1;
  const tech = techForDay(activeRows);

  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const pg = Math.min(page, pageCount - 1);
  const slice = days.slice(pg * PAGE, pg * PAGE + PAGE);
  const allDoneToday = activeRows.every((r: any) => isDone(r));

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 14 }}>
        <Tap kind="light" onPress={() => nav.goBack()} style={{ width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip }}>
          <IconBack color={C.ink} size={18} sw={2} />
        </Tap>
        <View>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: C.ink3 }}>Full Stack · JavaScript</Text>
          <Text style={{ fontFamily: F.d800, fontSize: 26, color: C.ink }}>Full Stack</Text>
        </View>
      </View>

      <Cols active={isWide} weights={[1, 1.1, 1]} gap={14}>
        {/* LEFT COLUMN · stats + consistency */}
        <View style={{ gap: 14 }}>
        {/* STATS */}
        <Card>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>Full Stack · ~{ODIN_PACE.toFixed(1)}h/day</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <Ring pct={pct} size={92} stroke={9}><Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink }}>{pct}%</Text></Ring>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink }}>{fmtDate(cal.dates[focusDay - 1])} <Text style={{ fontFamily: F.d700, fontSize: 14, color: C.ink3 }}>/ {total} days</Text></Text>
              <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3, marginTop: 3 }}>{doneCount} of {ODIN_ITEMS.length} items · {ODIN_TOTAL_HOURS}h</Text>
              <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: `${paceCol}1f` }}>
                <Text style={{ fontFamily: F.b700, fontSize: 11, color: paceCol }}>{paceText}</Text>
              </View>
            </View>
          </View>
          <View style={{ marginTop: 14, gap: 7 }}>
            {cstats.map((c: any) => (
              <View key={c.course} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontFamily: F.b700, fontSize: 10.5, color: C.ink3, width: 42 }}>{SHORT[c.course] || c.course}</Text>
                <View style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: '#17171b', overflow: 'hidden' }}>
                  <View style={{ width: `${c.pct}%`, height: '100%', borderRadius: 99, backgroundColor: '#e2e2e2' }} />
                </View>
                <Text style={{ fontFamily: F.b700, fontSize: 11, color: C.ink3, width: 34, textAlign: 'right' }}>{c.pct}%</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3, marginTop: 14 }}>{doneCount >= ODIN_ITEMS.length ? 'Path complete — you did it.' : `Est. finish ${estFinish.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${remaining} day${remaining === 1 ? '' : 's'} left`}</Text>
        </Card>

        <Consistency />
        </View>

        {/* CENTER COLUMN · day detail */}
        {/* DETAIL */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Tap kind="select" onPress={() => goDay(-1)} disabled={active <= 1} style={{ opacity: active <= 1 ? 0.3 : 1, padding: 4 }}><ChevLeft /></Tap>
            <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>{isToday(active) ? 'Today · ' : ''}{fmtDateFull(cal.dates[active - 1])}{cal.dates[active - 1] && (cal.dates[active - 2] === cal.dates[active - 1] || cal.dates[active] === cal.dates[active - 1]) ? ' · session ' + (cal.dates[active - 2] === cal.dates[active - 1] ? '2' : '1') : ''}</Text>
            <Tap kind="select" onPress={() => goDay(1)} disabled={active >= total} style={{ opacity: active >= total ? 0.3 : 1, padding: 4 }}><IconChevron color={C.ink} size={18} sw={2.2} /></Tap>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <Text style={{ fontFamily: F.b600, fontSize: 11, color: C.ink2 }}>{dayItem.course}</Text>
            </View>
            {isToday(active) ? <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: '#f0f0f0' }}><Text style={{ fontFamily: F.b700, fontSize: 10.5, color: '#0b0b0b' }}>Today</Text></View> : null}
            <Text style={{ fontFamily: F.b600, fontSize: 11.5, color: C.ink3, marginLeft: 'auto' }}>{fmtHours(dayHours(activeRows))}</Text>
          </View>

          {isSpan ? (
            <>
              <Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink, marginTop: 12 }}>{dayItem.title.replace(/^Project: /, '')}</Text>
              <Text style={{ fontFamily: F.b600, fontSize: 13, color: C.ink2, marginTop: 4 }}>{dayItem.section} · Project — day {dayItem.spanPart} of {dayItem.spanTotal}</Text>
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: C.line3, borderRadius: 12, padding: 12, opacity: isDone(dayItem) ? 0.6 : 1 }}>
                  <Check done={isDone(dayItem)} onPress={() => toggle(dayItem)} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.d700, fontSize: 13.5, color: C.ink }}>{dayItem.title}</Text>
                    <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: C.ink3, marginTop: 2 }}>Project · ~{dayItem.hours}h total · checked once complete</Text>
                  </View>
                  {dayItem.url ? <Tap kind="light" onPress={() => Linking.openURL(dayItem.url)}><Text style={{ fontFamily: F.b600, fontSize: 11.5, color: C.ink2 }}>Open ↗</Text></Tap> : null}
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink, marginTop: 12 }}>{activeRows.length} {activeRows.length === 1 ? 'item' : 'items'} today</Text>
              <Text style={{ fontFamily: F.b600, fontSize: 13, color: C.ink2, marginTop: 4 }}>{[...new Set(activeRows.map((r: any) => r.section))].join(' · ')}</Text>
              <View style={{ marginTop: 14, gap: 8 }}>
                {activeRows.map((it: any) => (
                  <View key={it.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: C.line3, borderRadius: 12, padding: 12, opacity: isDone(it) ? 0.6 : 1 }}>
                    <Check done={isDone(it)} onPress={() => toggle(it)} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={{ fontFamily: F.d700, fontSize: 13.5, color: C.ink }}>{it.title}</Text>
                        {it.type === 'project' ? <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)' }}><Text style={{ fontFamily: F.b700, fontSize: 9, color: C.ink2 }}>Project</Text></View> : null}
                      </View>
                      <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: C.ink3, marginTop: 2 }}>{it.section} · {fmtHours(it.dayHours)}</Text>
                    </View>
                    {it.url ? <Tap kind="light" onPress={() => Linking.openURL(it.url)}><Text style={{ fontFamily: F.b600, fontSize: 11.5, color: C.ink2 }}>Open ↗</Text></Tap> : null}
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <TechLogo tech={tech} size={110} />
            <Text style={{ fontFamily: F.b600, fontSize: 11, color: C.ink3, marginTop: 8 }}>Today's stack · {TECH_LABEL[tech] || 'Full Stack'}</Text>
          </View>

          <Tap kind="medium" onPress={() => markDay(activeRows, !allDoneToday)} style={{ marginTop: 16, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: allDoneToday ? `${C.easy}26` : '#f0f0f0' }}>
            <Text style={{ fontFamily: F.d700, fontSize: 14, color: allDoneToday ? C.easy : '#0b0b0b' }}>{allDoneToday ? 'Completed ✓' : 'Mark day complete'}</Text>
          </Tap>
        </Card>

        {/* RIGHT COLUMN · day grid */}
        {/* GRID */}
        <Card>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3, marginBottom: 12 }}>Full path · {total} days</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {slice.map((rows: any[], i: number) => {
              const n = pg * PAGE + i + 1;
              const allDone = rows.every((r) => done[r.key]);
              const c = rows[0].course;
              const sel = n === active;
              return (
                <Tap key={n} kind="select" onPress={() => setSelDay(n)}
                  style={{ width: isWide ? '12.5%' : isTablet ? '18.5%' : '31%', aspectRatio: 1, borderRadius: 14, borderWidth: 1, borderColor: sel ? '#4a4a4a' : allDone ? 'rgba(0,184,163,0.4)' : C.line3, backgroundColor: allDone ? 'rgba(0,184,163,0.08)' : isToday(n) ? '#17171c' : 'transparent', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {allDone ? <Text style={{ color: C.easy, fontSize: 18 }}>✓</Text> : <Ring pct={sel ? 100 : 0} size={26} stroke={3} />}
                  <Text style={{ fontFamily: F.d700, fontSize: 11, color: C.ink }}>{dayLabel(n)}</Text>
                  <Text style={{ fontFamily: F.b500, fontSize: 9, color: C.ink4 }}>{SHORT[c] || c}</Text>
                </Tap>
              );
            })}
          </View>
          {pageCount > 1 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 14 }}>
              <Tap kind="select" onPress={() => setPage(Math.max(0, pg - 1))} disabled={pg === 0} style={{ opacity: pg === 0 ? 0.3 : 1 }}><ChevLeft size={16} /></Tap>
              <Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink3 }}>Page {pg + 1} of {pageCount}</Text>
              <Tap kind="select" onPress={() => setPage(Math.min(pageCount - 1, pg + 1))} disabled={pg >= pageCount - 1} style={{ opacity: pg >= pageCount - 1 ? 0.3 : 1 }}><IconChevron color={C.ink} size={16} sw={2.2} /></Tap>
            </View>
          ) : null}
        </Card>
      </Cols>
    </Screen>
  );
}
