import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { COLORS } from '@/constants/colors';
import { RADIUS } from '@/constants/theme';

type Tone = 'accent' | 'navy' | 'neutral' | 'success' | 'danger' | 'light';

type Props = {
  label: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
};

const TONES: Record<Tone, { background: string; color: string; border: string }> = {
  accent: {
    background: COLORS.accent,
    color: COLORS.textOnAccent,
    border: COLORS.accent,
  },
  navy: {
    background: COLORS.primary,
    color: COLORS.textOnPrimary,
    border: COLORS.primary,
  },
  neutral: {
    background: COLORS.surface,
    color: COLORS.textPrimary,
    border: COLORS.surface,
  },
  success: {
    background: COLORS.successSoft,
    color: COLORS.successText,
    border: COLORS.successSoft,
  },
  danger: {
    background: COLORS.dangerSoft,
    color: COLORS.dangerText,
    border: COLORS.dangerSoft,
  },
  light: {
    background: 'rgba(255, 255, 255, 0.14)',
    color: COLORS.textOnPrimary,
    border: 'rgba(255, 255, 255, 0.22)',
  },
};

export default function Badge({ label, tone = 'neutral', style }: Props) {
  const palette = TONES[tone];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
