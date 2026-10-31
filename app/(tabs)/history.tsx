import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Badge from '@/components/Badge';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import InlineMessage from '@/components/InlineMessage';
import PageHeader from '@/components/PageHeader';
import Screen from '@/components/Screen';
import Stat from '@/components/Stat';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPE } from '@/constants/theme';
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
  type AttendanceRecord,
  type TeacherEventAttendance,
} from '@/lib/attendance';
import { useAuth } from '@/lib/auth';
import { getProfile, type Role } from '@/lib/profiles';

function shortId(id: string) {
  return id ? `…${id.slice(-8)}` : 'unknown';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function dateParts(iso: string) {
  const date = new Date(iso);
  return {
    month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: date.getDate(),
    year: date.getFullYear(),
  };
}

function initials(value: string) {
  const clean = value.trim();
  if (!clean) return '?';
  if (clean.includes('@')) return clean.slice(0, 2).toUpperCase();

  const parts = clean.split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setError(null);

    try {
      const profile = await getProfile(user.id);
      const currentRole = profile?.role ?? 'student';
      setRole(currentRole);

      if (currentRole === 'teacher') {
        const events = await getTeacherEventAttendance(user.id);
        setTeacherEvents(events);
        setStudentRecords([]);
      } else {
        const records = await getAttendanceHistory(user.id);
        setStudentRecords(records);
        setTeacherEvents([]);
      }
    } catch {
      setError('Could not load your records. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <Screen>
        <PageHeader
          eyebrow="RECORDS"
          title="Attendance history"
          subtitle="Your recent campus check-ins."
        />
        <Card style={styles.centerCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading records...</Text>
        </Card>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <PageHeader
          eyebrow="RECORDS"
          title="Attendance history"
          subtitle="Your recent campus check-ins."
        />
        <InlineMessage tone="error" message={error} />
        <AppButton
          title="Try again"
          icon="refresh"
          onPress={() => load()}
          style={styles.retryButton}
        />
      </Screen>
    );
  }

  if (role === 'teacher') {
    const totalAttendees = teacherEvents.reduce(
      (sum, event) => sum + event.attendeeCount,
      0
    );

    return (
      <Screen>
        <PageHeader
          eyebrow="TEACHER PORTAL"
          title="My events"
          subtitle="Attendance rosters for the events you created."
        />

        {teacherEvents.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No events yet"
            description="Create an event in the Teacher tab to start collecting attendance."
            actionLabel="Create an event"
            onAction={() => router.push('/teacher')}
          />
        ) : (
          <>
            <Card variant="navy" style={styles.summary}>
              <View style={styles.statsRow}>
                <Stat label="Events" value={teacherEvents.length} tone="light" />
                <View style={styles.statDivider} />
                <Stat label="Check-ins" value={totalAttendees} tone="light" />
                <View style={styles.summaryIcon}>
                  <Ionicons
                    name="people-outline"
                    size={24}
                    color={COLORS.accent}
                  />
                </View>
              </View>
            </Card>

            <View style={styles.list}>
              {teacherEvents.map((event) => (
                <Card key={event.eventId} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Badge
                      tone="accent"
                      label={`${event.attendeeCount} checked in`}
                    />
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons
                      name="pricetag-outline"
                      size={14}
                      color={COLORS.textMuted}
                    />
                    <Text style={styles.metaText}>{event.eventCode}</Text>
                  </View>

                  {event.startTime ? (
                    <View style={styles.metaRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={COLORS.textMuted}
                      />
                      <Text style={styles.metaText}>
                        {formatDate(event.startTime)}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.attendeeBox}>
                    {event.attendees.length === 0 ? (
                      <Text style={styles.emptyAttendees}>
                        No check-ins yet. Students can scan the QR to appear
                        here.
                      </Text>
                    ) : (
                      event.attendees.map((attendee) => (
                        <View key={attendee.studentId} style={styles.attendeeRow}>
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                              {initials(attendee.studentName ?? 'Student')}
                            </Text>
                          </View>
                          <View style={styles.attendeeBody}>
                            <Text style={styles.attendeeName}>
                              {attendee.studentName ??
                                shortId(attendee.studentId)}
                            </Text>
                            <Text style={styles.attendeeTime}>
                              {formatTime(attendee.scannedAt)}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="STUDENT PORTAL"
        title="Attendance history"
        subtitle="Your recent campus check-ins."
      />

      {studentRecords.length === 0 ? (
        <EmptyState
          icon="qr-code-outline"
          title="No check-ins yet"
          description="Scan an event QR code to record your first attendance."
          actionLabel="Open scanner"
          onAction={() => router.push('/scan')}
        />
      ) : (
        <>
          <Card variant="navy" style={styles.summary}>
            <View style={styles.statsRow}>
              <Stat
                label="Check-ins"
                value={studentRecords.length}
                tone="light"
              />
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="checkmark-done"
                  size={24}
                  color={COLORS.accent}
                />
              </View>
            </View>
          </Card>

          <View style={styles.list}>
            {studentRecords.map((record) => {
              const { month, day, year } = dateParts(record.scannedAt);

              return (
                <Card key={String(record.id)} style={styles.recordCard}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateMonth}>{month}</Text>
                    <Text style={styles.dateDay}>{day}</Text>
                    <Text style={styles.dateYear}>{year}</Text>
                  </View>

                  <View style={styles.recordDivider} />

                  <View style={styles.recordBody}>
                    <Text style={styles.recordTitle}>{record.eventTitle}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={COLORS.textMuted}
                      />
                      <Text style={styles.metaText}>
                        {formatTime(record.scannedAt)}
                      </Text>
                    </View>
                    <View style={styles.codeChip}>
                      <Text style={styles.codeChipText}>{record.eventId}</Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  loadingText: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  retryButton: {
    marginTop: SPACING.lg,
  },
  summary: {
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxl,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 'auto',
  },
  list: {
    gap: SPACING.md,
  },
  eventCard: {
    padding: SPACING.lg,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  eventTitle: {
    ...TYPE.h3,
    flex: 1,
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
  },
  metaText: {
    ...TYPE.small,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  attendeeBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  emptyAttendees: {
    ...TYPE.small,
    color: COLORS.textSecondary,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentSoft,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  attendeeBody: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  attendeeTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  dateBlock: {
    width: 56,
    alignItems: 'center',
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.textSecondary,
  },
  dateDay: {
    ...TYPE.number,
    fontSize: 28,
    lineHeight: 34,
    color: COLORS.textPrimary,
  },
  dateYear: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  recordDivider: {
    width: 1,
    height: 52,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  recordBody: {
    flex: 1,
  },
  recordTitle: {
    ...TYPE.h3,
    color: COLORS.textPrimary,
  },
  codeChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginTop: SPACING.sm,
  },
  codeChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
});
