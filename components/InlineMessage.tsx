import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPE } from '@/constants/theme';

type Tone = 'error' | 'success' | 'info';

type Props = {
  tone?: Tone;
  message: string;
};

const TONES: Record<
  Tone,
  { icon: keyof typeof Ionicons.glyphMap; color: string; background: string }
> = {
  error: {
    icon: 'alert-circle',
    color: COLORS.dangerText,
    background: COLORS.dangerSoft,
  },
  success: {
    icon: 'checkmark-circle',
    color: COLORS.successText,
    background: COLORS.successSoft,
  },
  info: {
    icon: 'information-circle',
    color: COLORS.primary,
    background: COLORS.surface,
  },
};

export default function InlineMessage({ tone = 'info', message }: Props) {
  const palette = TONES[tone];

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Ionicons name={palette.icon} size={18} color={palette.color} />
      <Text style={[styles.text, { color: palette.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  text: {
    ...TYPE.small,
    flex: 1,
    fontWeight: '600',
  },
});
