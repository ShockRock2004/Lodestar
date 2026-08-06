import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { CalendarCard } from '../components/CalendarCard';
import { DateTimePicker } from '../components/DateTimePicker';
import { Dropdown, Toggle } from '../components/controls';
import { IconTrash } from '../components/icons';
import { Modal } from '../components/Modal';
import { Screen } from '../components/Screen';
import { Donut, Ring } from '../components/svg';
import { Bar, Card, Chip, Cols, Eyebrow, Tap } from '../components/ui';
import { useCloud } from '../lib/clouddb';
import { useResponsive } from '../lib/responsive';
import { countdown, REMIND_OPTIONS } from '../lib/reminders';
import { todayISO, useStore } from '../lib/store';
import { C, DIFF_COLOR, diffTone, F } from '../theme';

const PLATFORMS = [
  { k: 'LeetCode', c: '#FFA116' },
  { k: 'Codeforces', c: '#1F8ACB' },
  { k: 'CodeChef', c: '#C7935B' },
];

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: F.d800, fontSize: 22, color: C.ink, fontVariant: ['tabular-nums'] }}>{value}</Text>
      <Text style={{ fontFamily: F.b600, fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase', color: C.ink3, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function Dsa() {
  const nav = useNavigation<any>();
  const { isWide } = useResponsive();
  const problems = useCloud('dsa_problems', { localKey: 'col:dsa' });
  const reminders = useCloud('contest_reminders', { localKey: 'col:contests' });
  const items: any[] = problems.items || [];
  const [goal, setGoal] = useStore('dsa:weekgoal', 5);
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', topicsText: '', difficulty: 'Medium', plan: 'My problems' });
  const [rf, setRf] = useState<any>({ platform: 'LeetCode', name: '', when: '', remind: 60 });

  const stats = useMemo(() => {
    const solved = items.filter((x) => x.status === 'solved');
    const total = items.length;
    const dates = new Set(solved.map((x) => (x.solved_at || x.created_at || '').slice(0, 10)).filter(Boolean));
    const back = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
    let streak = 0, k = dates.has(back(0)) ? 0 : 1;
    while (dates.has(back(k))) { streak++; k++; }
    const wk = Date.now() - 6 * 86400000;
    const week = solved.filter((x) => new Date(x.solved_at || x.created_at || 0).getTime() >= wk).length;
    const avg = solved.length ? Math.round((solved.reduce((a, b) => a + (b.score || 0), 0) / solved.length) * 10) / 10 : 0;
    return { total, solved: solved.length, todo: total - solved.length, streak, week, avg };
  }, [items]);

  const byDiff = useMemo(() => {
    const g: any = { Easy: { t: 0, s: 0 }, Medium: { t: 0, s: 0 }, Hard: { t: 0, s: 0 } };
    items.forEach((x) => { if (g[x.difficulty]) { g[x.difficulty].t++; if (x.status === 'solved') g[x.difficulty].s++; } });
    return g;
  }, [items]);

  const planList = useMemo(() => {
    const m: any = {};
    items.forEach((x) => { const pl = x.plan || 'My problems'; if (!m[pl]) m[pl] = { plan: pl, total: 0, solved: 0 }; m[pl].total++; if (x.status === 'solved') m[pl].solved++; });
    return Object.values(m).sort((a: any, b: any) => a.plan.localeCompare(b.plan)) as any[];
  }, [items]);

  const goalPct = Math.min(100, Math.round((stats.week / (goal || 1)) * 100));

  const removePlan = (plan: string) => {
    items.filter((x) => (x.plan || 'My problems') === plan).forEach((x) => problems.remove(x.id));
    setConfirmPlan(null);
  };

  const addProblem = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    problems.add({
      slug: null, title: form.title.trim(), url: '', difficulty: form.difficulty,
      topics: form.topicsText.split(/[;,]/).map((t) => t.trim()).filter(Boolean),
      notes: '', status: 'todo', score: null, target_date: null, source: 'manual', plan: form.plan,
      created_at: now, updated_at: now, solved_at: null,
    });
    setForm({ title: '', topicsText: '', difficulty: 'Medium', plan: 'My problems' });
    setAddOpen(false);
  };

  const addReminder = () => {
    if (!rf.name.trim() || !rf.when) return;
    reminders.add({ platform: rf.platform, name: rf.name.trim(), starts_at: new Date(rf.when).toISOString(), remind_before_mins: Number(rf.remind), notified: false });
    setRf({ platform: 'LeetCode', name: '', when: '', remind: 60 });
  };

  const upcoming = (reminders.items || []).filter((r: any) => r.starts_at).sort((a: any, b: any) => a.starts_at.localeCompare(b.starts_at));

  return (
    <Screen>
      <View style={{ marginTop: 10, marginBottom: 14 }}>
        <Text style={{ fontFamily: F.b600, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: C.ink3 }}>Daily practice · plans</Text>
        <Text style={{ fontFamily: F.d800, fontSize: 30, color: C.ink }}>DSA</Text>
      </View>

      {/* KPIs */}
      <Card style={{ flexDirection: 'row', marginBottom: 14 }}>
        <KPI label="Streak" value={`${stats.streak}d`} />
        <KPI label="Solved" value={String(stats.solved)} />
        <KPI label="To-do" value={String(stats.todo)} />
        <KPI label="Avg" value={String(stats.avg)} />
      </Card>

      <Cols active={isWide} weights={[1, 1, 1]}>
        {/* LEFT — trackers / visualizations */}
        <View style={{ gap: 14 }}>
      {/* Your practice donut */}
      <Card style={{ alignItems: 'center', gap: 14 }}>
        <Eyebrow style={{ alignSelf: 'flex-start' }}>Your practice</Eyebrow>
        <Donut
          size={132}
          stroke={16}
          segments={['Easy', 'Medium', 'Hard'].map((d) => ({ label: d, value: byDiff[d].s, color: DIFF_COLOR[d] }))}
        >
          <Text style={{ fontFamily: F.d800, fontSize: 22, color: '#f2f2f2' }}>{stats.solved}</Text>
          <Text style={{ fontFamily: F.b600, fontSize: 10, letterSpacing: 0.5, color: C.ink3, marginTop: 2 }}>SOLVED</Text>
        </Donut>
        <View style={{ width: '100%', gap: 11, paddingTop: 15, borderTopWidth: 1, borderTopColor: C.line2 }}>
          {['Easy', 'Medium', 'Hard'].map((d) => (
            <View key={d} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: DIFF_COLOR[d] }} />
              <Text style={{ flex: 1, fontFamily: F.b500, fontSize: 13, color: '#c4c4c4' }}>{d}</Text>
              <Text style={{ fontFamily: F.b700, fontSize: 15, color: C.ink }}>{byDiff[d].s}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* weekly goal */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Ring pct={goalPct} size={66} stroke={7}>
          <Text style={{ fontFamily: F.d800, fontSize: 12, color: C.ink }}>{goalPct}%</Text>
        </Ring>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.d800, fontSize: 20, color: C.ink }}>{stats.week} <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink3 }}>/ {goal}</Text></Text>
          <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.ink3 }}>solved this week</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Tap kind="select" onPress={() => setGoal((g) => Math.max(1, g - 1))} style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.ink, fontSize: 16 }}>−</Text></Tap>
            <Text style={{ fontFamily: F.b600, fontSize: 12.5, color: C.ink2 }}>{goal} / week</Text>
            <Tap kind="select" onPress={() => setGoal((g) => Math.min(50, g + 1))} style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.ink, fontSize: 16 }}>+</Text></Tap>
          </View>
        </View>
      </Card>
        </View>

        {/* CENTER — plans hub + add a problem */}
        <View style={{ gap: 14 }}>
      {/* plans hub */}
      {planList.length > 0 ? (
        <View>
          <Eyebrow style={{ marginBottom: 8 }}>Your plans · {planList.length}</Eyebrow>
          <View style={{ gap: 10 }}>
            {planList.map((ps: any) => {
              const pc = ps.total ? Math.round((ps.solved / ps.total) * 100) : 0;
              return (
                <View key={ps.plan} style={{ position: 'relative' }}>
                  <Tap kind="light" onPress={() => nav.navigate('DsaPlan', { name: ps.plan })}>
                    <Card style={{ padding: 14, gap: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 26 }}>
                        <Text style={{ fontFamily: F.d700, fontSize: 14.5, color: '#f0f0f0' }} numberOfLines={1}>{ps.plan}</Text>
                        <Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink2 }}>{ps.solved}/{ps.total}</Text>
                      </View>
                      <Bar pct={pc} height={6} fill="#d7d7d7" />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: '#7c7c7c' }}>{ps.total - ps.solved} to-do · {pc}%</Text>
                        <Text style={{ fontFamily: F.b600, fontSize: 11.5, color: '#cfcfcf' }}>Open →</Text>
                      </View>
                    </Card>
                  </Tap>
                  <Tap kind="light" onPress={() => setConfirmPlan(ps.plan)} hitSlop={8} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                    <IconTrash color="#7a7a7a" size={15} />
                  </Tap>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* add a problem */}
      <Card>
        <Tap onPress={() => setAddOpen((o) => !o)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>Add a problem</Eyebrow>
          <Text style={{ color: C.ink3, fontSize: 16 }}>{addOpen ? '▴' : '▾'}</Text>
        </Tap>
        {addOpen ? (
          <View style={{ gap: 10, marginTop: 12 }}>
            <TextInput value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} placeholder="Problem title" placeholderTextColor={C.ink4} style={inputStyle} />
            <TextInput value={form.topicsText} onChangeText={(t) => setForm({ ...form, topicsText: t })} placeholder="Topics — separate with ;" placeholderTextColor={C.ink4} style={inputStyle} />
            <Dropdown value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v })} options={[{ v: 'Easy', l: 'Easy' }, { v: 'Medium', l: 'Medium' }, { v: 'Hard', l: 'Hard' }]} title="Difficulty" />
            <Tap kind="medium" onPress={addProblem} style={{ backgroundColor: '#f0f0f0', borderRadius: 14, paddingVertical: 13, alignItems: 'center' }}><Text style={{ fontFamily: F.d700, fontSize: 14, color: '#0b0b0b' }}>Add problem</Text></Tap>
          </View>
        ) : null}
      </Card>
        </View>

        {/* RIGHT — contest reminders */}
        <View style={{ gap: 14 }}>
      {/* contest reminders */}
      <Card style={{ gap: 12, marginBottom: 20 }}>
        <Text style={{ fontFamily: F.d700, fontSize: 15, color: C.ink }}>Contest reminders</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {PLATFORMS.map((p) => {
            const on = rf.platform === p.k;
            return (
              <Tap key={p.k} kind="select" onPress={() => setRf({ ...rf, platform: p.k })} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: on ? '#3d3d3d' : C.line, backgroundColor: on ? '#20202a' : '#131317' }}>
                <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: p.c }} />
                <Text style={{ fontFamily: F.b600, fontSize: 12.5, color: on ? '#fff' : '#b6b6b6' }}>{p.k}</Text>
              </Tap>
            );
          })}
        </View>
        <TextInput value={rf.name} onChangeText={(t) => setRf({ ...rf, name: t })} placeholder="Contest name" placeholderTextColor={C.ink4} style={inputStyle} />
        <View>
          <Text style={{ fontFamily: F.b600, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: C.ink4, marginBottom: 6 }}>Date & time</Text>
          <DateTimePicker value={rf.when} onChange={(v) => setRf({ ...rf, when: v })} />
        </View>
        <View>
          <Text style={{ fontFamily: F.b600, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: C.ink4, marginBottom: 6 }}>Remind before</Text>
          <Dropdown value={rf.remind} onChange={(v) => setRf({ ...rf, remind: v })} options={REMIND_OPTIONS.map((o: any) => ({ v: o.v, l: o.l }))} title="Remind before" />
        </View>
        <Tap kind="medium" onPress={addReminder} style={{ backgroundColor: '#f0f0f0', borderRadius: 14, paddingVertical: 13, alignItems: 'center' }}><Text style={{ fontFamily: F.d700, fontSize: 14, color: '#0b0b0b' }}>Set reminder</Text></Tap>

        <View style={{ gap: 10, marginTop: 4 }}>
          {upcoming.length === 0 ? (
            <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.ink3 }}>No reminders yet. Set a contest and get a countdown.</Text>
          ) : (
            upcoming.map((r: any) => {
              const p = PLATFORMS.find((x) => x.k === r.platform);
              return (
                <View key={r.id} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#222', backgroundColor: '#121216', gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: p?.c || '#888' }} />
                    <Text style={{ flex: 1, fontFamily: F.b600, fontSize: 14, color: '#ededed' }} numberOfLines={1}>{r.name}</Text>
                    <Tap kind="light" onPress={() => reminders.remove(r.id)} hitSlop={8}><IconTrash color="#9a9a9a" size={15} /></Tap>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink2 }}>{new Date(r.starts_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>
                    <Text style={{ fontFamily: F.b700, fontSize: 12, color: C.ink2 }}>{countdown(r.starts_at)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Card>
        </View>
      </Cols>

      <Modal open={!!confirmPlan} onClose={() => setConfirmPlan(null)} title="Delete plan?" maxWidth={360}>
        <Text style={{ fontFamily: F.b500, fontSize: 13.5, color: '#e6e6e6', lineHeight: 20 }}>
          Delete “{confirmPlan}” and all its problems?
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <Tap onPress={() => setConfirmPlan(null)} style={{ flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}><Text style={{ fontFamily: F.b600, color: C.ink2 }}>Cancel</Text></Tap>
          <Tap kind="medium" onPress={() => confirmPlan && removePlan(confirmPlan)} style={{ flex: 1, backgroundColor: '#b23b3b', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}><Text style={{ fontFamily: F.d700, color: '#fff' }}>Delete</Text></Tap>
        </View>
      </Modal>
    </Screen>
  );
}

const inputStyle: any = {
  fontFamily: F.b500,
  fontSize: 13.5,
  color: C.ink,
  backgroundColor: C.chip,
  borderColor: C.line,
  borderWidth: 1,
  borderRadius: 13,
  paddingHorizontal: 13,
  paddingVertical: 11,
};
