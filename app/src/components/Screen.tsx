import { useNavigation, useNavigationState } from '@react-navigation/native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F } from '../theme';
import { useResponsive } from '../lib/responsive';
import { globalStreak } from '../lib/progress';
import { FlameFire, IconCs, IconDsa, IconHome, IconLld, IconMl, IconSearch, IconStack, IconSys } from './icons';
import { LodestarMark } from './svg';
import { Tap } from './ui';

const TABS = [
  { route: 'Home', Icon: IconHome },
  { route: 'DSA', Icon: IconDsa },
  { route: 'MlQuant', Icon: IconMl },
  { route: 'CsCore', Icon: IconCs },
  { route: 'SystemDesign', Icon: IconSys },
  { route: 'FullStack', Icon: IconStack },
  { route: 'LLD', Icon: IconLld },
  { route: 'Search', Icon: IconSearch },
];

export function TopNavbar() {
  const nav = useNavigation<any>();
  const current = useNavigationState((s) => s.routes[s.index]?.name);
  const { contentW, isTablet } = useResponsive();
  const streak = globalStreak();
  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8, alignItems: 'center' }}>
      <View
        style={{
          width: isTablet ? contentW : '100%',
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(18,18,22,0.92)',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 6,
        }}
      >
        <View style={{ paddingHorizontal: 6 }}>
          <LodestarMark size={22} />
        </View>
        {streak > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4, backgroundColor: 'rgba(255,125,41,0.12)', borderColor: 'rgba(255,125,41,0.3)', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
            <FlameFire size={13} />
            <Text style={{ fontFamily: F.b700, fontSize: 12, color: '#ff9d4d' }}>{streak}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        {TABS.map((t) => {
          const active = current === t.route;
          return (
            <Tap
              key={t.route}
              kind="select"
              onPress={() => nav.navigate(t.route)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
            >
              <t.Icon color={active ? '#fff' : 'rgba(255,255,255,0.6)'} size={18} />
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

export function Screen({
  children,
  scroll = true,
}: {
  children?: React.ReactNode;
  scroll?: boolean;
}) {
  const { contentW, isTablet } = useResponsive();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: C.bg }}>
        <TopNavbar />
      </SafeAreaView>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 48, paddingTop: 4, alignItems: isTablet ? 'center' : 'stretch' }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: isTablet ? contentW : '100%' }}>{children}</View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, alignItems: isTablet ? 'center' : 'stretch' }}>
          <View style={{ flex: 1, width: isTablet ? contentW : '100%' }}>{children}</View>
        </View>
      )}
    </View>
  );
}
