import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, Text, type TextStyle, View } from 'react-native';

import { usePalette } from './palette';
import { colors, fonts } from './theme';

const OUTLINE = '#4A3530';
const NOSE = '#F7C65C';
const CHEEK = '#FFB2C0';
const native = Platform.OS !== 'web';
// 웹은 한글을 글자 단위로 줄바꿈해서 어절 단위로 끊도록 따로 지정한다.
const keepWords = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : null) as TextStyle | null;

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (alive) setReduce(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  return reduce;
}

export function Bean({
  size = 72,
  color,
  sleepy = false,
  lines,
}: {
  size?: number;
  color?: string;
  sleepy?: boolean;
  /** 있으면 누를 때마다 이 중 하나를 말풍선으로 띄운다. */
  lines?: readonly string[];
}) {
  const palette = usePalette();
  const fill = color ?? palette.soft;
  const reduce = useReduceMotion();
  const [speech, setSpeech] = useState<string | null>(null);
  const [bubble] = useState(() => new Animated.Value(0));
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const [breath] = useState(() => new Animated.Value(0));
  const [sway] = useState(() => new Animated.Value(0));
  const [blink] = useState(() => new Animated.Value(1));
  const [wave] = useState(() => new Animated.Value(0));
  const [hop] = useState(() => new Animated.Value(0));
  const [snooze] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduce) return;
    const ease = Easing.inOut(Easing.sin);
    const timing = (value: Animated.Value, toValue: number, duration: number, easing = ease) =>
      Animated.timing(value, { toValue, duration, easing, useNativeDriver: native });

    const breathe = sleepy ? 2400 : 1300;
    const rock = sleepy ? 3200 : 1700;
    const loops = [
      Animated.loop(Animated.sequence([timing(breath, 1, breathe), timing(breath, 0, breathe)])),
      Animated.loop(Animated.sequence([timing(sway, 1, rock), timing(sway, -1, rock * 2), timing(sway, 0, rock)])),
    ];
    if (sleepy) {
      loops.push(Animated.loop(timing(snooze, 1, 2200, Easing.out(Easing.quad))));
    } else {
      loops.push(
        Animated.loop(
          Animated.sequence([
            Animated.delay(2400 + Math.random() * 2000),
            timing(wave, 1, 200),
            timing(wave, 0, 200),
            timing(wave, 1, 200),
            timing(wave, 0, 200),
          ]),
        ),
      );
    }
    loops.forEach((loop) => loop.start());

    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleBlink = () => {
      timer = setTimeout(() => {
        Animated.sequence([timing(blink, 0.1, 80), timing(blink, 1, 120)]).start(({ finished }) => {
          if (finished) scheduleBlink();
        });
      }, 1800 + Math.random() * 2800);
    };
    if (!sleepy) scheduleBlink();

    return () => {
      loops.forEach((loop) => loop.stop());
      if (timer) clearTimeout(timer);
      blink.setValue(1);
      wave.setValue(0);
      snooze.setValue(0);
    };
  }, [reduce, sleepy, breath, sway, blink, wave, snooze]);

  const speak = () => {
    if (!lines?.length) return;
    const choices = lines.length > 1 ? lines.filter((item) => item !== speech) : lines;
    setSpeech(choices[Math.floor(Math.random() * choices.length)]);
    clearTimeout(hideTimer.current);
    bubble.stopAnimation();
    if (reduce) {
      bubble.setValue(1);
    } else {
      bubble.setValue(0);
      Animated.spring(bubble, { toValue: 1, friction: 5, tension: 140, useNativeDriver: native }).start();
    }
    hideTimer.current = setTimeout(() => {
      Animated.timing(bubble, { toValue: 0, duration: reduce ? 0 : 220, useNativeDriver: native }).start(({ finished }) => {
        if (finished) setSpeech(null);
      });
    }, 3000);
  };

  const giggle = () => {
    speak();
    if (reduce) return;
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: native }),
      Animated.spring(hop, { toValue: 0, friction: 3, tension: 120, useNativeDriver: native }),
    ]).start();
    Animated.sequence([
      Animated.timing(wave, { toValue: 1, duration: 140, useNativeDriver: native }),
      Animated.timing(wave, { toValue: 0, duration: 140, useNativeDriver: native }),
      Animated.timing(wave, { toValue: 1, duration: 140, useNativeDriver: native }),
      Animated.timing(wave, { toValue: 0, duration: 140, useNativeDriver: native }),
    ]).start();
  };

  const s = size;
  const line = Math.max(1.5, s * 0.032);
  const headH = s * 0.8;
  const eyeW = s * 0.085;
  const eyeH = s * 0.115;
  const tilt = sleepy ? 2 : 5;

  const bodyMotion = {
    transform: [
      { translateY: Animated.add(breath.interpolate({ inputRange: [0, 1], outputRange: [0, -s * 0.03] }), hop.interpolate({ inputRange: [0, 1], outputRange: [0, -s * 0.22] })) },
      { rotate: sway.interpolate({ inputRange: [-1, 1], outputRange: [`-${tilt}deg`, `${tilt}deg`] }) },
    ],
  };
  const squish = {
    transform: [
      { scaleX: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] }) },
      { scaleY: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) },
    ],
  };
  const waving = {
    transform: [
      { translateY: wave.interpolate({ inputRange: [0, 1], outputRange: [0, -s * 0.08] }) },
      { rotate: wave.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-28deg'] }) },
    ],
  };

  const paw = (side: 'left' | 'right') => ({
    position: 'absolute' as const,
    bottom: s * 0.03,
    [side]: s * 0.2,
    width: s * 0.17,
    height: s * 0.15,
    borderRadius: s,
    backgroundColor: fill,
    borderWidth: line,
    borderColor: OUTLINE,
  });

  return (
    <Pressable onPress={giggle} accessible={false} focusable={false} style={{ width: s, height: s * 1.08 }}>
      <Animated.View style={[{ flex: 1 }, bodyMotion]}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              bottom: s * 0.07,
              width: s,
              height: headH,
              borderRadius: '50%',
              backgroundColor: fill,
              borderWidth: line,
              borderColor: OUTLINE,
            },
            squish,
          ]}
        >
          {[0.3, 0.7].map((x) =>
            sleepy ? (
              <View
                key={x}
                style={{
                  position: 'absolute',
                  top: headH * 0.46,
                  left: s * x - eyeW,
                  width: eyeW * 2,
                  height: eyeW,
                  borderBottomLeftRadius: eyeW,
                  borderBottomRightRadius: eyeW,
                  borderWidth: line * 0.85,
                  borderTopWidth: 0,
                  borderColor: OUTLINE,
                }}
              />
            ) : (
              <Animated.View
                key={x}
                style={{
                  position: 'absolute',
                  top: headH * 0.4,
                  left: s * x - eyeW / 2,
                  width: eyeW,
                  height: eyeH,
                  borderRadius: eyeW,
                  backgroundColor: OUTLINE,
                  transform: [{ scaleY: blink }],
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    top: eyeH * 0.16,
                    left: eyeW * 0.2,
                    width: eyeW * 0.38,
                    height: eyeW * 0.38,
                    borderRadius: eyeW,
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </Animated.View>
            ),
          )}
          {[0.1, 0.73].map((x) => (
            <View
              key={x}
              style={{
                position: 'absolute',
                top: headH * 0.6,
                left: s * x,
                width: s * 0.15,
                height: s * 0.09,
                borderRadius: s,
                backgroundColor: CHEEK,
                opacity: 0.8,
              }}
            />
          ))}
          <View
            style={{
              position: 'absolute',
              top: headH * 0.56,
              left: s / 2 - s * 0.05,
              width: s * 0.1,
              height: s * 0.065,
              borderRadius: s,
              backgroundColor: NOSE,
              borderWidth: Math.max(1, line * 0.6),
              borderColor: OUTLINE,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: headH * 0.56 + s * 0.075,
              left: s / 2 - s * 0.055,
              width: s * 0.11,
              height: s * 0.05,
              borderBottomLeftRadius: s,
              borderBottomRightRadius: s,
              borderWidth: line * 0.75,
              borderTopWidth: 0,
              borderColor: OUTLINE,
            }}
          />
        </Animated.View>

        <View style={paw('left')} />
        <Animated.View style={[paw('right'), waving]} />

        <Ornament kind={palette.ornament} size={s} line={line} accent={palette.accent} />

        {sleepy ? (
          <Animated.Text
            style={{
              position: 'absolute',
              top: 0,
              right: -s * 0.08,
              fontFamily: fonts.cute,
              fontSize: Math.max(10, s * 0.2),
              color: OUTLINE,
              opacity: snooze.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.8, 0.8, 0] }),
              transform: [
                { translateY: snooze.interpolate({ inputRange: [0, 1], outputRange: [s * 0.12, -s * 0.08] }) },
                { scale: snooze.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.1] }) },
              ],
            }}
          >
            z
          </Animated.Text>
        ) : null}
      </Animated.View>

      {speech ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute',
            right: s + 4,
            top: s * 0.12,
            width: 150,
            zIndex: 10,
            opacity: bubble,
            transform: [
              { translateX: bubble.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
              { scale: bubble.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            ],
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              paddingHorizontal: 13,
              paddingVertical: 9,
              borderWidth: 2,
              borderColor: palette.soft,
              shadowColor: palette.accentDark,
              shadowOpacity: 0.18,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Text lineBreakStrategyIOS="hangul-word" style={[{ fontFamily: fonts.cute, fontSize: 15, lineHeight: 20, color: colors.ink }, keepWords]}>
              {speech}
            </Text>
          </View>
          <View
            style={{
              position: 'absolute',
              right: -5,
              top: 16,
              width: 12,
              height: 12,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 2,
              borderRightWidth: 2,
              borderColor: palette.soft,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

function Ornament({ kind, size: s, line, accent }: { kind: 'sprout' | 'bow' | 'curl'; size: number; line: number; accent: string }) {
  if (kind === 'bow') {
    const loop = { width: s * 0.22, height: s * 0.18, borderRadius: s * 0.09, backgroundColor: accent, borderWidth: line * 0.9, borderColor: OUTLINE };
    return (
      <View
        style={{
          position: 'absolute',
          top: s * 0.1,
          right: s * 0.02,
          flexDirection: 'row',
          alignItems: 'center',
          transform: [{ rotate: '18deg' }],
        }}
      >
        <View style={[loop, { marginRight: -s * 0.03, transform: [{ rotate: '-12deg' }] }]} />
        <View style={{ width: s * 0.1, height: s * 0.1, borderRadius: s, backgroundColor: accent, borderWidth: line * 0.9, borderColor: OUTLINE, zIndex: 1 }} />
        <View style={[loop, { marginLeft: -s * 0.03, transform: [{ rotate: '12deg' }] }]} />
      </View>
    );
  }
  if (kind === 'curl') {
    return (
      <View
        style={{
          position: 'absolute',
          top: s * 0.07,
          left: s * 0.44,
          width: s * 0.13,
          height: s * 0.13,
          borderRadius: s,
          borderWidth: line,
          borderColor: OUTLINE,
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          transform: [{ rotate: '-20deg' }],
        }}
      />
    );
  }
  const leaf = {
    position: 'absolute' as const,
    top: s * 0.06,
    width: s * 0.15,
    height: s * 0.09,
    borderRadius: s,
    backgroundColor: colors.mint,
    borderWidth: line * 0.9,
    borderColor: colors.mintDark,
  };
  return (
    <>
      <View style={{ position: 'absolute', top: s * 0.12, left: s / 2 - line / 2, width: line, height: s * 0.1, backgroundColor: colors.mintDark }} />
      <View style={[leaf, { left: s * 0.36, transform: [{ rotate: '-28deg' }] }]} />
      <View style={[leaf, { left: s * 0.5, transform: [{ rotate: '28deg' }] }]} />
    </>
  );
}
