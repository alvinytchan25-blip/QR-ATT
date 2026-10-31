import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { SPACING, TYPE } from '@/constants/theme';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export default function PageHeader({ eyebrow, title, subtitle, right }: Props) {
  return (
    <View style={styles.container}>
      {eyebrow ? (
        <View style={styles.eyebrowRow}>
          <View style={styles.rule} />
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        </View>
      ) : null}

      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {right}
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xxl,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  rule: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.accent,
  },
  eyebrow: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  title: {
    ...TYPE.h1,
    flex: 1,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    maxWidth: 560,
  },
});
