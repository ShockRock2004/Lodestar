import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { F } from '../theme';
import { LodestarMark } from './svg';

// Sleek startup logo animation: the Lodestar star springs in over black with a glow ripple,
// the wordmark rises beneath it, then the whole overlay fades out to reveal the app.
export function AnimatedSplash({ onDone }: { onDone: () => void }) {
  const starOpacity = useSharedValue(0);
  const starScale = useSharedValue(0.72);
  const starRot = useSharedValue(-12);
  const ringScale = useSharedValue(0.35);
  const ringOpacity = useSharedValue(0);
  const wordOpacity = useSharedValue(0);
  const wordY = useSharedValue(12);
  const container = useSharedValue(1);
  const containerScale = useSharedValue(1);

  useEffect(() => {
    starOpacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    starScale.value = withSpring(1, { damping: 11, stiffness: 120, mass: 0.9 });
    starRot.value = withTiming(0, { duration: 760, easing: Easing.out(Easing.cubic) });
    ringOpacity.value = withSequence(
      withTiming(0.55, { duration: 360, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 720, easing: Easing.in(Easing.quad) }),
    );
    ringScale.value = withTiming(1.85, { duration: 1080, easing: Easing.out(Easing.cubic) });
    wordOpacity.value = withDelay(360, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    wordY.value = withDelay(360, withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) }));

    // Hold, then fade the overlay out and hand off to the app.
    container.value = withDelay(1550, withTiming(0, { duration: 440, easing: Easing.inOut(Easing.quad) }, (fin) => {
      if (fin) runOnJS(onDone)();
    }));
    containerScale.value = withDelay(1550, withTiming(1.08, { duration: 460, easing: Easing.out(Easing.cubic) }));
  }, []);

  const cStyle = useAnimatedStyle(() => ({ opacity: container.value, transform: [{ scale: containerScale.value }] }));
  const starStyle = useAnimatedStyle(() => ({ opacity: starOpacity.value, transform: [{ scale: starScale.value }, { rotate: `${starRot.value}deg` }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOpacity.value, transform: [{ scale: ringScale.value }] }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: wordOpacity.value, transform: [{ translateY: wordY.value }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, cStyle]} pointerEvents="none">
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <View style={styles.glow} />
        <Animated.View style={starStyle}>
          <LodestarMark size={116} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.word, wordStyle]}>LODESTAR</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#050506', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  center: { alignItems: 'center', justifyContent: 'center', width: 220, height: 220 },
  ring: { position: 'absolute', width: 180, height: 180, borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)' },
  glow: { position: 'absolute', width: 210, height: 210, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)' },
  word: { marginTop: 26, fontFamily: F.d700, fontSize: 15, letterSpacing: 7, color: '#e8e8e8', paddingLeft: 7 },
});
