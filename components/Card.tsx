import { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING } from '@/constants/theme';

type Props = {
  children: ReactNode;
  variant?: 'default' | 'navy' | 'soft';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function Card({
  children,
  variant = 'default',
  padded = true,
  style,
}: Props) {
  return (
    <View
      style={[
        styles.base,
        variant === 'default' && styles.default,
        variant === 'navy' && styles.navy,
        variant === 'soft' && styles.soft,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
  },
  default: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  navy: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.hero,
  },
  soft: {
    backgroundColor: COLORS.surfaceAlt,
  },
  padded: {
    padding: SPACING.xl,
  },
});
