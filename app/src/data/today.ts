import { activityRange, useCollection, useReading } from '../lib/progress';
import { getStore, todayISO } from '../lib/store';
import { scheduleInfo, fmtDate } from '../lib/schedule';
import { LLD_TOTAL_DAYS } from '../lib/lld';

export const doneToday = (r: any) =>
  Object.entries(r.done)
    .filter(([, ts]) => String(ts).slice(0, 10) === todayISO())
    .map(([n]) => +n);

export const toggleToday = (r: any) => {
  const t = doneToday(r);
  if (t.length) {
    r.toggle(Math.max(...t));
    return;
  }
  if (r.finished) return;
  r.toggle(r.currentDay);
};

export const dayOf = (r: any) => r.plan.days[r.currentDay - 1];

export function globalStreak() {
  const range = activityRange(120);
  let s = 0,
    i = range.length - 1;
  if (range[i] && range[i].count === 0) i--;
  for (; i >= 0 && range[i] && range[i].count > 0; i--) s++;
  return s;
}

export function useToday() {
  const sd = useReading('system-design');
  const ma = useReading('math');
  const ho = useReading('handson');
  const dsa = useCollection('dsa');
  const cs = getStore('cs:stats', { done: 0, total: 46, pct: 0 });
  const odin = getStore('odin:stats', { done: 0, total: 197, pct: 0 });
  const lld = getStore('lld:stats', { done: 0, total: 0, pct: 0, doneDays: 0 }) as any;
  const lldBehind = Math.max(0, scheduleInfo('lld', LLD_TOTAL_DAYS).due - (lld.doneDays || 0));

  const dsaToday = dsa.items.find((x: any) => x.date === todayISO());
  const readDone = (r: any) => doneToday(r).length > 0 || r.finished;

  const tracks: any[] = [
    {
      key: 'sd', name: 'System Design', route: 'SystemDesign', pct: sd.pct,
      state: `Day ${sd.currentDay} of ${sd.total}`, late: sd.behind > 0,
      pace: sd.behind ? `${sd.behind}d behind` : 'On track',
    },
    {
      key: 'ml', name: 'ML · Quant', route: 'MlQuant', pct: Math.round((ma.pct + ho.pct) / 2),
      state: `Math d${ma.currentDay} · Hands-On d${ho.currentDay}`,
      late: Math.max(ma.behind, ho.behind) > 0,
      pace: Math.max(ma.behind, ho.behind) ? `${Math.max(ma.behind, ho.behind)}d behind` : 'On track',
    },
    {
      key: 'cs', name: 'CS Core', route: 'CsCore', pct: cs.pct,
      state: `${cs.done} of ${cs.total || 46} topics`, late: false, pace: 'Self-paced',
      objective: 'OS · Computer Networks · DBMS',
    },
    {
      key: 'dsa', name: 'DSA', route: 'DSA', pct: null,
      state: 'Daily practice', late: false, pace: 'Daily',
      objective: dsaToday ? `${dsaToday.title} · ${dsaToday.score}/5` : 'Log today’s LeetCode problem',
    },
    {
      key: 'odin', name: 'Full Stack', route: 'FullStack', pct: odin.pct,
      state: `${odin.done} of ${odin.total} items`, late: false, pace: '4-month plan',
      objective: 'Foundations → JS → React → NodeJS',
    },
    {
      key: 'lld', name: 'Low Level Design', route: 'LLD', pct: lld.pct,
      state: `${lld.doneDays || 0} of ${LLD_TOTAL_DAYS} days`, late: lldBehind > 0,
      pace: lldBehind ? `${lldBehind}d behind` : 'On track',
      objective: 'OOP · patterns · 33 problems',
    },
  ];

  const cand = [
    { name: 'System Design', route: 'SystemDesign', behind: sd.behind, done: readDone(sd), obj: sd.finished ? 'Plan complete' : `${fmtDate(scheduleInfo('system-design', sd.total).dates[Math.min(sd.currentDay, sd.total) - 1])} · pp. ${dayOf(sd).from}–${dayOf(sd).to}` },
    { name: 'Hands-On ML', route: 'MlQuant', behind: ho.behind, done: readDone(ho), obj: ho.finished ? 'Plan complete' : `Day ${ho.currentDay} · pp. ${dayOf(ho).from}–${dayOf(ho).to}` },
    { name: 'Math for ML', route: 'MlQuant', behind: ma.behind, done: readDone(ma), obj: ma.finished ? 'Plan complete' : `Day ${ma.currentDay} · pp. ${dayOf(ma).from}–${dayOf(ma).to}` },
    { name: 'DSA', route: 'DSA', behind: 0, done: !!dsaToday, obj: 'Log today’s LeetCode problem' },
  ];
  const resume = cand.filter((x) => !x.done).sort((a, b) => b.behind - a.behind)[0] || null;

  const ORDER = ['dsa', 'ml', 'cs', 'sd', 'odin', 'lld'];
  tracks.sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  const pcts = tracks.map((t) => t.pct).filter((p) => p != null) as number[];
  const overall = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;

  const allItems = [sd, ma, ho].map((r) => readDone(r)).concat([!!dsaToday]);
  const done = allItems.filter(Boolean).length;
  return { tracks, resume, streak: globalStreak(), overall, completion: { done, total: allItems.length } };
}
