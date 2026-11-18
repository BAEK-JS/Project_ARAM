import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { Bean } from './bean';
import { usePalette } from './palette';
import { colors, fonts, Gender, palettes, radius, shadow } from './theme';

export function GenderPicker({ value, onChange }: { value: Gender; onChange: (gender: Gender) => void }) {
  const options: { id: Gender; label: string; color: string; text: string }[] = [
    { id: 'girl', label: '딸', color: palettes.girl.soft, text: palettes.girl.accentDark },
    { id: 'boy', label: '아들', color: palettes.boy.soft, text: palettes.boy.accentDark },
    { id: 'unknown', label: '아직 몰라요', color: palettes.unknown.soft, text: palettes.unknown.accentDark },
  ];
  return (
    <View style={styles.field}>
      <FieldLabel>우리 아기는</FieldLabel>
      <View style={styles.genderRow}>
        {options.map((option) => {
          const active = option.id === value;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option.id)}
              style={[styles.genderChip, active && { backgroundColor: option.color, borderColor: option.text }]}
            >
              <View style={[styles.genderDot, { backgroundColor: option.text }]} />
              <Text style={[styles.genderText, active && { color: option.text }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export { Bean };

export function Mark({ size = 42 }: { size?: number }) {
  return <Bean size={size} />;
}

export function Blob({ size, color, style }: { size: number; color: string; style?: ViewStyle }) {
  return <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: color }, style]} />;
}

function Cloud({ size, color, style }: { size: number; color: string; style?: ViewStyle }) {
  const puff = (w: number, h: number, left: number, top: number) => (
    <View style={{ position: 'absolute', left, top, width: w, height: h, borderRadius: h, backgroundColor: color }} />
  );
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size * 0.55 }, style]}>
      {puff(size * 0.42, size * 0.34, size * 0.08, size * 0.14)}
      {puff(size * 0.52, size * 0.4, size * 0.28, size * 0.02)}
      {puff(size * 0.38, size * 0.3, size * 0.56, size * 0.16)}
      {puff(size * 0.78, size * 0.28, size * 0.12, size * 0.26)}
    </View>
  );
}

function Dot({ size, color, style }: { size: number; color: string; style?: ViewStyle }) {
  return <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: color }, style]} />;
}

function Star({ size, color, style }: { size: number; color: string; style?: ViewStyle }) {
  const arm = { position: 'absolute' as const, backgroundColor: color, borderRadius: size };
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <View style={[arm, { left: size * 0.38, top: 0, width: size * 0.24, height: size }]} />
      <View style={[arm, { left: 0, top: size * 0.38, width: size, height: size * 0.24 }]} />
      <View style={[arm, { left: size * 0.18, top: size * 0.18, width: size * 0.64, height: size * 0.64, borderRadius: size, transform: [{ rotate: '45deg' }], opacity: 0.9 }]} />
    </View>
  );
}

function Heart({ size, color, style }: { size: number; color: string; style?: ViewStyle }) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <View style={{ position: 'absolute', left: 0, top: size * 0.18, width: size * 0.58, height: size * 0.58, borderRadius: size, backgroundColor: color }} />
      <View style={{ position: 'absolute', right: 0, top: size * 0.18, width: size * 0.58, height: size * 0.58, borderRadius: size, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: size * 0.08, top: size * 0.34, width: size * 0.84, height: size * 0.66, borderBottomLeftRadius: size, borderBottomRightRadius: size, backgroundColor: color, transform: [{ rotate: '0deg' }] }} />
    </View>
  );
}

export function Backdrop({ children }: { children: ReactNode }) {
  const palette = usePalette();
  const [a, b, c, d] = palette.motifs;
  return (
    <LinearGradient colors={palette.page} locations={[0, 0.35, 0.7, 1]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.backdrop}>
      <Blob size={320} color={palette.blobs[0]} style={{ top: -150, right: -120 }} />
      <Blob size={260} color={palette.blobs[1]} style={{ top: 240, left: -140 }} />
      <Blob size={300} color={palette.blobs[2]} style={{ bottom: -150, right: -100 }} />

      <Cloud size={200} color="rgba(255,255,255,0.88)" style={{ top: 28, left: -40 }} />
      <Cloud size={150} color="rgba(255,255,255,0.82)" style={{ top: 108, right: -30 }} />
      <Cloud size={170} color="rgba(255,255,255,0.84)" style={{ bottom: 180, left: -52 }} />
      <Cloud size={130} color="rgba(255,255,255,0.8)" style={{ bottom: 78, right: 12 }} />

      <Dot size={12} color={a} style={{ top: 84, left: 46, opacity: 0.7 }} />
      <Dot size={8} color={b} style={{ top: 156, left: 24, opacity: 0.65 }} />
      <Dot size={14} color={c} style={{ top: 204, right: 30, opacity: 0.62 }} />
      <Dot size={9} color={d} style={{ top: 318, left: 58, opacity: 0.68 }} />
      <Dot size={11} color={a} style={{ top: 410, right: 48, opacity: 0.6 }} />
      <Dot size={7} color={b} style={{ bottom: 248, left: 36, opacity: 0.66 }} />
      <Dot size={13} color={c} style={{ bottom: 148, right: 68, opacity: 0.58 }} />
      <Dot size={8} color={d} style={{ bottom: 310, right: 24, opacity: 0.64 }} />
      <Dot size={6} color={a} style={{ top: 250, right: 16, opacity: 0.55 }} />
      <Dot size={10} color={b} style={{ top: 500, left: 18, opacity: 0.55 }} />

      <Star size={18} color={c} style={{ top: 64, right: 54, opacity: 0.72 }} />
      <Star size={14} color={a} style={{ top: 276, left: 18, opacity: 0.62 }} />
      <Star size={16} color={b} style={{ bottom: 220, right: 36, opacity: 0.68 }} />
      <Star size={12} color={d} style={{ top: 470, right: 90, opacity: 0.55 }} />
      <Heart size={20} color={a} style={{ top: 176, left: 64, opacity: 0.58 }} />
      <Heart size={16} color={palette.ornament === 'curl' ? b : a} style={{ bottom: 126, left: 84, opacity: 0.52 }} />
      <Heart size={14} color={c} style={{ top: 350, right: 18, opacity: 0.55 }} />

      {children}
    </LinearGradient>
  );
}

export function Title({ children, size = 30 }: { children: ReactNode; size?: number }) {
  return <Text style={[styles.title, { fontSize: size, lineHeight: size * 1.25 }]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label, color, textColor }: { label: string; color?: string; textColor?: string }) {
  const palette = usePalette();
  return (
    <View style={[styles.badge, { backgroundColor: color ?? palette.soft }]}>
      <Text style={[styles.badgeText, { color: textColor ?? palette.accentDark }]}>{label}</Text>
    </View>
  );
}

export function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  numeric,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
}) {
  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C9B6AB"
        style={[styles.input, multiline && styles.multiline]}
        multiline={multiline}
        keyboardType={numeric ? 'decimal-pad' : undefined}
        inputMode={numeric ? 'decimal' : undefined}
      />
    </View>
  );
}

export function DateFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [year = '', month = '', day = ''] = value.split('-');
  const commit = (nextYear: string, nextMonth: string, nextDay: string) => {
    if (!nextYear && !nextMonth && !nextDay) {
      onChange('');
      return;
    }
    onChange(`${nextYear}-${nextMonth}-${nextDay}`);
  };
  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.dateRow}>
        <UnitInput
          value={year}
          unit="년"
          placeholder="2027"
          maxLength={4}
          onChangeText={(text) => commit(text, month, day)}
        />
        <UnitInput
          value={month}
          unit="월"
          placeholder="05"
          maxLength={2}
          onChangeText={(text) => commit(year, text, day)}
          onBlur={() => commit(year, pad2(month), day)}
        />
        <UnitInput
          value={day}
          unit="일"
          placeholder="15"
          maxLength={2}
          onChangeText={(text) => commit(year, month, text)}
          onBlur={() => commit(year, month, pad2(day))}
        />
      </View>
    </View>
  );
}

export function TimeFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [hour = '', minute = ''] = value.split(':');
  const commit = (nextHour: string, nextMinute: string) => {
    if (!nextHour && !nextMinute) {
      onChange('');
      return;
    }
    onChange(`${nextHour}:${nextMinute}`);
  };
  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.dateRow}>
        <UnitInput value={hour} unit="시" placeholder="08" maxLength={2} onChangeText={(text) => commit(text, minute)} onBlur={() => commit(pad2(hour), minute)} />
        <UnitInput value={minute} unit="분" placeholder="24" maxLength={2} onChangeText={(text) => commit(hour, text)} onBlur={() => commit(hour, pad2(minute))} />
      </View>
    </View>
  );
}

function UnitInput({
  value,
  unit,
  placeholder,
  maxLength,
  onChangeText,
  onBlur,
}: {
  value: string;
  unit: string;
  placeholder: string;
  maxLength: number;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <View style={styles.unitBox}>
      <TextInput
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, maxLength))}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor="#C9B6AB"
        keyboardType="number-pad"
        maxLength={maxLength}
        style={styles.unitInput}
      />
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

function pad2(value: string): string {
  if (!value) return '';
  return value.length === 1 ? `0${value}` : value;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryShell, { shadowColor: palette.accentDark }, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <LinearGradient colors={palette.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
        <Text style={styles.primaryText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function QuietButton({ label, onPress }: { label: string; onPress: () => void }) {
  const palette = usePalette();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.quiet}>
      <Text style={[styles.quietText, { color: palette.accentDark }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.cute,
    color: colors.ink,
  },
  backdrop: {
    flex: 1,
    overflow: 'hidden',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    flexGrow: 1,
    flexBasis: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.field,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  genderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  genderText: {
    fontFamily: fonts.cute,
    fontSize: 15,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontFamily: fonts.cute,
    fontSize: 14,
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: fonts.cute,
    color: colors.muted,
    fontSize: 15,
  },
  input: {
    backgroundColor: colors.field,
    borderRadius: radius.field,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.ink,
    minWidth: 0,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitBox: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.field,
    borderRadius: radius.field,
    paddingRight: 12,
  },
  unitInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 13,
    paddingLeft: 12,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'center',
  },
  unit: {
    fontFamily: fonts.cute,
    color: colors.muted,
    fontSize: 15,
  },
  primaryShell: {
    borderRadius: radius.pill,
    shadowColor: colors.accentDark,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primary: {
    borderRadius: radius.pill,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryText: {
    fontFamily: fonts.cute,
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: 0.3,
  },
  secondary: {
    borderRadius: radius.pill,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: 'rgba(225,241,231,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(79,143,112,0.15)',
  },
  secondaryText: {
    fontFamily: fonts.cute,
    color: colors.mintDark,
    fontSize: 16,
  },
  quiet: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietText: {
    fontFamily: fonts.cute,
    color: colors.accentDark,
    fontSize: 15,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.92,
  },
});
