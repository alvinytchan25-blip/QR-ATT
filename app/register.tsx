import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import AuthScreen, { authStyles } from '@/components/AuthScreen';
import FormField from '@/components/FormField';
import InlineMessage from '@/components/InlineMessage';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPE } from '@/constants/theme';
import { signUp } from '@/lib/auth';

const ROLES: {
  value: 'student' | 'teacher';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'student', label: 'Student', icon: 'school-outline' },
  { value: 'teacher', label: 'Teacher', icon: 'briefcase-outline' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUp(email.trim(), password, {
        full_name: fullName.trim(),
        role,
      });

      if (authError) {
        setError(authError.message);
      } else if (data.session) {
        router.replace('/(tabs)');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Join the campus check-in system in a few seconds."
      footer={
        success ? undefined : (
          <Link href="/login" style={authStyles.link}>
            Already registered? Sign in
          </Link>
        )
      }
    >
      {success ? (
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <Ionicons
              name="mail-unread-outline"
              size={28}
              color={COLORS.success}
            />
          </View>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successText}>
            We sent a confirmation link to {email}. Verify your account, then
            come back and sign in.
          </Text>
          <Link href="/login" style={[authStyles.link, styles.successLink]}>
            Back to sign in
          </Link>
        </View>
      ) : (
        <View style={authStyles.form}>
          <FormField
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Alex Cruz"
            autoCapitalize="words"
            editable={!loading}
          />

          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@school.edu"
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            editable={!loading}
          />

          <FormField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            secureTextEntry
            editable={!loading}
          />

          <View>
            <Text style={styles.roleLabel}>I am a...</Text>
            <View style={styles.roleRow}>
              {ROLES.map((option) => {
                const selected = role === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.roleChip,
                      selected && styles.roleChipActive,
                    ]}
                    onPress={() => setRole(option.value)}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={selected ? COLORS.accent : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.roleChipText,
                        selected && styles.roleChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? <InlineMessage tone="error" message={error} /> : null}

          <AppButton
            theme="primary"
            title={loading ? 'Creating account...' : 'Create account'}
            icon="person-add-outline"
            onPress={handleRegister}
            disabled={loading}
          />
        </View>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  roleLabel: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  roleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  roleChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roleChipTextActive: {
    color: COLORS.textOnPrimary,
  },
  success: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.successSoft,
    marginBottom: SPACING.sm,
  },
  successTitle: {
    ...TYPE.h2,
    color: COLORS.textPrimary,
  },
  successText: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  successLink: {
    marginTop: SPACING.sm,
  },
});
