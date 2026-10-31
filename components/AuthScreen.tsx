import { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING, TYPE } from '@/constants/theme';

type Props = {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
};

export default function AuthScreen({ title, subtitle, footer, children }: Props) {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.frame}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={Keyboard.dismiss}
            >
              <View style={styles.block}>
                <Header tone="light" />

                <Text style={styles.kicker}>CAMPUS ACCESS</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>

                <View style={styles.card}>
                  {children}
                  {footer ? <View style={styles.footer}>{footer}</View> : null}
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  safe: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  frame: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  block: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  kicker: {
    ...TYPE.caption,
    color: COLORS.accent,
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPE.display,
    color: COLORS.textOnPrimary,
  },
  subtitle: {
    ...TYPE.body,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xxl,
    maxWidth: 400,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.hero,
  },
  footer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
});

/** Shared by the auth forms so login and register stay identical. */
export const authStyles = StyleSheet.create({
  form: {
    gap: SPACING.lg,
  },
  actions: {
    marginTop: SPACING.xs,
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
});
