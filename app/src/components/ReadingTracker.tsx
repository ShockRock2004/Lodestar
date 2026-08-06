import React, { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { activityRange, useReading } from '../lib/progress';
import { isScheduled, scheduleInfo, fmtDate, fmtDateFull } from '../lib/schedule';
import { C, F } from '../theme';
import { useResponsive } from '../lib/responsive';
import { IconChevron } from './icons';
import { Ring } from './svg';
import { Bar, Card, Cols, Tap } from './ui';

const RK_PAGE = 12;
const RK_RANGES = [{ k: 14, label: '2W' }, { k: 42, label: '6W' }, { k: 84, label: '12W' }];

function ChevLeft({ size = 18, color = C.ink }: { size?: number; color?: string }) {
  return <View style={{ transform: [{ rotate: '180deg' }] }}><IconChevron color={color} size={size} sw={2.2} /></View>;
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

function ReadingConsistency() {
  const [ri, setRi] = useState(1);
  const range = RK_RANGES[ri];
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
  const grid = [0.25, 0.5, 0.75, 1].map((g) => H - bot - g * (H - top - bot));
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>Consistency</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {RK_RANGES.map((r, i) => (
            <Tap key={r.k} kind="select" onPress={() => setRi(i)} style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: i === ri ? '#20202a' : 'transparent', borderWidth: 1, borderColor: i === ri ? '#3a3a3a' : 'transparent' }}>
              <Text style={{ fontFamily: F.b600, fontSize: 11, color: i === ri ? '#fff' : C.ink3 }}>{r.label}</Text>
            </Tap>
          ))}
        </View>
      </View>
      <Text style={{ fontFamily: F.d700, fontSize: 20, color: C.ink, marginBottom: 6 }}>{activeDays} <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3 }}>active {activeDays === 1 ? 'day' : 'days'} · last {range.label}</Text></Text>
      <Svg width="100%" height={120} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs><LinearGradient id="rkline-a" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#ffffff" stopOpacity="0.16" /><Stop offset="1" stopColor="#ffffff" stopOpacity="0" /></LinearGradient></Defs>
        {grid.map((y, i) => <Line key={i} x1="0" y1={y} x2={W} y2={y} stroke="rgba(255,255,255,.05)" strokeWidth={1} />)}
        {area ? <Path d={area} fill="url(#rkline-a)" /> : null}
        {line ? <Path d={line} fill="none" stroke="#cfcfcf" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {pts.length ? <Circle cx={tip[0]} cy={tip[1]} r={4} fill="#fafafa" /> : null}
      </Svg>
    </Card>
  );
}

export default function ReadingTracker({ planId, chapterFocus = false }: { planId: string; chapterFocus?: boolean }) {
  const { isTablet, isWide } = useResponsive();
  const { plan, done, notes, toggle, setNote, doneCount, total, pct, currentDay, expectedDay, behind, ahead, finished } = useReading(planId);
  const days = plan.days;
  // Date-based schedule (System Design). ML plans stay day-numbered.
  const sched = isScheduled(planId);
  const info = useMemo(() => (sched ? scheduleInfo(planId, total) : null), [sched, planId, total]);
  const focusDay = sched && info ? Math.min(info.todayN, total) : Math.min(currentDay, total);
  const isTodayN = (n: number) => (sched && info ? info.todaySet.has(n) : n === currentDay);
  const dayLabel = (n: number) => (sched && info ? fmtDate(info.dates[n - 1]) : `Day ${n}`);
  const [selDay, setSelDay] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const active = selDay && selDay <= total ? selDay : focusDay;
  useEffect(() => { setPage(Math.floor((active - 1) / RK_PAGE)); }, [active]);
  const goDay = (delta: number) => setSelDay((prev) => {
    const cur = prev && prev <= total ? prev : focusDay;
    return Math.min(total, Math.max(1, cur + delta));
  });

  const groups = useMemo(() => {
    const m: { name: string; days: any[] }[] = [];
    days.forEach((d: any) => { const g = m.find((x) => x.name === d.group); if (g) g.days.push(d); else m.push({ name: d.group, days: [d] }); });
    return m;
  }, [days]);
  const curDayObj = days[Math.min(currentDay, total) - 1] || days[0];
  const curGroup = groups.find((g) => g.name === curDayObj.group) || groups[0];
  const cgTotal = curGroup ? curGroup.days.length : 0;
  const cgDone = curGroup ? curGroup.days.filter((d: any) => done[d.n]).length : 0;
  const cgPct = cgTotal ? Math.round((cgDone / cgTotal) * 100) : 0;
  const chapterNo = curGroup ? groups.findIndex((g) => g.name === curGroup.name) + 1 : 0;
  const remaining = total - doneCount;
  const estFinish = sched && info && info.finishISO ? new Date(info.finishISO + 'T00:00') : new Date(Date.now() + remaining * 86400000);
  const activeDay = days[active - 1];
  const dayPages = activeDay.to - activeDay.from + 1;
  const readMins = Math.max(5, Math.round(dayPages * 2));
  const paceText = finished ? 'Complete' : behind ? `${behind} day${behind > 1 ? 's' : ''} behind` : ahead ? `${ahead} day${ahead > 1 ? 's' : ''} ahead` : 'On track';
  const paceCol = finished || ahead ? C.easy : behind ? C.hard : C.ink2;

  const pageCount = Math.max(1, Math.ceil(total / RK_PAGE));
  const pg = Math.min(page, pageCount - 1);
  const slice = days.slice(pg * RK_PAGE, pg * RK_PAGE + RK_PAGE);

  return (
    <Cols active={isWide} weights={[1, 1, 1]}>
      {/* LEFT: stats + consistency */}
      <View style={{ gap: 14 }}>
      {/* STATS */}
      {chapterFocus ? (
        <Card>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>Current chapter{groups.length > 1 ? ` · ${chapterNo} of ${groups.length}` : ''}</Text>
          <Text style={{ fontFamily: F.d700, fontSize: 16, color: C.ink, marginTop: 6 }}>{curGroup ? curGroup.name : ''}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1 }}><Bar pct={cgPct} height={6} /></View>
            <Text style={{ fontFamily: F.b700, fontSize: 12, color: C.ink }}>{cgPct}%</Text>
          </View>
          <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3, marginTop: 10 }}>{finished ? 'Plan complete — nicely done.' : `Est. finish ${estFinish.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${remaining} day${remaining === 1 ? '' : 's'} left`}</Text>
        </Card>
      ) : (
        <Card>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>{plan.source} · {plan.perDay} pp/day</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <Ring pct={pct} size={92} stroke={9}><Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink }}>{pct}%</Text></Ring>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink }}>{sched && info ? fmtDate(info.dates[focusDay - 1]) : `Day ${Math.min(currentDay, total)}`} <Text style={{ fontFamily: F.d700, fontSize: 14, color: C.ink3 }}>/ {total} days</Text></Text>
              <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3, marginTop: 3 }}>{doneCount} of {total} days done</Text>
              <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: `${paceCol}1f` }}>
                <Text style={{ fontFamily: F.b700, fontSize: 11, color: paceCol }}>{paceText}{finished ? '' : ` · target ${expectedDay}`}</Text>
              </View>
            </View>
          </View>
          <View style={{ marginTop: 14, gap: 8 }}>
            {groups.map((g) => {
              const gd = g.days.filter((d: any) => done[d.n]).length;
              const gp = g.days.length ? Math.round((gd / g.days.length) * 100) : 0;
              return (
                <View key={g.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink2, flex: 1 }} numberOfLines={1}>{g.name}</Text>
                  <View style={{ width: 90 }}><Bar pct={gp} height={5} /></View>
                  <Text style={{ fontFamily: F.b700, fontSize: 11, color: C.ink3, width: 34, textAlign: 'right' }}>{gp}%</Text>
                </View>
              );
            })}
          </View>
          <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3, marginTop: 14 }}>{finished ? 'Plan complete — nicely done.' : `Est. finish ${estFinish.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${remaining} day${remaining === 1 ? '' : 's'} left`}</Text>
        </Card>
      )}

      <ReadingConsistency />
      </View>

      {/* CENTER: day detail */}
      <View style={{ gap: 14 }}>
      {/* DETAIL */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Tap kind="select" onPress={() => goDay(-1)} disabled={active <= 1} style={{ opacity: active <= 1 ? 0.3 : 1, padding: 4 }}><ChevLeft /></Tap>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>{isTodayN(active) ? 'Today · ' : ''}{sched && info ? fmtDateFull(info.dates[active - 1]) : `Day ${active} of ${total}`}</Text>
          <Tap kind="select" onPress={() => goDay(1)} disabled={active >= total} style={{ opacity: active >= total ? 0.3 : 1, padding: 4 }}><IconChevron color={C.ink} size={18} sw={2.2} /></Tap>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <Text style={{ fontFamily: F.b600, fontSize: 11, color: C.ink2 }}>{activeDay.group}</Text>
          </View>
          {isTodayN(active) ? <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: '#f0f0f0' }}><Text style={{ fontFamily: F.b700, fontSize: 10.5, color: '#0b0b0b' }}>Today</Text></View> : null}
          {done[active] ? <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: `${C.easy}26` }}><Text style={{ fontFamily: F.b700, fontSize: 10.5, color: C.easy }}>Done</Text></View> : null}
        </View>
        <Text style={{ fontFamily: F.d800, fontSize: 22, color: C.ink, marginTop: 12 }}>Page {activeDay.from}–{activeDay.to}</Text>
        <Text style={{ fontFamily: F.b600, fontSize: 13.5, color: C.ink2, marginTop: 4 }}>{activeDay.chapters.join(' · ')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3 }}>{dayPages} pages</Text>
          <View style={{ width: 3, height: 3, borderRadius: 3, backgroundColor: C.ink4 }} />
          <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3 }}>~{readMins} min read</Text>
        </View>
        <Text style={{ fontFamily: F.b600, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: C.ink3, marginTop: 16, marginBottom: 6 }}>Notes</Text>
        <TextInput
          value={notes[active] || ''} onChangeText={(t) => setNote(active, t)} multiline
          placeholder="Jot down key ideas, diagrams to redraw, follow-ups…" placeholderTextColor={C.ink4}
          style={{ fontFamily: F.b500, fontSize: 13, color: C.ink, backgroundColor: C.chip, borderColor: C.line, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 72, textAlignVertical: 'top' }}
        />
        <Tap kind="medium" onPress={() => toggle(active)} style={{ marginTop: 12, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: done[active] ? `${C.easy}26` : '#f0f0f0' }}>
          <Text style={{ fontFamily: F.d700, fontSize: 14, color: done[active] ? C.easy : '#0b0b0b' }}>{done[active] ? 'Completed ✓' : 'Mark day complete'}</Text>
        </Tap>
      </Card>
      </View>

      {/* RIGHT: day grid */}
      <View style={{ gap: 14 }}>
      {/* GRID */}
      <Card>
        <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3, marginBottom: 12 }}>Reading plan · {total} days</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {slice.map((d: any, i: number) => {
            const n = pg * RK_PAGE + i + 1;
            const isDone = !!done[n];
            const sel = n === active;
            return (
              <Tap key={n} kind="select" onPress={() => setSelDay(n)}
                style={{ width: isTablet ? '22.6%' : '31%', aspectRatio: 1, borderRadius: 14, borderWidth: 1, borderColor: sel ? '#4a4a4a' : isDone ? 'rgba(0,184,163,0.4)' : C.line3, backgroundColor: isDone ? 'rgba(0,184,163,0.08)' : isTodayN(n) ? '#17171c' : 'transparent', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4 }}>
                {isDone ? <Text style={{ color: C.easy, fontSize: 18 }}>✓</Text> : <Ring pct={sel ? 100 : 0} size={26} stroke={3} />}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontFamily: F.d700, fontSize: 11, color: C.ink }}>{dayLabel(n)}</Text>
                  {notes[n] ? <View style={{ width: 5, height: 5, borderRadius: 5, backgroundColor: C.med }} /> : null}
                </View>
                <Text style={{ fontFamily: F.b500, fontSize: 9, color: C.ink4 }}>pp. {d.from}–{d.to}</Text>
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
      </View>
    </Cols>
  );
}
