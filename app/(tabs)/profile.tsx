import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppButton from '@/components/AppButton';
import Badge from '@/components/Badge';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import FormField from '@/components/FormField';
import PageHeader from '@/components/PageHeader';
import Screen from '@/components/Screen';
import SectionLabel from '@/components/SectionLabel';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPE } from '@/constants/theme';
import { useAuth, signOut } from '@/lib/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/profiles';

function getInitials(value: string) {
  const clean = value.trim();
  if (!clean) return '?';
  if (clean.includes('@')) return clean.slice(0, 2).toUpperCase();

  const parts = clean.split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const p = await getProfile(user.id);
    setProfile(p);
    setDraftName(p?.full_name ?? '');
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const startEditing = () => {
    setDraftName(profile?.full_name ?? '');
    setEditing(true);
  };

  const handleSaveName = async () => {
    if (!user) return;
    const name = draftName.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    setSavingName(true);
    const { error } = await updateProfile(
      user.id,
      { full_name: name },
      user.email ?? undefined
    );
    setSavingName(false);

    if (error) {
      Alert.alert('Error', error);
      return;
    }

    await loadProfile();
    setEditing(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/login');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to sign out.');
    } finally {
      setSigningOut(false);
    }
  };

  if (!user) {
    return (
      <Screen>
        <PageHeader
          eyebrow="ACCOUNT"
          title="Your profile"
          subtitle="Manage your campus identity."
        />
        <EmptyState
          icon="person-outline"
          title="Not signed in"
          description="Sign in to view and manage your profile."
          actionLabel="Go to login"
          onAction={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <PageHeader
          eyebrow="ACCOUNT"
          title="Your profile"
          subtitle="Manage your campus identity."
        />
        <Card style={styles.centerCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </Card>
      </Screen>
    );
  }

  const role = profile?.role ?? 'student';
  const isTeacher = role === 'teacher';
  const displayName = profile?.full_name?.trim() ?? '';
  const email = profile?.email ?? user.email ?? '—';
  const initials = getInitials(displayName || email);

  return (
    <Screen>
      <PageHeader
        eyebrow="ACCOUNT"
        title="Your profile"
        subtitle="Manage your campus identity."
      />

      <Card variant="navy" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.heroBody}>
            <Text style={styles.heroName}>{displayName || 'Your profile'}</Text>
            <Badge
              tone={isTeacher ? 'accent' : 'light'}
              label={isTeacher ? 'Teacher' : 'Student'}
              style={styles.roleBadge}
            />
            <Text style={styles.heroEmail}>{email}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.detailsCard}>
        <SectionLabel>PERSONAL DETAILS</SectionLabel>

        {editing ? (
          <View style={styles.editBlock}>
            <FormField
              label="Full name"
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Your full name"
              autoCapitalize="words"
              autoFocus
              editable={!savingName}
            />

            <View style={styles.editActions}>
              <Pressable
                onPress={() => setEditing(false)}
                disabled={savingName}
                style={styles.cancelButton}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveName}
                disabled={savingName}
                style={({ pressed }) => [
                  styles.saveButton,
                  (pressed || savingName) && styles.saveButtonPressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.saveButtonText}>
                  {savingName ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name</Text>
              <Pressable
                onPress={startEditing}
                style={styles.nameRow}
                accessibilityRole="button"
              >
                <Text style={styles.detailValue}>
                  {displayName || 'Add your name'}
                </Text>
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={COLORS.primary}
                />
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{email}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account ID</Text>
              <Text
                style={styles.idValue}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {user.id}
              </Text>
            </View>
          </>
        )}
      </Card>

      <Card variant="soft" style={styles.sessionCard}>
        <SectionLabel>SESSION</SectionLabel>
        <Text style={styles.sessionText}>
          Signed in as {email}. Signing out returns you to the login screen.
        </Text>
        <AppButton
          theme="danger"
          title={signingOut ? 'Signing out...' : 'Sign out'}
          icon="log-out-outline"
          onPress={handleSignOut}
          disabled={signingOut}
        />
      </Card>
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
  hero: {
    marginBottom: SPACING.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: COLORS.textOnAccent,
  },
  heroBody: {
    flex: 1,
  },
  heroName: {
    ...TYPE.h2,
    color: COLORS.textOnPrimary,
  },
  roleBadge: {
    marginTop: SPACING.sm,
  },
  heroEmail: {
    ...TYPE.small,
    color: 'rgba(255, 255, 255, 0.68)',
    marginTop: 6,
  },
  detailsCard: {
    marginBottom: SPACING.lg,
  },
  detailRow: {
    paddingVertical: SPACING.sm,
  },
  detailLabel: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    ...TYPE.body,
    color: COLORS.textPrimary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  idValue: {
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.2,
  },
  editBlock: {
    gap: SPACING.md,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  cancelButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 11,
  },
  saveButtonPressed: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
  sessionCard: {
    marginBottom: SPACING.lg,
  },
  sessionText: {
    ...TYPE.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
});
