import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import FormField from '@/components/FormField';
import InlineMessage from '@/components/InlineMessage';
import PageHeader from '@/components/PageHeader';
import Screen from '@/components/Screen';
import SectionLabel from '@/components/SectionLabel';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPE } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { createEvent } from '@/lib/events';
import { getProfile, type Role } from '@/lib/profiles';
import { buildQRPayload } from '@/lib/qr';

// Always serialise to UTC. A local "2026-09-28T14:30:00" string carries no
// offset, so Postgres would read it as UTC and shift it by the device's offset.
function toISOString(date: Date) {
  return date.toISOString();
}

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${pad(date.getDate())}, ${date.getFullYear()} at ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const QUICK_END_OPTIONS = [
  { label: '+30 min', ms: 30 * 60 * 1000 },
  { label: '+1 hour', ms: 60 * 60 * 1000 },
  { label: '+2 hours', ms: 2 * 60 * 60 * 1000 },
];

type EditTarget = 'start' | 'end';

export default function TeacherScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000)
  );
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');
  const [payload, setPayload] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('error');
  const [saving, setSaving] = useState(false);

  const isAndroid = Platform.OS === 'android';

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) {
        setRoleLoading(false);
        return () => {
          active = false;
        };
      }
      getProfile(user.id).then((profile) => {
        if (!active) return;
        setRole(profile?.role ?? 'student');
        setRoleLoading(false);
      });
      return () => {
        active = false;
      };
    }, [user])
  );

  const openPicker = (target: EditTarget) => {
    setMessage(null);
    setEditTarget(target);
    setEditingPart('date');
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!editTarget) return;
    if (event.type === 'dismissed' || !selected) {
      setEditTarget(null);
      setEditingPart('date');
      return;
    }

    const current = editTarget === 'start' ? startDate : endDate;
    const next = new Date(current);
    next.setFullYear(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate()
    );
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);

    if (editTarget === 'start') setStartDate(next);
    else setEndDate(next);

    if (isAndroid && editingPart === 'date') {
      setEditingPart('time');
    } else {
      setEditTarget(null);
      setEditingPart('date');
    }
  };

  const handleQuickEnd = (ms: number) => {
    setMessage(null);
    setEndDate(new Date(startDate.getTime() + ms));
  };

  const handleCreateEvent = () => {
    const event = {
      eventId: eventId.trim(),
      title: title.trim(),
      start: toISOString(startDate),
      end: toISOString(endDate),
    };

    if (!event.eventId || !event.title) {
      setMessageTone('error');
      setMessage('Event title and code are required.');
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      setMessageTone('error');
      setMessage('End time must be after start time.');
      return;
    }

    setSaving(true);
    createEvent(event)
      .then(({ error }) => {
        if (error) {
          setMessageTone('error');
          setMessage(`Could not save event: ${error}`);
          setPayload(null);
          return;
        }
        setMessageTone('success');
        setMessage('Event saved! Scan the QR with the Scan tab to test it.');
        setPayload(buildQRPayload(event));
      })
      .finally(() => setSaving(false));
  };

  if (roleLoading) {
    return (
      <Screen>
        <PageHeader
          eyebrow="TEACHER PORTAL"
          title="Event studio"
          subtitle="Create a check-in code for your class or campus event."
        />
        <Card style={styles.centerCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerText}>Checking your account...</Text>
        </Card>
      </Screen>
    );
  }

  if (role !== 'teacher') {
    return (
      <Screen>
        <PageHeader
          eyebrow="TEACHER PORTAL"
          title="Event studio"
          subtitle="Create a check-in code for your class or campus event."
        />
        <EmptyState
          icon="lock-closed-outline"
          title="Teacher access only"
          description="Sign in with a teacher account to create events and share check-in codes."
          actionLabel="Back to home"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="TEACHER PORTAL"
        title="Event studio"
        subtitle="Create a check-in code for your class or campus event."
      />

      <Card style={styles.sectionCard}>
        <SectionLabel>EVENT DETAILS</SectionLabel>

        <View style={styles.fieldGap}>
          <FormField
            label="Event title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Founders Day Assembly"
          />

          <FormField
            label="Event code"
            value={eventId}
            onChangeText={setEventId}
            placeholder="e.g. EVT-2026-0002"
            autoCapitalize="characters"
            hint="This code is embedded in the QR."
          />
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <SectionLabel>SCHEDULE</SectionLabel>

        <Text style={styles.fieldLabel}>Starts</Text>
        <PickerField
          value={formatDateTime(startDate)}
          icon="sunny-outline"
          onPress={() => openPicker('start')}
        />

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Ends</Text>
        <PickerField
          value={formatDateTime(endDate)}
          icon="moon-outline"
          onPress={() => openPicker('end')}
        />

        <View style={styles.chipRow}>
          {QUICK_END_OPTIONS.map((option) => (
            <Pressable
              key={option.label}
              style={styles.chip}
              onPress={() => handleQuickEnd(option.ms)}
            >
              <Text style={styles.chipText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>Tap a chip to set the end time from start.</Text>
      </Card>

      {message ? (
        <View style={styles.messageWrap}>
          <InlineMessage tone={messageTone} message={message} />
        </View>
      ) : null}

      <AppButton
        theme="primary"
        title={saving ? 'Creating event...' : 'Create event'}
        icon="add-circle-outline"
        onPress={handleCreateEvent}
        disabled={saving}
      />

      {editTarget && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={editTarget === 'start' ? startDate : endDate}
            mode={isAndroid ? editingPart : 'datetime'}
            display={isAndroid ? 'default' : 'spinner'}
            onChange={onPickerChange}
          />
        </View>
      )}

      {payload && (
        <Card style={styles.qrCard}>
          <SectionLabel style={styles.qrLabel}>CHECK-IN CODE</SectionLabel>
          <Text style={styles.qrTitle}>Your event is ready</Text>
          <Text style={styles.qrSubtitle}>
            Students scan this code with the Scan tab.
          </Text>

          <View style={styles.qrBox}>
            <QRCode value={payload} size={200} />
          </View>

          <View style={styles.qrCodeChip}>
            <Text style={styles.qrCodeText}>{eventId.trim()}</Text>
          </View>
        </Card>
      )}
    </Screen>
  );
}

type PickerFieldProps = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function PickerField({ value, icon, onPress }: PickerFieldProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.pickerField,
        pressed && styles.pickerFieldPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.pickerIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.pickerValue}>{value}</Text>
      <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centerCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  centerText: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  sectionCard: {
    marginBottom: SPACING.lg,
  },
  fieldGap: {
    gap: SPACING.lg,
  },
  fieldLabel: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  fieldLabelSpaced: {
    marginTop: SPACING.lg,
  },
  pickerField: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pickerFieldPressed: {
    backgroundColor: COLORS.surface,
  },
  pickerIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  pickerValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  chip: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  hint: {
    ...TYPE.small,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  messageWrap: {
    marginBottom: SPACING.lg,
  },
  pickerContainer: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  qrCard: {
    marginTop: SPACING.xl,
    borderTopWidth: 4,
    borderTopColor: COLORS.accent,
    alignItems: 'center',
  },
  qrLabel: {
    alignSelf: 'flex-start',
  },
  qrTitle: {
    ...TYPE.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  qrSubtitle: {
    ...TYPE.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  qrBox: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  qrCodeChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  qrCodeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: COLORS.textPrimary,
  },
});
