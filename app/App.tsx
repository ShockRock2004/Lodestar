import './global.css';
import 'react-native-gesture-handler';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplash } from './src/components/AnimatedSplash';
import { startCloudSync } from './src/lib/cloudsync';

SplashScreen.preventAutoHideAsync().catch(() => {});
import CsCore from './src/screens/CsCore';
import Dsa from './src/screens/Dsa';
import DsaPlan from './src/screens/DsaPlan';
import FullStack from './src/screens/FullStack';
import Home from './src/screens/Home';
import Lld from './src/screens/Lld';
import MlQuant from './src/screens/MlQuant';
import Search from './src/screens/Search';
import SystemDesign from './src/screens/SystemDesign';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#050506',
    card: '#050506',
    text: '#ededed',
    border: '#242424',
    primary: '#ffffff',
    notification: '#ff375f',
  },
};

export default function App() {
  const [loaded] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    startCloudSync();
  }, []);

  const onLayout = useCallback(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: '#050506' },
            }}
          >
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="DSA" component={Dsa} />
            <Stack.Screen name="DsaPlan" component={DsaPlan} />
            <Stack.Screen name="CsCore" component={CsCore} />
            <Stack.Screen name="SystemDesign" component={SystemDesign} />
            <Stack.Screen name="MlQuant" component={MlQuant} />
            <Stack.Screen name="FullStack" component={FullStack} />
            <Stack.Screen name="LLD" component={Lld} />
            <Stack.Screen name="Search" component={Search} />
          </Stack.Navigator>
        </NavigationContainer>
        {!splashDone ? <AnimatedSplash onDone={() => setSplashDone(true)} /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
