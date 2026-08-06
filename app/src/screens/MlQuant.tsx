import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Text, TextInput, View } from 'react-native';
import { CalendarCard } from '../components/CalendarCard';
import { Dropdown, Segmented, Stepper } from '../components/controls';
import { IconBack, IconChevron } from '../components/icons';
import { Modal } from '../components/Modal';
import ReadingTracker from '../components/ReadingTracker';
import { Screen } from '../components/Screen';
import { Donut } from '../components/svg';
import { Card, Chip, Cols, Tap } from '../components/ui';
import { useCollection } from '../lib/progress';
import { useResponsive } from '../lib/responsive';
import { C, DIFF_COLOR, diffTone, F } from '../theme';

const dayKey = (x: any) => {
  const d = new Date(x.created || Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const prettyDate = (iso: string) => new Date(iso + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const DIFF_OPTS = [{ v: 'Easy', l: 'Easy' }, { v: 'Medium', l: 'Medium' }, { v: 'Hard', l: 'Hard' }];
const DIFFS = ['Easy', 'Medium', 'Hard'];
const Q_PAGE = 5;

function ChevLeft({ size = 16 }: { size?: number }) {
  return <View style={{ transform: [{ rotate: '180deg' }] }}><IconChevron color={C.ink} size={size} sw={2.2} /></View>;
}

function QuantBank() {
  const { isWide } = useResponsive();
  const { items, add, update, remove } = useCollection('quant');
  const [form, setForm] = useState({ prompt: '', link: '', topic: '', difficulty: 'Medium' });
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [openNote, setOpenNote] = useState<any>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [openQ, setOpenQ] = useState<any>(null);
  const [bankPage, setBankPage] = useState(0);

  const solved = items.filter((x: any) => x.solved).length;
  const byDiff: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
  const solvedByDiff: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
  items.forEach((x: any) => { if (byDiff[x.difficulty] != null) { byDiff[x.difficulty]++; if (x.solved) solvedByDiff[x.difficulty]++; } });
  const dayset = useMemo(() => new Set(items.map(dayKey)), [items]);
  const dayItems = useMemo(() => (openDay ? items.filter((x: any) => dayKey(x) === openDay) : []), [items, openDay]);
  const detail = openQ ? items.find((x: any) => x.id === openQ) : null;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items.filter((x: any) => {
      if (filter === 'solved' && !x.solved) return false;
      if (filter === 'unsolved' && x.solved) return false;
      if (DIFFS.includes(filter) && x.difficulty !== filter) return false;
      if (t && !`${x.prompt} ${x.topic} ${x.difficulty}`.toLowerCase().includes(t)) return false;
      return true;
    });
  }, [items, filter, q]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / Q_PAGE));
  const curPage = Math.min(bankPage, pageCount - 1);
  const pageItems = filtered.slice(curPage * Q_PAGE, curPage * Q_PAGE + Q_PAGE);
  useEffect(() => { setBankPage(0); }, [filter, q]);

  const submit = () => {
    if (!form.prompt.trim()) return;
    add({ ...form, attempts: 0, solved: false, notes: '' });
    setForm({ prompt: '', link: '', topic: '', difficulty: 'Medium' });
    setAddOpen(false);
  };

  const FILTERS = [
    { k: 'all', label: 'All' }, { k: 'unsolved', label: 'To do' }, { k: 'solved', label: 'Solved' },
    { k: 'Easy', label: 'Easy' }, { k: 'Medium', label: 'Medium' }, { k: 'Hard', label: 'Hard' },
  ];

  return (
    <View style={{ gap: 14 }}>
      <Cols active={isWide} weights={[1, 1, 1]}>
        {/* LEFT — progress + add */}
        <View style={{ gap: 14 }}>
      {/* PROGRESS */}
      <Card>
        <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3, marginBottom: 14 }}>Progress</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <Donut size={104} stroke={13} segments={DIFFS.map((d) => ({ label: d, value: solvedByDiff[d], color: DIFF_COLOR[d] }))}>
            <Text style={{ fontFamily: F.d800, fontSize: 24, color: C.ink }}>{solved}</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 10, color: C.ink3 }}>solved</Text>
          </Donut>
          <View style={{ flex: 1, gap: 10 }}>
            {DIFFS.map((d) => (
              <View key={d} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 9, height: 9, borderRadius: 99, backgroundColor: DIFF_COLOR[d] }} />
                <Text style={{ fontFamily: F.b600, fontSize: 13, color: C.ink2, flex: 1 }}>{d}</Text>
                <Text style={{ fontFamily: F.d700, fontSize: 13, color: C.ink }}>{solvedByDiff[d]}<Text style={{ fontFamily: F.b500, color: C.ink3 }}> / {byDiff[d]}</Text></Text>
              </View>
            ))}
          </View>
        </View>
      </Card>

      {/* ADD */}
      <Card>
        <Tap kind="select" onPress={() => setAddOpen((o) => !o)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3 }}>Add a question</Text>
          <View style={{ transform: [{ rotate: addOpen ? '180deg' : '0deg' }] }}><IconChevron color={C.ink3} size={16} sw={2.2} /></View>
        </Tap>
        {addOpen ? (
          <View style={{ gap: 10, marginTop: 14 }}>
            <TextInput value={form.prompt} onChangeText={(t) => setForm({ ...form, prompt: t })} placeholder="Question prompt…" placeholderTextColor={C.ink4} multiline
              style={{ fontFamily: F.b500, fontSize: 13, color: C.ink, backgroundColor: C.chip, borderColor: C.line, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 64, textAlignVertical: 'top' }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput value={form.topic} onChangeText={(t) => setForm({ ...form, topic: t })} placeholder="Topic (e.g. probability)" placeholderTextColor={C.ink4}
                style={{ flex: 1, fontFamily: F.b500, fontSize: 13, color: C.ink, backgroundColor: C.chip, borderColor: C.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 }} />
              <View style={{ width: 120 }}><Dropdown value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v })} options={DIFF_OPTS} title="Difficulty" /></View>
            </View>
            <TextInput value={form.link} onChangeText={(t) => setForm({ ...form, link: t })} placeholder="Source link (optional)" placeholderTextColor={C.ink4}
              style={{ fontFamily: F.b500, fontSize: 13, color: C.ink, backgroundColor: C.chip, borderColor: C.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 }} />
            <Tap kind="medium" onPress={submit} style={{ backgroundColor: '#f0f0f0', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ fontFamily: F.d700, fontSize: 14, color: '#0b0b0b' }}>Add question</Text>
            </Tap>
          </View>
        ) : null}
      </Card>
        </View>

        {/* CENTER — calendar */}
        <View style={{ gap: 14 }}>
      {/* CALENDAR */}
      <CalendarCard markedDates={dayset as Set<string>} onPick={(iso) => { setOpenDay(iso); setOpenQ(null); }} title="Question calendar" subtitle="Grey days have questions — tap a day to review them." />
        </View>

        {/* RIGHT — search + bank */}
        <View style={{ gap: 14 }}>
      {/* SEARCH + FILTERS */}
      <Card>
        <TextInput value={q} onChangeText={setQ} placeholder="Search questions…" placeholderTextColor={C.ink4}
          style={{ fontFamily: F.b500, fontSize: 14, color: C.ink, backgroundColor: C.chip, borderColor: C.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {FILTERS.map((f) => {
            const on = filter === f.k;
            return (
              <Tap key={f.k} kind="select" onPress={() => setFilter(f.k)} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: on ? '#3d3d3d' : '#242424', backgroundColor: on ? '#20202a' : '#131317' }}>
                <Text style={{ fontFamily: F.b600, fontSize: 12, color: on ? '#fff' : '#b6b6b6' }}>{f.label}</Text>
              </Tap>
            );
          })}
        </View>
      </Card>

      {/* BANK */}
      <Card>
        <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.ink3, marginBottom: 12 }}>Question bank · {solved}/{items.length} solved</Text>
        {items.length === 0 ? (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ fontFamily: F.d700, fontSize: 14, color: C.ink }}>No questions yet</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.ink3, marginTop: 4 }}>Add questions to build your bank — browse them by date on the calendar.</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ fontFamily: F.d700, fontSize: 14, color: C.ink }}>No matches</Text>
            <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.ink3, marginTop: 4 }}>Try a different filter or clear the search.</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {pageItems.map((x: any) => (
              <View key={x.id} style={{ borderWidth: 1, borderColor: C.line3, borderRadius: 14, padding: 12, opacity: x.solved ? 0.72 : 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={{ fontFamily: F.b600, fontSize: 13.5, color: C.ink, flex: 1 }}>{x.prompt}</Text>
                  <Tap kind="medium" onPress={() => remove(x.id)} hitSlop={6}><Text style={{ color: C.ink3, fontSize: 18, lineHeight: 18 }}>×</Text></Tap>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {x.topic ? <Chip>{x.topic}</Chip> : null}
                  <Chip tone={diffTone(x.difficulty) as any}>{x.difficulty}</Chip>
                  {x.link ? <Tap kind="light" onPress={() => Linking.openURL(x.link)}><Text style={{ fontFamily: F.b600, fontSize: 11.5, color: C.ink2 }}>Open ↗</Text></Tap> : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  <Stepper value={x.attempts} onDec={() => update(x.id, { attempts: Math.max(0, (x.attempts || 0) - 1) })} onInc={() => update(x.id, { attempts: (x.attempts || 0) + 1 })} />
                  <Tap kind="medium" onPress={() => update(x.id, { solved: !x.solved })} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: x.solved ? `${C.easy}26` : 'rgba(255,255,255,0.06)' }}>
                    <Text style={{ fontFamily: F.b700, fontSize: 12, color: x.solved ? C.easy : C.ink2 }}>{x.solved ? 'Solved ✓' : 'Mark solved'}</Text>
                  </Tap>
                  <Tap kind="select" onPress={() => setOpenNote(openNote === x.id ? null : x.id)}><Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink3 }}>Notes</Text></Tap>
                </View>
                {openNote === x.id ? (
                  <TextInput value={x.notes || ''} onChangeText={(t) => update(x.id, { notes: t })} placeholder="Working / insight…" placeholderTextColor={C.ink4} multiline
                    style={{ marginTop: 10, fontFamily: F.b500, fontSize: 13, color: C.ink, backgroundColor: C.chip, borderColor: C.line, borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 56, textAlignVertical: 'top' }} />
                ) : null}
              </View>
            ))}
            {pageCount > 1 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 4 }}>
                <Tap kind="select" onPress={() => setBankPage(curPage - 1)} disabled={curPage === 0} style={{ opacity: curPage === 0 ? 0.3 : 1 }}><ChevLeft /></Tap>
                <Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink3 }}>Page {curPage + 1} of {pageCount}</Text>
                <Tap kind="select" onPress={() => setBankPage(curPage + 1)} disabled={curPage >= pageCount - 1} style={{ opacity: curPage >= pageCount - 1 ? 0.3 : 1 }}><IconChevron color={C.ink} size={16} sw={2.2} /></Tap>
              </View>
            ) : null}
          </View>
        )}
      </Card>
        </View>
      </Cols>

      {/* DAY MODAL */}
      <Modal open={!!openDay} onClose={() => { setOpenDay(null); setOpenQ(null); }} title={openDay ? prettyDate(openDay) : ''}>
        {dayItems.length ? (
          <View style={{ gap: 8 }}>
            {dayItems.map((x: any) => (
              <Tap key={x.id} kind="light" onPress={() => setOpenQ(x.id)} style={{ borderWidth: 1, borderColor: C.line3, borderRadius: 12, padding: 12, opacity: x.solved ? 0.7 : 1 }}>
                <Text style={{ fontFamily: F.b600, fontSize: 13, color: C.ink }}>{x.prompt}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  {x.topic ? <Chip>{x.topic}</Chip> : null}
                  <Chip tone={diffTone(x.difficulty) as any}>{x.difficulty}</Chip>
                  {x.solved ? <Text style={{ fontFamily: F.b700, fontSize: 11, color: C.easy }}>Solved ✓</Text> : null}
                </View>
              </Tap>
            ))}
          </View>
        ) : <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink3 }}>No questions entered on this day.</Text>}
      </Modal>

      {/* QUESTION DETAIL MODAL */}
      <Modal open={!!detail} onClose={() => setOpenQ(null)} title="Question" maxWidth={540}>
        {detail ? (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Chip tone={diffTone(detail.difficulty) as any}>{detail.difficulty}</Chip>
              {detail.topic ? <Chip>{detail.topic}</Chip> : null}
              {detail.link ? <Tap kind="light" onPress={() => Linking.openURL(detail.link)}><Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink2 }}>Open ↗</Text></Tap> : null}
            </View>
            <Text style={{ fontFamily: F.b500, fontSize: 15, color: C.ink, marginTop: 14, lineHeight: 22 }}>{detail.prompt}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              <Stepper value={detail.attempts} onDec={() => update(detail.id, { attempts: Math.max(0, (detail.attempts || 0) - 1) })} onInc={() => update(detail.id, { attempts: (detail.attempts || 0) + 1 })} />
              <Tap kind="medium" onPress={() => update(detail.id, { solved: !detail.solved })} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: detail.solved ? `${C.easy}26` : '#f0f0f0' }}>
                <Text style={{ fontFamily: F.d700, fontSize: 13, color: detail.solved ? C.easy : '#0b0b0b' }}>{detail.solved ? 'Solved ✓' : 'Mark solved'}</Text>
              </Tap>
            </View>
            <Text style={{ fontFamily: F.b600, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: C.ink3, marginTop: 18, marginBottom: 6 }}>Your notes</Text>
            <TextInput value={detail.notes || ''} onChangeText={(t) => update(detail.id, { notes: t })} placeholder="Your working / insight…" placeholderTextColor={C.ink4} multiline
              style={{ fontFamily: F.b500, fontSize: 13, color: C.ink, backgroundColor: C.chip, borderColor: C.line, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 90, textAlignVertical: 'top' }} />
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

export default function MlQuant() {
  const nav = useNavigation<any>();
  const [tab, setTab] = useState('handson');
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 14 }}>
        <Tap kind="light" onPress={() => nav.goBack()} style={{ width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip }}>
          <IconBack color={C.ink} size={18} sw={2} />
        </Tap>
        <View>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: C.ink3 }}>Reading + daily quant</Text>
          <Text style={{ fontFamily: F.d800, fontSize: 26, color: C.ink }}>ML · Quant</Text>
        </View>
      </View>
      <View style={{ marginBottom: 16 }}>
        <Segmented value={tab} onChange={setTab} options={[
          { value: 'handson', label: 'HOML' },
          { value: 'math', label: 'MML' },
          { value: 'quant', label: 'Quant' },
        ]} />
      </View>
      {tab === 'handson' ? <ReadingTracker planId="handson" chapterFocus /> : null}
      {tab === 'math' ? <ReadingTracker planId="math" chapterFocus /> : null}
      {tab === 'quant' ? <QuantBank /> : null}
    </Screen>
  );
}
