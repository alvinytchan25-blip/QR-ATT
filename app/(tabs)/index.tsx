import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import Screen from '@/components/Screen';
import SectionLabel from '@/components/SectionLabel';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPE } from '@/constants/theme';

const STEPS = [
  {
    title: 'Open the scanner',
    text: 'Tap “Open scanner” or the Scan tab.',
  },
  {
    title: 'Scan the event code',
    text: 'Point your camera at the QR shown by your teacher.',
  },
  {
    title: 'You are checked in',
    text: 'Your attendance is saved instantly to your history.',
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function Index() {
  return (
    <Screen>
      <PageHeader
        eyebrow="CAMPUS CHECK-IN"
        title={getGreeting()}
        subtitle="Scan in to your classes and campus events."
      />

      <Card variant="navy" style={styles.hero}>
        <Ionicons
          name="qr-code"
          size={120}
          color={COLORS.white}
          style={styles.heroIcon}
        />

        <Text style={styles.heroKicker}>{formatToday()}</Text>
        <Text style={styles.heroTitle}>Ready to check in?</Text>
        <Text style={styles.heroText}>
          Open the scanner, point your camera at the event QR, and your
          attendance is recorded instantly.
        </Text>

        <AppButton
          theme="accent"
          title="Open scanner"
          icon="scan-outline"
          onPress={() => router.push('/scan')}
          style={styles.heroButton}
        />
      </Card>

      <SectionLabel>QUICK ACTIONS</SectionLabel>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => router.push('/history')}
          style={({ pressed }) => [styles.actionPress, pressed && styles.pressed]}
        >
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="time-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>History</Text>
            <Text style={styles.actionText}>View your check-ins</Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={COLORS.primary}
              style={styles.actionArrow}
            />
          </Card>
        </Pressable>

        <Pressable
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.actionPress, pressed && styles.pressed]}
        >
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="person-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>Profile</Text>
            <Text style={styles.actionText}>Account and role</Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={COLORS.primary}
              style={styles.actionArrow}
            />
          </Card>
        </Pressable>
      </View>

      <SectionLabel>HOW IT WORKS</SectionLabel>

      <Card>
        {STEPS.map((step, index) => (
          <View
            key={step.title}
            style={[styles.step, index < STEPS.length - 1 && styles.stepBorder]}
          >
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>
                {String(index + 1).padStart(2, '0')}
              </Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Text style={styles.footer}>QR Attendance · Campus check-in</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 22,
    marginBottom: SPACING.xxl,
  },
  heroIcon: {
    position: 'absolute',
    right: 2,
    top: 2,
    opacity: 0.07,
  },
  heroKicker: {
    ...TYPE.caption,
    color: COLORS.accent,
  },
  heroTitle: {
    ...TYPE.h1,
    color: COLORS.textOnPrimary,
    marginTop: SPACING.sm,
  },
  heroText: {
    ...TYPE.body,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: SPACING.sm,
    maxWidth: 420,
  },
  heroButton: {
    marginTop: SPACING.xl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  actionPress: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  actionCard: {
    minHeight: 164,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentSoft,
    marginBottom: SPACING.md,
  },
  actionTitle: {
    ...TYPE.h3,
    color: COLORS.textPrimary,
  },
  actionText: {
    ...TYPE.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionArrow: {
    alignSelf: 'flex-end',
    marginTop: SPACING.md,
  },
  step: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  stepBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textOnAccent,
    letterSpacing: 0.4,
  },
  stepBody: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    ...TYPE.h3,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  stepText: {
    ...TYPE.small,
    color: COLORS.textSecondary,
  },
  footer: {
    ...TYPE.small,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xxl,
    letterSpacing: 0.4,
  },
});
