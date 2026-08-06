import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { C, F } from '../theme';

function Stub({ title }: { title: string }) {
  return (
    <Screen>
      <View style={{ paddingTop: 20, gap: 6 }}>
        <Text style={{ fontFamily: F.d800, fontSize: 30, color: C.ink }}>{title}</Text>
        <Text style={{ fontFamily: F.b500, fontSize: 13, color: C.ink3 }}>Coming up next in the native port…</Text>
      </View>
    </Screen>
  );
}

export const DsaScreen = () => <Stub title="DSA" />;
export const DsaPlanScreen = () => <Stub title="Plan" />;
export const CsCoreScreen = () => <Stub title="CS Core" />;
export const SystemDesignScreen = () => <Stub title="System Design" />;
export const MlQuantScreen = () => <Stub title="ML · Quant" />;
export const FullStackScreen = () => <Stub title="Full Stack" />;
export const SearchScreen = () => <Stub title="Search" />;
