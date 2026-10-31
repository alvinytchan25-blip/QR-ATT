import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING } from '@/constants/theme';

type Theme = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';

type Props = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  theme?: Theme;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

const THEMES: Record<
  Theme,
  { background: string; text: string; icon: string; border: string }
> = {
  primary: {
    background: COLORS.primary,
    text: COLORS.textOnPrimary,
    icon: COLORS.accent,
    border: COLORS.primary,
  },
  secondary: {
    background: COLORS.card,
    text: COLORS.primary,
    icon: COLORS.primary,
    border: COLORS.border,
  },
  accent: {
    background: COLORS.accent,
    text: COLORS.textOnAccent,
    icon: COLORS.textOnAccent,
    border: COLORS.accent,
  },
  ghost: {
    background: 'transparent',
    text: COLORS.textSecondary,
    icon: COLORS.textSecondary,
    border: 'transparent',
  },
  danger: {
    background: COLORS.dangerSoft,
    text: COLORS.dangerText,
    icon: COLORS.dangerText,
    border: COLORS.dangerSoft,
  },
};

export default function AppButton({
  title,
  icon,
  theme = 'secondary',
  onPress,
  disabled,
  compact,
  style,
}: Props) {
  const palette = THEMES[theme];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
        (pressed || disabled) && styles.pressed,
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={compact ? 18 : 20}
          color={palette.icon}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          compact && styles.labelCompact,
          { color: palette.text },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: SPACING.xl,
  },
  compact: {
    paddingVertical: 11,
    paddingHorizontal: SPACING.lg,
  },
  pressed: {
    opacity: 0.72,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelCompact: {
    fontSize: 14,
  },
});
