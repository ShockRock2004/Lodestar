import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Card, Tap } from '../components/ui';
import { ODIN_ITEMS } from '../lib/odin';
import { PLANS } from '../lib/plans';
import { getStore } from '../lib/store';
import { C, F } from '../theme';

const ROUTES: Record<string, { to: string; label: string }> = {
  'system-design': { to: 'SystemDesign', label: 'System Design' },
  math: { to: 'MlQuant', label: 'ML · Quant · Math' },
  handson: { to: 'MlQuant', label: 'ML · Quant · Hands-On' },
};
const SCOPES = [
  { k: 'all', label: 'All' },
  { k: 'reading', label: 'Reading' },
  { k: 'cs', label: 'CS Core' },
  { k: 'quant', label: 'Quant' },
  { k: 'dsa', label: 'DSA' },
  { k: 'contest', label: 'Contests' },
  { k: 'odin', label: 'Full Stack' },
];

type Doc = { scope: string; section: string; to: string; title: string; sub: string; text: string };

function buildDocs(): Doc[] {
  const docs: Doc[] = [];
  Object.values(PLANS).forEach((plan: any) => {
    const r = ROUTES[plan.id];
    if (!r) return;
    const st = getStore(`read:${plan.id}`, { notes: {} });
    plan.days.forEach((d: any) =>
      docs.push({
        scope: 'reading', section: r.label, to: r.to,
        title: `Day ${d.n} · ${d.chapters.join(' · ')}`, sub: `pp. ${d.from}–${d.to}`,
        text: `${plan.title} day ${d.n} ${d.chapters.join(' ')} ${d.group} ${st.notes?.[d.n] || ''}`,
      }),
    );
  });
  getStore<any[]>('col:quant', []).forEach((q) =>
    docs.push({ scope: 'quant', section: 'Quant', to: 'MlQuant', title: q.prompt || 'Question', sub: [q.topic, q.difficulty].filter(Boolean).join(' · '), text: `${q.prompt} ${q.topic} ${q.difficulty} ${q.notes || ''}` }),
  );
  getStore<any[]>('col:dsa', []).forEach((p) => {
    const topics = Array.isArray(p.topics) ? p.topics.join(' ') : p.topic || '';
    docs.push({ scope: 'dsa', section: 'DSA', to: 'DSA', title: p.title, sub: [p.difficulty, topics.trim() || null, p.status === 'todo' ? 'To-do' : p.score ? `scored ${p.score}/5` : null].filter(Boolean).join(' · '), text: `${p.title} ${p.difficulty} ${topics} ${p.notes || ''} ${p.status || ''}` });
  });
  getStore<any[]>('col:contests', []).forEach((c) =>
    docs.push({ scope: 'contest', section: 'Contest', to: 'DSA', title: c.name || 'Contest', sub: [c.platform, c.starts_at?.slice(0, 10)].filter(Boolean).join(' · '), text: `${c.name} ${c.platform} contest ${c.starts_at || ''}` }),
  );
  getStore<any[]>('cs:topics', []).forEach((r) =>
    docs.push({ scope: 'cs', section: `CS · ${r.subject || 'Core'}`, to: 'CsCore', title: r.chapter || 'Topics', sub: r.subject || 'CS Core', text: `${r.subject} ${r.chapter} ${r.topics}` }),
  );
  (ODIN_ITEMS as any[]).forEach((it) =>
    docs.push({ scope: 'odin', section: `Full Stack · ${it.course}`, to: 'FullStack', title: it.title, sub: `${it.section} · ${it.type}`, text: `${it.title} ${it.course} ${it.section} ${it.type}` }),
  );
  return docs;
}

function score(text: string, q: string) {
  text = text.toLowerCase();
  q = q.trim().toLowerCase();
  if (!q) return 0;
  if (text.includes(q)) return 100 - Math.min(50, text.indexOf(q) / 5);
  const toks = q.split(/\s+/);
  if (toks.length > 1 && toks.every((t) => text.includes(t))) return 60;
  let i = 0;
  for (const ch of text) { if (ch === q[i]) i++; if (i === q.length) return 30; }
  return 0;
}

export default function Search() {
  const nav = useNavigation<any>();
  const [q, setQ] = useState('');
  const [scope, setScope] = useState('all');
  const docs = useMemo(buildDocs, []);
  const results = useMemo(() => {
    if (!q.trim()) return [] as Doc[];
    return docs
      .filter((d) => scope === 'all' || d.scope === scope)
      .map((d) => ({ d, s: score(d.text, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 60)
      .map((x) => x.d);
  }, [q, scope, docs]);
  const groups = useMemo(() => {
    const m: Record<string, Doc[]> = {};
    const order: string[] = [];
    results.forEach((r) => { if (!m[r.section]) { m[r.section] = []; order.push(r.section); } m[r.section].push(r); });
    return order.map((s) => ({ section: s, items: m[s] }));
  }, [results]);

  return (
    <Screen>
      <View style={{ marginTop: 10, marginBottom: 6 }}>
        <Text style={{ fontFamily: F.b600, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: C.ink3 }}>Find anything</Text>
        <Text style={{ fontFamily: F.d800, fontSize: 30, color: C.ink }}>Search</Text>
      </View>
      <View style={{ marginTop: 8, marginBottom: 12, justifyContent: 'center' }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search days, chapters, CS topics, questions…"
          placeholderTextColor={C.ink4}
          style={{ fontFamily: F.b500, fontSize: 14, color: C.ink, backgroundColor: C.chip, borderColor: C.line, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, paddingRight: q ? 40 : 14 }}
          autoFocus
        />
        {q ? (
          <Tap kind="light" onPress={() => setQ('')} hitSlop={8} style={{ position: 'absolute', right: 12, width: 22, height: 22, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.ink2, fontSize: 14, lineHeight: 16 }}>×</Text>
          </Tap>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {SCOPES.map((s) => {
          const on = scope === s.k;
          return (
            <Tap key={s.k} kind="select" onPress={() => setScope(s.k)} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: on ? '#3d3d3d' : '#242424', backgroundColor: on ? '#20202a' : '#131317' }}>
              <Text style={{ fontFamily: F.b600, fontSize: 12, color: on ? '#fff' : '#b6b6b6' }}>{s.label}</Text>
            </Tap>
          );
        })}
      </View>
      {!q.trim() ? (
        <Card>
          <Text style={{ fontFamily: F.d700, fontSize: 15, color: C.ink }}>Search across everything</Text>
          <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink3, marginTop: 4 }}>Reading days, CS Core topics, quant questions, DSA problems, contests, and your notes.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {['consistent hashing', 'PCA', 'probability', 'two pointer', 'Codeforces'].map((ex) => (
              <Tap key={ex} kind="select" onPress={() => setQ(ex)} style={{ borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, borderWidth: 1, borderColor: '#242424', backgroundColor: '#131317' }}>
                <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink2 }}>Try: {ex}</Text>
              </Tap>
            ))}
          </View>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <Text style={{ fontFamily: F.d700, fontSize: 15, color: C.ink }}>No matches for “{q}”</Text>
          <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink3, marginTop: 4 }}>Try a chapter name, a topic, or part of a note.</Text>
        </Card>
      ) : (
        <View style={{ gap: 14 }}>
          <Text style={{ fontFamily: F.b600, fontSize: 12, color: C.ink3 }}>{results.length} result{results.length === 1 ? '' : 's'}</Text>
          {groups.map((g) => (
            <View key={g.section} style={{ gap: 6 }}>
              <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: C.ink3 }}>{g.section} · {g.items.length}</Text>
              {g.items.map((r, i) => (
                <Tap key={i} kind="light" onPress={() => nav.navigate(r.to)}>
                  <Card style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: F.d700, fontSize: 14, color: C.ink }} numberOfLines={1}>{r.title}</Text>
                      {r.sub ? <Text style={{ fontFamily: F.b500, fontSize: 12, color: C.ink3, marginTop: 2 }} numberOfLines={1}>{r.sub}</Text> : null}
                    </View>
                    <Text style={{ color: C.ink3, fontSize: 16 }}>→</Text>
                  </Card>
                </Tap>
              ))}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
