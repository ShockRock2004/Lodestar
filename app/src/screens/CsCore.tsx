import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Segmented } from '../components/controls';
import { IconBack, IconChevron } from '../components/icons';
import { Ring } from '../components/svg';
import { Screen } from '../components/Screen';
import { Card, Cols, Tap } from '../components/ui';
import {
  currentDayIndex, DEFAULT_PACE, dayMinutes, fmtDuration, makeRowMins,
  PACE_LABEL, PACE_OPTIONS, packInterleaved,
} from '../lib/csplan';
import { useResponsive } from '../lib/responsive';
import { activityRange } from '../lib/progress';
import { scheduleInfo, fmtDate, fmtDateFull } from '../lib/schedule';
import { setStore, useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { C, F } from '../theme';

const SUBJECT_ORDER = ['Operating Systems', 'Computer Networks', 'DBMS'];
const SHORT: Record<string, string> = { 'Operating Systems': 'OS', 'Computer Networks': 'CN', DBMS: 'DBMS' };
const RINGC: Record<string, string> = { OS: '#f4f4f4', CN: '#9c9c9c', DBMS: '#565656' };
const CS_PAGE = 15;
const lines = (s?: string) => (s || '').split('\n').map((x) => x.trim()).filter(Boolean);

function ChevLeft({ size = 18, sw = 2.2, color = C.ink }: { size?: number; sw?: number; color?: string }) {
  return <View style={{ transform: [{ rotate: '180deg' }] }}><IconChevron color={color} size={size} sw={sw} /></View>;
}

function Check({ done, onPress }: { done: boolean; onPress: () => void }) {
  return (
    <Tap kind="light" onPress={onPress} hitSlop={8}
      style={{ width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: done ? '#e6e6e6' : '#3f3f3f', backgroundColor: done ? '#e6e6e6' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {done ? <Text style={{ color: '#0b0b0b', fontSize: 13, fontWeight: '900', lineHeight: 19 }}>✓</Text> : null}
    </Tap>
  );
}

function ConcentricRings({ rings, size = 140, center }: { rings: { pct: number; color: string }[]; size?: number; center?: React.ReactNode }) {
  const sw = 9, gap = 6, pad = 9;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        {rings.map((r, i) => {
          const radius = size / 2 - sw / 2 - pad - i * (sw + gap);
          if (radius <= 0) return null;
          const c = 2 * Math.PI * radius;
          const off = c - (c * Math.max(0, Math.min(100, r.pct))) / 100;
          return (
            <React.Fragment key={i}>
              <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={sw} />
              <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={r.color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>{center}</View>
    </View>
  );
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

const CS_RANGES = [{ k: 14, label: '2W' }, { k: 42, label: '6W' }, { k: 84, label: '12W' }];

function CsConsistency() {
  const [ri, setRi] = useState(1);
  const range = CS_RANGES[ri];
  const { series, activeDays } = useMemo(() => {
    const arr = activityRange(range.k);
    const N = 14;
    const size = Math.max(1, Math.ceil(arr.length / N));
    const s: number[] = [];
    for (let i = 0; i < arr.length; i += size) s.push(arr.slice(i, i + size).reduce((a: number, c: any) => a + c.count, 0));
    return { series: s, activeDays: arr.filter((d: any) => d.count > 0).length };
  }, [ri]);
  const W = 300, H = 100, pad = 8;
  const max = Math.max(1, ...series);
  const pts = series.map((v, i) => [pad + i * ((W - 2 * pad) / Math.max(1, series.length - 1)), H - 9 - (v / max) * (H - 24)]);
  const line = smoothPath(pts);
  const area = pts.length ? `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z` : '';
  const tip = pts[pts.length - 1] || [0, 0];
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>Consistency</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {CS_RANGES.map((r, i) => (
            <Tap key={r.k} kind="select" onPress={() => setRi(i)} style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: i === ri ? '#20202a' : 'transparent', borderWidth: 1, borderColor: i === ri ? '#3a3a3a' : 'transparent' }}>
              <Text style={{ fontFamily: F.b600, fontSize: 11, color: i === ri ? '#fff' : C.ink3 }}>{r.label}</Text>
            </Tap>
          ))}
        </View>
      </View>
      <Text style={{ fontFamily: F.d700, fontSize: 20, color: C.ink, marginBottom: 6 }}>{activeDays} <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3 }}>active {activeDays === 1 ? 'day' : 'days'} · last {range.label}</Text></Text>
      <Svg width="100%" height={100} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs><LinearGradient id="csline-a" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#ffffff" stopOpacity="0.16" /><Stop offset="1" stopColor="#ffffff" stopOpacity="0" /></LinearGradient></Defs>
        {area ? <Path d={area} fill="url(#csline-a)" /> : null}
        {line ? <Path d={line} fill="none" stroke="#cfcfcf" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {pts.length ? <Circle cx={tip[0]} cy={tip[1]} r={4} fill="#fafafa" /> : null}
      </Svg>
    </Card>
  );
}

function TopicList({ rows, isDone, toggle }: { rows: any[]; isDone: (id: any) => boolean; toggle: (id: any) => void }) {
  const displayRows = [...rows].sort((a, b) => {
    const su = SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject);
    return su !== 0 ? su : (a.id || 0) - (b.id || 0);
  });
  const groups: { subject: string; rows: any[] }[] = [];
  displayRows.forEach((r) => { const g = groups[groups.length - 1]; if (g && g.subject === r.subject) g.rows.push(r); else groups.push({ subject: r.subject, rows: [r] }); });
  return (
    <View style={{ gap: 14 }}>
      {groups.map((g) => {
        const allDone = g.rows.length > 0 && g.rows.every((r) => isDone(r.id));
        return (
          <View key={g.subject} style={{ flexDirection: 'row', gap: 11, opacity: allDone ? 0.6 : 1 }}>
            <Check done={allDone} onPress={() => g.rows.forEach((r) => { if (isDone(r.id) === allDone) toggle(r.id); })} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.d700, fontSize: 13.5, color: C.ink, marginBottom: 6 }}>{g.subject}</Text>
              <View style={{ gap: 6 }}>
                {g.rows.flatMap((r) => {
                  const topics = lines(r.topic_name), urls = lines(r.video_urls);
                  return topics.map((t, i) => (
                    <View key={r.id + '-' + i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.ink2, flex: 1 }}>{t}</Text>
                      {urls[i] ? (
                        <Tap kind="light" onPress={() => Linking.openURL(urls[i])} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                          <Text style={{ color: C.ink2, fontSize: 9 }}>▶</Text>
                          <Text style={{ fontFamily: F.b600, fontSize: 10.5, color: C.ink2 }}>Watch</Text>
                        </Tap>
                      ) : null}
                    </View>
                  ));
                })}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function CsCore() {
  const nav = useNavigation<any>();
  const { isTablet, isWide } = useResponsive();
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useStore<Record<string, any>>('cs:done', {});
  const [pace, setPace] = useStore('cs:pace', DEFAULT_PACE);
  const [sched, setSched] = useStore<any[] | null>('cs:sched', null);
  const [q, setQ] = useState('');
  const [selDay, setSelDay] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let alive = true;
    if (!supabase) { setError('no-config'); return; }
    function finish(data: any[]) {
      setRows(data || []);
      setStore('cs:topics', (data || []).map((r) => ({ id: r.id, subject: r.subject, chapter: r.chapter, topics: r.topic_name || '' })));
    }
    (supabase as any).from('core_cs_topics').select('id,subject,chapter,topic_name,video_urls,is_completed,duration_mins')
      .then(({ data, error }: any) => {
        if (!alive) return;
        if (error) {
          (supabase as any).from('core_cs_topics').select('id,subject,chapter,topic_name,video_urls,is_completed')
            .then(({ data: d2, error: e2 }: any) => { if (!alive) return; if (e2) { setError(e2.message || 'fetch-failed'); return; } finish(d2); });
          return;
        }
        finish(data);
      });
    return () => { alive = false; };
  }, []);

  const isDone = (id: any) => !!done[id];
  const toggle = (id: any) => setDone((s: any) => { const n = { ...s }; if (n[id]) delete n[id]; else n[id] = new Date().toISOString(); return n; });

  const rowMins = useMemo(() => (rows ? makeRowMins(rows) : () => 0), [rows]);
  const ordered = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => {
      const s = SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject);
      return s !== 0 ? s : (a.id || 0) - (b.id || 0);
    });
  }, [rows]);
  const idToRow = useMemo(() => Object.fromEntries((rows || []).map((r) => [r.id, r])), [rows]);

  useEffect(() => {
    if (!rows) return;
    if (!sched || !sched.length) {
      setSched(packInterleaved(ordered, pace, rowMins).map((d: any[]) => d.map((r) => r.id)));
      return;
    }
    const liveIds = new Set(ordered.map((r) => r.id));
    const flat = sched.flat();
    const schedIds = new Set(flat);
    const hasNew = ordered.some((r) => !schedIds.has(r.id));
    const hasGone = flat.some((id: any) => !liveIds.has(id));
    if (!hasNew && !hasGone) return;
    let freeze = 0;
    const dayIds = sched.map((day: any[]) => day.filter((id) => liveIds.has(id))).filter((day: any[]) => day.length);
    while (freeze < dayIds.length && dayIds[freeze].every((id: any) => done[id])) freeze++;
    const frozen = dayIds.slice(0, freeze);
    const frozenIds = new Set(frozen.flat());
    const tail = ordered.filter((r) => !frozenIds.has(r.id));
    setSched([...frozen, ...packInterleaved(tail, pace, rowMins).map((d: any[]) => d.map((r) => r.id))]);
  }, [rows]); // eslint-disable-line

  const days = useMemo(() => {
    if (!rows) return [];
    if (!sched || !sched.length) return packInterleaved(ordered, pace, rowMins);
    return sched.map((a: any[]) => a.map((id) => idToRow[id]).filter(Boolean)).filter((d: any[]) => d.length);
  }, [rows, sched, idToRow, ordered, pace, rowMins]);

  const changePace = (newPace: any) => {
    if (newPace === pace) return;
    let freeze = 0;
    while (freeze < days.length && days[freeze].length && days[freeze].every((r: any) => isDone(r.id))) freeze++;
    const frozen = days.slice(0, freeze);
    const tail = days.slice(freeze).flatMap((d: any[]) => d);
    const next = [...frozen, ...packInterleaved(tail, newPace, rowMins)].map((a: any[]) => a.map((r) => r.id));
    setSched(next);
    setPace(newPace);
  };

  const curIdx = useMemo(() => currentDayIndex(days, isDone), [days, done]);
  // Date-based schedule: each day maps to a calendar date (skips excluded).
  const cal = useMemo(() => scheduleInfo('cs-core', days.length), [days.length]);
  const focusDay = Math.min(cal.todayN || curIdx, days.length);
  const active = selDay && selDay <= days.length ? selDay : focusDay;
  const goDay = (delta: number) => setSelDay((prev) => {
    const cur = prev && prev <= days.length ? prev : focusDay;
    return Math.min(days.length, Math.max(1, cur + delta));
  });
  useEffect(() => { setPage(Math.floor((active - 1) / CS_PAGE)); }, [active]); // eslint-disable-line
  const total = rows ? rows.length : 0;
  const doneCount = rows ? rows.filter((r) => isDone(r.id)).length : 0;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const allComplete = total > 0 && doneCount === total;
  const doneDays = days.filter((rs: any[]) => rs.length && rs.every((r) => isDone(r.id))).length;
  const remaining = Math.max(0, days.length - doneDays);
  const isToday = (n: number) => !allComplete && cal.todaySet.has(n);
  const dayLabel = (n: number) => fmtDate(cal.dates[n - 1]);
  const behind = Math.max(0, cal.due - doneDays);
  const ahead = Math.max(0, doneDays - cal.due);
  const paceText = allComplete ? 'Complete' : behind ? `${behind}d behind` : ahead ? `${ahead}d ahead` : 'On track';
  const paceCol = allComplete || ahead ? C.easy : behind ? C.hard : C.ink2;

  useEffect(() => { if (rows) setStore('cs:stats', { done: doneCount, total, pct }); }, [rows, doneCount, total, pct]);

  const subjStats = SUBJECT_ORDER.map((s) => {
    const rs = (rows || []).filter((r) => r.subject === s);
    const d = rs.filter((r) => isDone(r.id)).length;
    return { s, short: SHORT[s], total: rs.length, done: d, pct: rs.length ? Math.round((d / rs.length) * 100) : 0 };
  }).filter((x) => x.total);
  const rings = subjStats.map((x) => ({ pct: x.pct, color: RINGC[x.short] || '#888' }));

  const searchRows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return null;
    return ordered.filter((r) => `${r.chapter} ${r.subject} ${r.topic_name}`.toLowerCase().includes(t)).slice(0, 40);
  }, [q, ordered]);

  const pageCount = Math.max(1, Math.ceil(days.length / CS_PAGE));
  const pg = Math.min(page, pageCount - 1);
  const gridSlice = days.slice(pg * CS_PAGE, pg * CS_PAGE + CS_PAGE);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 14 }}>
        <Tap kind="light" onPress={() => nav.goBack()} style={{ width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip }}>
          <IconBack color={C.ink} size={18} sw={2} />
        </Tap>
        <View>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: C.ink3 }}>Curriculum · Gate Smashers</Text>
          <Text style={{ fontFamily: F.d800, fontSize: 26, color: C.ink }}>CS Core</Text>
        </View>
      </View>

      {error ? (
        <Card>
          <Text style={{ fontFamily: F.d700, fontSize: 15, color: C.ink }}>{error === 'no-config' ? 'Supabase not configured' : "Couldn't load the curriculum"}</Text>
          <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink3, marginTop: 6 }}>{error === 'no-config' ? 'Add your Supabase URL + key to load the OS · CN · DBMS curriculum.' : error}</Text>
        </Card>
      ) : !rows ? (
        <Card><Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink3 }}>Loading curriculum…</Text></Card>
      ) : (
        <Cols active={isWide} weights={[1, 1.15, 1]} gap={14}>
          {/* LEFT COLUMN — plan / pace / consistency stats */}
          <View style={{ gap: 14 }}>
          {/* PLAN */}
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <ConcentricRings rings={rings} center={<><Text style={{ fontFamily: F.d800, fontSize: 22, color: C.ink }}>{pct}%</Text><Text style={{ fontFamily: F.b500, fontSize: 10, color: C.ink3 }}>done</Text></>} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink }}>{fmtDate(cal.dates[focusDay - 1])} <Text style={{ fontFamily: F.d700, fontSize: 14, color: C.ink3 }}>/ {days.length} days</Text></Text>
                <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3, marginTop: 3 }}>{doneCount} of {total} topics · {remaining === 0 ? 'all caught up' : `${remaining} days left`}</Text>
                <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: `${paceCol}1f` }}>
                  <Text style={{ fontFamily: F.b700, fontSize: 11, color: paceCol }}>{paceText}</Text>
                </View>
                <View style={{ marginTop: 10, gap: 6 }}>
                  {subjStats.map((x) => (
                    <View key={x.s} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: RINGC[x.short] }} />
                      <Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink2, flex: 1 }}>{x.short}</Text>
                      <Text style={{ fontFamily: F.b700, fontSize: 12, color: C.ink }}>{x.pct}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Card>

          {/* PACE */}
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.d700, fontSize: 13, color: C.ink }}>Daily pace</Text>
                <Text style={{ fontFamily: F.b500, fontSize: 11, color: C.ink3, marginTop: 2 }}>{PACE_LABEL[pace]}/day · repacks remaining</Text>
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <Segmented value={pace} onChange={changePace} options={PACE_OPTIONS.map((p: any) => ({ value: p, label: PACE_LABEL[p] }))} />
            </View>
          </Card>

          {/* CONSISTENCY */}
          <CsConsistency />
          </View>

          {/* CENTER COLUMN — selected day detail / search results */}
          <View style={{ gap: 14 }}>
          {/* DETAIL or SEARCH RESULTS */}
          {searchRows ? (
            <Card>
              <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3, marginBottom: 12 }}>{searchRows.length} match{searchRows.length === 1 ? '' : 'es'}</Text>
              <TopicList rows={searchRows} isDone={isDone} toggle={toggle} />
            </Card>
          ) : days.length ? (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <Tap kind="select" onPress={() => goDay(-1)} disabled={active <= 1} style={{ opacity: active <= 1 ? 0.3 : 1, padding: 4 }}><ChevLeft /></Tap>
                <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>{isToday(active) ? 'Today · ' : ''}{fmtDateFull(cal.dates[active - 1])}</Text>
                <Tap kind="select" onPress={() => goDay(1)} disabled={active >= days.length} style={{ opacity: active >= days.length ? 0.3 : 1, padding: 4 }}><IconChevron color={C.ink} size={18} sw={2.2} /></Tap>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Ring pct={days[active - 1].filter((r: any) => isDone(r.id)).length / Math.max(1, days[active - 1].length) * 100} size={30} stroke={4} />
                <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3 }}>
                  {fmtDuration(dayMinutes(days[active - 1], rowMins))} · {[...new Set(days[active - 1].map((r: any) => SHORT[r.subject] || r.subject))].join(' · ')} · <Text style={{ fontFamily: F.b700, color: C.ink }}>{days[active - 1].filter((r: any) => isDone(r.id)).length}/{days[active - 1].length} done</Text>
                </Text>
              </View>
              <TopicList rows={days[active - 1]} isDone={isDone} toggle={toggle} />
            </Card>
          ) : null}
          </View>

          {/* RIGHT COLUMN — search + day grid */}
          <View style={{ gap: 14 }}>
          {/* SEARCH */}
          <View>
            <TextInput
              value={q} onChangeText={setQ} placeholder="Find a lecture…" placeholderTextColor={C.ink4}
              style={{ fontFamily: F.b500, fontSize: 14, color: C.ink, backgroundColor: C.chip, borderColor: C.line, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }}
            />
          </View>

          {/* STUDY PLAN GRID */}
          {days.length ? (
            <Card>
              <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3, marginBottom: 12 }}>Study plan · {days.length} days</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {gridSlice.map((rs: any[], i: number) => {
                  const n = pg * CS_PAGE + i + 1;
                  const d = rs.filter((r) => isDone(r.id)).length, tot = rs.length;
                  const p = tot ? Math.round((d / tot) * 100) : 0;
                  const complete = d === tot;
                  const sel = n === active;
                  return (
                    <Tap key={n} kind="select" onPress={() => setSelDay(n)}
                      style={{ width: isWide ? '12.5%' : isTablet ? '18.5%' : '31%', aspectRatio: 1, borderRadius: 14, borderWidth: 1, borderColor: sel ? '#4a4a4a' : complete ? 'rgba(0,184,163,0.4)' : C.line3, backgroundColor: complete ? 'rgba(0,184,163,0.08)' : isToday(n) ? '#17171c' : 'transparent', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      {complete ? <Text style={{ color: C.easy, fontSize: 18 }}>✓</Text> : <Ring pct={p} size={26} stroke={3} />}
                      <Text style={{ fontFamily: F.d700, fontSize: 11, color: C.ink }}>{dayLabel(n)}</Text>
                      <Text style={{ fontFamily: F.b500, fontSize: 9.5, color: C.ink4 }}>{fmtDuration(dayMinutes(rs, rowMins))}</Text>
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
          ) : null}
          </View>
        </Cols>
      )}
    </Screen>
  );
}
