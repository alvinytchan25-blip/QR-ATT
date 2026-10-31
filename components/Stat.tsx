import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { TYPE } from '@/constants/theme';

type Props = {
  label: string;
  value: string | number;
  tone?: 'light' | 'dark';
};

export default function Stat({ label, value, tone = 'dark' }: Props) {
  const light = tone === 'light';

  return (
    <View style={styles.container}>
      <Text style={[styles.value, light && styles.valueLight]}>{value}</Text>
      <Text style={[styles.label, light && styles.labelLight]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  value: {
    ...TYPE.number,
    color: COLORS.textPrimary,
  },
  valueLight: {
    color: COLORS.textOnPrimary,
  },
  label: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  labelLight: {
    color: 'rgba(255, 255, 255, 0.62)',
  },
});
