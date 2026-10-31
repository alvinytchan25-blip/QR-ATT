import { ReactNode } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { COLORS } from '@/constants/colors';
import { SPACING, TYPE } from '@/constants/theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
};

export default function SectionLabel({ children, style }: Props) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
});
