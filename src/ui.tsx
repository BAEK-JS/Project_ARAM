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

export function Backdrop({ children }: { children: ReactNode }) {
  const palette = usePalette();
  return (
    <LinearGradient colors={palette.page} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.backdrop}>
      <Blob size={340} color={palette.blobs[0]} style={{ top: -140, right: -120 }} />
      <Blob size={260} color={palette.blobs[1]} style={{ top: 260, left: -150 }} />
      <Blob size={300} color={palette.blobs[2]} style={{ bottom: -120, right: -100 }} />
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
