import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { IconBack, IconChevron, IconTrash } from '../components/icons';
import { Screen } from '../components/Screen';
import { Bar, Card, Cols, Tap } from '../components/ui';
import { useCloud } from '../lib/clouddb';
import { useResponsive } from '../lib/responsive';
import { C, DIFF_COLOR, diffTone, F } from '../theme';

const diffRank: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };
const DIFFS = ['Easy', 'Medium', 'Hard'];
const today = () => new Date().toISOString().slice(0, 10);
const asDay = (iso: string) => new Date(iso + 'T00:00:00');
const dNum = (iso: string) => asDay(iso).getDate();
const dWk = (iso: string) => asDay(iso).toLocaleDateString('en-US', { weekday: 'short' });
const dMon = (iso: string) => asDay(iso).toLocaleDateString('en-US', { month: 'short' });
const fmtFull = (iso: string) => asDay(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

const dsaToRow = (x: any) => ({
  id: x.id, slug: x.slug || null, title: x.title || null, url: x.url || null,
  difficulty: x.difficulty || null, topics: Array.isArray(x.topics) ? x.topics : [],
  notes: x.notes || '', status: x.status || 'todo', score: x.score == null ? null : x.score,
  target_date: x.target_date || null, source: x.source || 'manual', plan: x.plan || 'My problems',
  created_at: x.created_at || new Date().toISOString(), updated_at: x.updated_at || new Date().toISOString(),
  solved_at: x.solved_at || null,
});
const dsaFromRow = (r: any) => ({ ...r, topics: Array.isArray(r.topics) ? r.topics : [] });

// Lead a day with its "watch this first" and theory items, then problems by difficulty
// (mirrors web). Plans without Video/Theory tags are unaffected (rank === diffRank).
const leadRank = (x: any) => {
  const t: string[] = x.topics || [];
  if (t.includes('Video')) return -3;
  if (t.includes('Revision') || t.includes('Consolidation')) return -2;
  if (x.difficulty == null) return -1;
  return diffRank[x.difficulty] ?? 1;
};
const sortDay = (arr: any[]) => [...arr].sort((a, b) => {
  if ((a.status === 'solved') !== (b.status === 'solved')) return a.status === 'solved' ? 1 : -1;
  return (leadRank(a) - leadRank(b)) || String(a.title).localeCompare(String(b.title));
});

function Check({ done, onPress, big }: { done: boolean; onPress: () => void; big?: boolean }) {
  const s = big ? 24 : 22;
  return (
    <Tap kind="light" onPress={onPress} hitSlop={8}
      style={{ width: s, height: s, borderRadius: 999, borderWidth: 2, borderColor: done ? '#e6e6e6' : '#3f3f3f', backgroundColor: done ? '#e6e6e6' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {done ? <Text style={{ color: '#0b0b0b', fontSize: s * 0.62, fontWeight: '900', lineHeight: s * 0.9 }}>✓</Text> : null}
    </Tap>
  );
}

function DiffBadge({ d }: { d?: string }) {
  const col = d ? DIFF_COLOR[d] : C.ink3;
  return (
    <View style={{ borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${col}66` }}>
      <Text style={{ fontFamily: F.b700, fontSize: 10, letterSpacing: 0.6, color: col }}>{d || '—'}</Text>
    </View>
  );
}

function QRow({ x, onToggle, onRemove }: { x: any; onToggle: (x: any) => void; onRemove: (id: string) => void }) {
  const done = x.status === 'solved';
  const topics = (x.topics || []).slice(0, 4).join(' · ');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line3, opacity: done ? 0.55 : 1 }}>
      <Check done={done} onPress={() => onToggle(x)} />
      <View style={{ flex: 1 }}>
        <Tap kind="light" onPress={() => x.url && Linking.openURL(x.url)} disabled={!x.url}>
          <Text style={{ fontFamily: F.d700, fontSize: 14, color: C.ink, textDecorationLine: done ? 'line-through' : 'none' }} numberOfLines={2}>
            {x.title}{x.url ? <Text style={{ color: C.ink3 }}>  ↗</Text> : null}
          </Text>
        </Tap>
        {topics ? <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: C.ink3, marginTop: 2 }} numberOfLines={1}>{topics}</Text> : null}
      </View>
      <DiffBadge d={x.difficulty} />
      <Tap kind="medium" onPress={() => onRemove(x.id)} hitSlop={6} style={{ padding: 4 }}>
        <IconTrash color={C.ink3} size={15} sw={1.9} />
      </Tap>
    </View>
  );
}

export default function DsaPlan() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { isWide } = useResponsive();
  const plan = route.params?.name || route.params?.plan || 'My problems';
  const problems = useCloud('dsa_problems', { localKey: 'col:dsa', toRow: dsaToRow, fromRow: dsaFromRow });

  const items = useMemo(() => problems.items.filter((x: any) => (x.plan || 'My problems') === plan), [problems.items, plan]);
  const total = items.length;
  const solved = useMemo(() => items.filter((x: any) => x.status === 'solved').length, [items]);
  const due = useMemo(() => items.filter((x: any) => x.status !== 'solved' && x.target_date && x.target_date < today()).length, [items]);
  const pct = total ? Math.round((solved / total) * 100) : 0;

  const breakdown = useMemo(() => {
    const b: Record<string, { s: number; t: number }> = { Easy: { s: 0, t: 0 }, Medium: { s: 0, t: 0 }, Hard: { s: 0, t: 0 } };
    items.forEach((x: any) => { if (b[x.difficulty]) { b[x.difficulty].t++; if (x.status === 'solved') b[x.difficulty].s++; } });
    return b;
  }, [items]);

  const groups = useMemo(() => {
    const byDay = new Map<string, any[]>();
    const undated: any[] = [];
    items.forEach((x: any) => {
      if (x.target_date) {
        const d = x.target_date.slice(0, 10);
        if (!byDay.has(d)) byDay.set(d, []);
        byDay.get(d)!.push(x);
      } else undated.push(x);
    });
    const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, arr]) => ({ key: date, date, items: sortDay(arr) }));
    if (undated.length) days.push({ key: 'unscheduled', date: null as any, items: sortDay(undated) });
    return days;
  }, [items]);

  const PAGE_SIZE = 6;
  const [selKey, setSelKey] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const closestIdx = useMemo(() => {
    if (!groups.length) return 0;
    const t = new Date(today() + 'T00:00:00').getTime();
    let best = -1, bestDiff = Infinity;
    groups.forEach((g, i) => {
      if (!g.date) return;
      const diff = Math.abs(new Date(g.date + 'T00:00:00').getTime() - t);
      if (diff < bestDiff) { bestDiff = diff; best = i; }
    });
    return best < 0 ? 0 : best;
  }, [groups]);

  const pageCount = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const curPage = Math.min(page, pageCount - 1);
  const pageGroups = groups.slice(curPage * PAGE_SIZE, curPage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    if (!groups.length) { if (selKey !== null) setSelKey(null); return; }
    if (!groups.some((g) => g.key === selKey)) setSelKey(groups[closestIdx].key);
  }, [groups, selKey, closestIdx]);
  useEffect(() => { setPage(Math.floor(closestIdx / PAGE_SIZE)); }, [closestIdx]);

  const sel = groups.find((g) => g.key === selKey) || groups[0] || null;
  const selSolved = sel ? sel.items.filter((x: any) => x.status === 'solved').length : 0;
  const selOverdue = sel && sel.date && sel.date < today() && sel.items.some((x: any) => x.status !== 'solved');

  const toggle = (x: any) => {
    const now = new Date().toISOString();
    if (x.status === 'solved') problems.update(x.id, { status: 'todo', solved_at: null, updated_at: now });
    else problems.update(x.id, { status: 'solved', solved_at: now, score: x.score || 4, updated_at: now });
  };

  const toggleDay = (g: any) => {
    const now = new Date().toISOString();
    const allDone = g.items.length > 0 && g.items.every((x: any) => x.status === 'solved');
    const rows: any[] = [];
    g.items.forEach((x: any) => {
      if (allDone && x.status === 'solved') rows.push({ ...x, status: 'todo', solved_at: null, updated_at: now });
      else if (!allDone && x.status !== 'solved') rows.push({ ...x, status: 'solved', solved_at: now, score: x.score || 4, updated_at: now });
    });
    if (rows.length) problems.upsertMany(rows);
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 14 }}>
        <Tap kind="light" onPress={() => nav.goBack()} style={{ width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip }}>
          <IconBack color={C.ink} size={18} sw={2} />
        </Tap>
        <View>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: C.ink3 }}>Plan · checklist</Text>
          <Text style={{ fontFamily: F.d800, fontSize: 26, color: C.ink }} numberOfLines={1}>{plan}</Text>
        </View>
      </View>

      {total === 0 ? (
        <Card>
          <Text style={{ fontFamily: F.d700, fontSize: 15, color: C.ink }}>No problems in this plan</Text>
          <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink3, marginTop: 6 }}>Add problems or import a CSV from the DSA page to start tracking here.</Text>
          <Tap kind="medium" onPress={() => nav.navigate('DSA')} style={{ marginTop: 14, alignSelf: 'flex-start', backgroundColor: '#f0f0f0', borderRadius: 11, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Text style={{ fontFamily: F.d700, fontSize: 13, color: '#0b0b0b' }}>Go to DSA</Text>
          </Tap>
        </Card>
      ) : (
        <Cols active={isWide} weights={[1, 1, 1.25]} gap={14}>
          {/* INFO */}
          <Card>
            <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>Total progress</Text>
            <Text style={{ fontFamily: F.d800, fontSize: 34, color: C.ink, marginTop: 4 }}>{solved}<Text style={{ fontFamily: F.d700, fontSize: 20, color: C.ink3 }}> / {total}</Text></Text>
            <View style={{ marginTop: 10 }}><Bar pct={pct} height={7} /></View>
            <Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink3, marginTop: 7 }}>{pct}% complete</Text>

            <View style={{ marginTop: 14, gap: 9 }}>
              {DIFFS.filter((d) => breakdown[d].t > 0).map((d) => {
                const { s, t } = breakdown[d];
                return (
                  <View key={d} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: DIFF_COLOR[d] }} />
                    <Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink2, width: 58 }}>{d}</Text>
                    <View style={{ flex: 1 }}><Bar pct={t ? (s / t) * 100 : 0} height={5} fill={DIFF_COLOR[d]} /></View>
                    <Text style={{ fontFamily: F.b700, fontSize: 12, color: C.ink3, fontVariant: ['tabular-nums'] }}>{s}/{t}</Text>
                  </View>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', marginTop: 16, borderTopWidth: 1, borderTopColor: C.line3, paddingTop: 14 }}>
              {[[total - solved, 'To-do'], [due, 'Overdue'], [groups.length, groups.length === 1 ? 'Day' : 'Days']].map(([n, l], i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink }}>{n as number}</Text>
                  <Text style={{ fontFamily: F.b600, fontSize: 11, color: C.ink3, marginTop: 2 }}>{l as string}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* SCHEDULE */}
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>Schedule · {groups.length}</Text>
              {pageCount > 1 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Tap kind="select" onPress={() => setPage(curPage - 1)} disabled={curPage === 0} style={{ opacity: curPage === 0 ? 0.35 : 1 }}><Text style={{ color: C.ink, fontSize: 20 }}>‹</Text></Tap>
                  <Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink3, fontVariant: ['tabular-nums'] }}>{curPage + 1} / {pageCount}</Text>
                  <Tap kind="select" onPress={() => setPage(curPage + 1)} disabled={curPage === pageCount - 1} style={{ opacity: curPage === pageCount - 1 ? 0.35 : 1 }}><Text style={{ color: C.ink, fontSize: 20 }}>›</Text></Tap>
                </View>
              ) : null}
            </View>
            <View style={{ gap: 8 }}>
              {pageGroups.map((g) => {
                const gs = g.items.filter((x: any) => x.status === 'solved').length;
                const active = sel && g.key === sel.key;
                const overdue = g.date && g.date < today() && gs < g.items.length;
                const done = gs === g.items.length;
                const label = g.date ? fmtFull(g.date) : 'Unscheduled';
                return (
                  <View key={g.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: active ? '#3a3a3a' : C.line3, backgroundColor: active ? '#17171c' : 'transparent' }}>
                    <Check done={done} onPress={() => toggleDay(g)} />
                    <Tap kind="select" onPress={() => setSelKey(g.key)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 38, alignItems: 'center' }}>
                        <Text style={{ fontFamily: F.d800, fontSize: 18, color: C.ink }}>{g.date ? dNum(g.date) : '∞'}</Text>
                        <Text style={{ fontFamily: F.b600, fontSize: 10, color: C.ink3 }}>{g.date ? dWk(g.date) : 'Any'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontFamily: F.b600, fontSize: 12.5, color: C.ink2 }}>{g.date ? dMon(g.date) : 'Unscheduled'}</Text>
                          {overdue ? <Text style={{ fontFamily: F.b700, fontSize: 9.5, color: C.hard, textTransform: 'uppercase' }}>overdue</Text> : null}
                        </View>
                        <View style={{ marginTop: 6 }}><Bar pct={g.items.length ? (gs / g.items.length) * 100 : 0} height={4} /></View>
                      </View>
                      <Text style={{ fontFamily: F.b700, fontSize: 12, color: C.ink3, fontVariant: ['tabular-nums'] }}>{gs}/{g.items.length}</Text>
                      <IconChevron color={C.ink4} size={14} sw={2} />
                    </Tap>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* QUESTIONS */}
          {sel ? (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontFamily: F.d700, fontSize: 16, color: C.ink, flex: 1 }} numberOfLines={1}>
                  {sel.date ? fmtFull(sel.date) : 'Unscheduled'}
                  {selOverdue ? <Text style={{ fontFamily: F.b700, fontSize: 10, color: C.hard }}>  overdue</Text> : null}
                </Text>
                <Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink3 }}>{selSolved} / {sel.items.length} solved</Text>
              </View>
              <View>
                {sel.items.map((x: any) => <QRow key={x.id} x={x} onToggle={toggle} onRemove={problems.remove} />)}
              </View>
            </Card>
          ) : null}
        </Cols>
      )}
    </Screen>
  );
}
