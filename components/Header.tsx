import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { RADIUS } from '@/constants/theme';

type Props = {
  tone?: 'light' | 'dark';
};

export default function Header({ tone = 'dark' }: Props) {
  const light = tone === 'light';

  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <Ionicons name="qr-code" size={22} color={COLORS.primary} />
      </View>

      <View>
        <Text style={[styles.wordmark, light && styles.wordmarkLight]}>
          QR Attendance
        </Text>
        <Text style={[styles.tagline, light && styles.taglineLight]}>
          Campus check-in
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
  },
  wordmark: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: COLORS.textPrimary,
  },
  wordmarkLight: {
    color: COLORS.textOnPrimary,
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 0.4,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  taglineLight: {
    color: 'rgba(255, 255, 255, 0.62)',
  },
});
