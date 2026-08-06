import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { FlameFire, IconChevron, IconCs, IconDsa, IconLld, IconMl, IconStack, IconSys } from '../components/icons';
import { Ring } from '../components/svg';
import { Bar, Card, Eyebrow, Tap } from '../components/ui';
import { useToday } from '../data/today';
import { CalendarCard } from '../components/CalendarCard';
import { Modal } from '../components/Modal';
import { activityLast7, activitySectionLevels, entriesForDate, globalStreak, readingStats } from '../lib/progress';
import { useResponsive } from '../lib/responsive';
import { getStore, todayISO, useStore } from '../lib/store';
import { BAR, C, F } from '../theme';

const H = new Date().getHours();
const GREET = H < 12 ? 'Good morning' : H < 18 ? 'Good afternoon' : 'Good evening';
const DATESTR = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const TRACK_ICON: Record<string, any> = {
  dsa: IconDsa, ml: IconMl, cs: IconCs, sd: IconSys, odin: IconStack, lld: IconLld,
};

function TrackCard({ t }: { t: any }) {
  const nav = useNavigation<any>();
  const Icon = TRACK_ICON[t.key];
  return (
    <Tap kind="light" onPress={() => nav.navigate(t.route)}>
      <Card style={{ minHeight: 132, justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', right: -14, top: 0, bottom: 0, justifyContent: 'center', opacity: 0.5 }}>
          <Icon color="#8f8f8f" size={130} sw={1.2} />
        </View>
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: F.d800, fontSize: 23, color: C.white, letterSpacing: -0.4 }}>{t.name}</Text>
          {t.late ? (
            <View style={{ alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(255,64,64,0.10)', borderWidth: 1, borderColor: 'rgba(255,86,86,0.24)' }}>
              <Text style={{ fontFamily: F.b600, fontSize: 11.5, color: '#ff6b6b' }}>{t.pace}</Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Tap>
  );
}

function ScheduleCard() {
  const today = todayISO();
  const [notif, setNotif] = useStore('notif:contests', true);
  const rel = (iso: string) => {
    const n = Math.round((+new Date(iso + 'T00:00') - +new Date(today + 'T00:00')) / 86400000);
    return n <= 0 ? 'Today' : n === 1 ? 'Tomorrow' : `in ${n}d`;
  };
  const contests = (getStore<any[]>('col:contests', []) || [])
    .filter((c) => c.starts_at && c.starts_at.slice(0, 10) >= today)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 3);
  return (
    <Card style={{ padding: 22, gap: 2 }}>
      <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink2 }}>Schedule</Text>
      <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.ink3, marginTop: 2 }}>Upcoming contests you registered.</Text>
      <View style={{ marginTop: 12, gap: 4, minHeight: 40 }}>
        {contests.length ? (
          contests.map((c) => (
            <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
              <Text style={{ width: 70, fontFamily: F.b600, fontSize: 12, color: C.ink }}>{rel(c.starts_at.slice(0, 10))}</Text>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontFamily: F.b500, fontSize: 13, color: '#fafafa' }}>{c.name}</Text>
                <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: C.ink3 }}>{c.platform}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.ink3 }}>No contests registered. Add one on the DSA page.</Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#191919' }}>
        <Text style={{ flex: 1, fontFamily: F.b500, fontSize: 13, color: C.ink }}>Contest notifications</Text>
        <Tap kind="select" onPress={() => setNotif((v) => !v)}>
          <View style={{ width: 44, height: 26, borderRadius: 999, padding: 3, backgroundColor: notif ? '#e6e6e6' : '#2a2a2a', alignItems: notif ? 'flex-end' : 'flex-start' }}>
            <View style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: notif ? '#0b0b0b' : '#8a8a8a' }} />
          </View>
        </Tap>
      </View>
    </Card>
  );
}

function Momentum() {
  const a = activityLast7();
  const streak = globalStreak();
  return (
    <Card style={{ padding: 22 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink2 }}>Momentum</Text>
        {streak > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,125,41,0.12)', borderColor: 'rgba(255,125,41,0.3)', borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3.5 }}>
            <FlameFire size={13} />
            <Text style={{ fontFamily: F.b700, fontSize: 12, color: '#ff9d4d' }}>{streak} day{streak === 1 ? '' : 's'}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ fontFamily: F.d800, fontSize: 26, color: C.ink, marginTop: 4 }}>
        {a.total} <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink3 }}>this week</Text>
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 44, marginTop: 14 }}>
        {a.values.map((v: number, i: number) => (
          <View key={i} style={{ flex: 1, justifyContent: 'flex-end', height: '100%' }}>
            <View style={{ width: '100%', height: Math.max(3, (v / 100) * 44), borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.12)' }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        {a.labels.map((l: string, i: number) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontFamily: F.b500, fontSize: 10, color: C.ink4 }}>{l}</Text>
        ))}
      </View>
    </Card>
  );
}

function HomeCalendar() {
  const nav = useNavigation<any>();
  const [openDay, setOpenDay] = useState<string | null>(null);
  const heat = useMemo(() => activitySectionLevels(), []);
  const sections = openDay
    ? [
        { name: 'ML', pct: Math.round((readingStats('math').pct + readingStats('handson').pct) / 2) },
        { name: 'System Design', pct: readingStats('system-design').pct },
        { name: 'CS Core', pct: getStore('cs:stats', { pct: 0 }).pct },
        { name: 'Full Stack', pct: getStore('odin:stats', { pct: 0 }).pct },
      ]
    : [];
  const overall = sections.length ? Math.round(sections.reduce((a, s) => a + s.pct, 0) / sections.length) : 0;
  const entries = openDay ? entriesForDate(openDay) : [];
  return (
    <>
      <CalendarCard heatLevels={heat} onPick={setOpenDay} title="Calendar" legend />
      <Modal
        open={!!openDay}
        onClose={() => setOpenDay(null)}
        title={openDay ? new Date(openDay + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
        maxWidth={440}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <Eyebrow>Overall completion</Eyebrow>
          <Text style={{ fontFamily: F.d800, fontSize: 26, color: '#f4f4f4' }}>{overall}%</Text>
        </View>
        <View style={{ gap: 11 }}>
          {sections.map((s) => (
            <View key={s.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ width: 96, fontFamily: F.b500, fontSize: 12.5, color: '#b0b0b0' }}>{s.name}</Text>
              <View style={{ flex: 1 }}>
                <Bar pct={s.pct} height={5} track="rgba(255,255,255,0.05)" fill={BAR[1]} />
              </View>
              <Text style={{ fontFamily: F.b700, fontSize: 11.5, color: '#cfcfcf', width: 34, textAlign: 'right' }}>{s.pct}%</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', gap: 4 }}>
          <Eyebrow style={{ marginBottom: 6 }}>Activity this day</Eyebrow>
          {entries.length ? (
            entries.map((e: any, i: number) => (
              <Tap
                key={i}
                kind="light"
                onPress={() => {
                  setOpenDay(null);
                  const map: Record<string, string> = { '/dsa': 'DSA', '/ml-quant': 'MlQuant', '/system-design': 'SystemDesign', '/cs-core': 'CsCore', '/full-stack': 'FullStack' };
                  if (map[e.to]) nav.navigate(map[e.to]);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 7 }}
              >
                <View style={{ borderRadius: 999, borderWidth: 1, borderColor: C.line, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontFamily: F.b700, fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase', color: '#a1a1a1' }}>{e.kind}</Text>
                </View>
                <Text numberOfLines={1} style={{ flex: 1, fontFamily: F.b500, fontSize: 12.5, color: '#d4d4d4' }}>{e.label}</Text>
                <Text style={{ color: C.ink3 }}>→</Text>
              </Tap>
            ))
          ) : (
            <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.ink3, paddingVertical: 4 }}>No activity logged this day.</Text>
          )}
        </View>
      </Modal>
    </>
  );
}

const TL_MONTHS = [
  { m: 'AUG', w: 20 }, { m: 'SEP', w: 26 }, { m: 'OCT', w: 24 }, { m: 'NOV', w: 15 }, { m: 'DEC', w: 15 },
];
const REVISION_START = 77.5, REVISION_END = 85; // Nov 15 → Nov 30
const TL_P1 = [
  { name: 'DSA', Icon: IconDsa, route: 'DSA' },
  { name: 'HLD', Icon: IconSys, route: 'SystemDesign' },
  { name: 'CS Fundamentals', Icon: IconCs, route: 'CsCore' },
];
const TL_P2 = [
  { name: 'LLD', Icon: IconLld, route: 'LLD' },
  { name: 'DSA Contests', Icon: IconDsa, route: 'DSA' },
  { name: 'Projects', Icon: null, route: null },
  { name: 'Intern project', Icon: null, route: null },
  { name: 'SQL 50', Icon: null, route: null },
];

function TLChip({ Icon, name, route }: { Icon: any; name: string; route: string | null }) {
  const nav = useNavigation<any>();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 7 }}>
      {Icon
        ? <LinearGradient colors={['#f0f0f0', '#b2b2b2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 19, height: 19, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}><Icon color="#0c0c0c" size={12} sw={2} /></LinearGradient>
        : <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.45)' }} />}
      <Text style={{ fontFamily: F.b600, fontSize: 12, color: '#e6e6e6' }}>{name}</Text>
    </View>
  );
  return route ? <Tap kind="light" onPress={() => nav.navigate(route)}>{body}</Tap> : body;
}

function TLDownArrow() {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 2 }}>
      <View style={{ transform: [{ rotate: '90deg' }] }}><IconChevron color="rgba(255,255,255,0.35)" size={20} sw={1.8} /></View>
    </View>
  );
}

function TLPhase({ n, range, items }: { n: string; range: string; items: any[] }) {
  return (
    <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.035)', borderRadius: 18, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 2 }}>
        <Text style={{ fontFamily: F.b600, fontSize: 10.5, letterSpacing: 1.4, color: '#8a8a8a' }}>PHASE {n}</Text>
        <Text style={{ fontFamily: F.b600, fontSize: 11.5, color: '#cfcfcf' }}>{range}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {items.map((it) => <TLChip key={it.name} {...it} />)}
      </View>
    </View>
  );
}

function Timeline() {
  const nav = useNavigation<any>();
  return (
    <Card style={{ padding: 22 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <View>
          <Eyebrow>Roadmap</Eyebrow>
          <Text style={{ fontFamily: F.b600, fontSize: 15, color: C.white, marginTop: 4 }}>The road to placements</Text>
        </View>
        <Text style={{ fontFamily: F.b500, fontSize: 12.5, color: C.ink3 }}>Aug – Dec 2026</Text>
      </View>

      {/* ── month ruler with the revision band ── */}
      <View style={{ marginTop: 26 }}>
        <View style={{ position: 'absolute', right: 0, top: -20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: '#111', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontFamily: F.b600, fontSize: 9, letterSpacing: 1.1, color: 'rgba(255,255,255,0.7)' }}>REVISION · NOV 15–30</Text>
        </View>
        <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          {TL_MONTHS.map((mo, i) => (
            <View key={mo.m} style={{ flex: mo.w, paddingHorizontal: 8, paddingVertical: 9, borderRightWidth: i < TL_MONTHS.length - 1 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontFamily: F.b600, fontSize: 11, letterSpacing: 0.6, color: '#cfcfcf' }}>{mo.m}</Text>
            </View>
          ))}
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: `${REVISION_START}%`, width: `${REVISION_END - REVISION_START}%`, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.07)' }} />
        </View>
      </View>

      {/* ── phase flow: Phase 1 → Phase 2 → Revision ── */}
      <View style={{ marginTop: 14, gap: 4 }}>
        <TLPhase n="01" range="Aug – Sep" items={TL_P1} />
        <TLDownArrow />
        <TLPhase n="02" range="October" items={TL_P2} />
        <TLDownArrow />
        <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 18, padding: 14 }}>
          <Text style={{ fontFamily: F.b600, fontSize: 10.5, letterSpacing: 1.4, color: '#8a8a8a' }}>REVISION</Text>
          <Text style={{ fontFamily: F.d800, fontSize: 15, color: C.white, marginTop: 3 }}>Nov 15 – 30</Text>
          <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: '#7c7c7c', marginTop: 1 }}>Consolidate & mock</Text>
        </View>
      </View>

      {/* ── Full Stack — one continuous track ── */}
      <Tap kind="light" onPress={() => nav.navigate('FullStack')} style={{ marginTop: 14 }}>
        <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ height: 48, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <View style={{ position: 'absolute', left: 14, width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5, borderRightWidth: 9, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: 'rgba(255,255,255,0.55)' }} />
          <View style={{ position: 'absolute', right: 14, width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 9, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'rgba(255,255,255,0.55)' }} />
          <LinearGradient colors={['#f0f0f0', '#b2b2b2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}><IconStack color="#0c0c0c" size={15} sw={1.9} /></LinearGradient>
          <Text style={{ fontFamily: F.b700, fontSize: 13.5, color: C.white }}>Full Stack</Text>
          <Text style={{ fontFamily: F.b500, fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>· continuous</Text>
        </LinearGradient>
      </Tap>
    </Card>
  );
}

export default function Home() {
  const nav = useNavigation<any>();
  const { tracks, resume, overall, completion } = useToday();
  const { isTablet } = useResponsive();
  return (
    <Screen>
      {/* greeting */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, marginBottom: 18 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink3 }}>{DATESTR}</Text>
          <Text style={{ fontFamily: F.d800, fontSize: 30, color: C.ink, letterSpacing: -0.5, marginTop: 2 }}>{GREET}</Text>
          <Text style={{ fontFamily: F.b500, fontSize: 13.5, color: C.ink2, marginTop: 4 }}>
            {resume ? (
              <>You’re {resume.behind ? <Text style={{ color: '#ff5252' }}>{resume.behind} days behind</Text> : <Text style={{ color: C.flame }}>on track</Text>} on {resume.name}.</>
            ) : (
              'All caught up today.'
            )}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Ring pct={completion.total ? (completion.done / completion.total) * 100 : 0} size={62} stroke={5}>
            <Text style={{ fontFamily: F.d800, fontSize: 13, color: C.ink }}>{completion.done}/{completion.total}</Text>
          </Ring>
          <Text style={{ fontFamily: F.b600, fontSize: 9, letterSpacing: 1, color: C.ink3, marginTop: 4 }}>TODAY</Text>
        </View>
      </View>

      {/* resume band */}
      {resume ? (
        <Card style={{ marginBottom: 20, gap: 8 }}>
          <Eyebrow>Pick up where you left off</Eyebrow>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Text style={{ fontFamily: F.d800, fontSize: 24, color: C.ink }}>{resume.name}</Text>
            {resume.behind ? (
              <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: 'rgba(255,64,64,0.10)', borderWidth: 1, borderColor: 'rgba(255,86,86,0.24)' }}>
                <Text style={{ fontFamily: F.b600, fontSize: 11.5, color: '#ff6b6b' }}>{resume.behind}d behind</Text>
              </View>
            ) : null}
          </View>
          <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink3 }}>{resume.obj}</Text>
          <Tap kind="medium" onPress={() => nav.navigate(resume.route)} style={{ alignSelf: 'flex-start', marginTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0f0f0', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11 }}>
              <Text style={{ fontFamily: F.d700, fontSize: 14, color: '#0b0b0b' }}>Continue</Text>
              <IconChevron color="#0b0b0b" size={15} />
            </View>
          </Tap>
        </Card>
      ) : null}

      {/* overall bar */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Eyebrow>Overall completion</Eyebrow>
          <Text style={{ fontFamily: F.d800, fontSize: 14, color: C.ink }}>{overall}%</Text>
        </View>
        <Bar pct={overall} height={8} fill="#eaeaea" />
      </View>

      {/* track cards — 2-column grid on tablet, stacked on phone */}
      <View style={{ gap: 14, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {tracks.map((t) => (
            <View key={t.key} style={{ width: isTablet ? '48.5%' : '100%' }}>
              <TrackCard t={t} />
            </View>
          ))}
        </View>
        {isTablet ? (
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}><Momentum /></View>
            <View style={{ flex: 1 }}><HomeCalendar /></View>
          </View>
        ) : (
          <>
            <Momentum />
            <HomeCalendar />
          </>
        )}
        <Timeline />
      </View>
    </Screen>
  );
}
