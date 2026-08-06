import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Text, View } from 'react-native';
import { IconBack } from '../components/icons';
import ReadingTracker from '../components/ReadingTracker';
import { Screen } from '../components/Screen';
import { Tap } from '../components/ui';
import { C, F } from '../theme';

export default function SystemDesign() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 14 }}>
        <Tap kind="light" onPress={() => nav.goBack()} style={{ width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', backgroundColor: C.chip }}>
          <IconBack color={C.ink} size={18} sw={2} />
        </Tap>
        <View>
          <Text style={{ fontFamily: F.b700, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: C.ink3 }}>Reading · 70 days</Text>
          <Text style={{ fontFamily: F.d800, fontSize: 26, color: C.ink }}>System Design</Text>
        </View>
      </View>
      <ReadingTracker planId="system-design" />
    </Screen>
  );
}
