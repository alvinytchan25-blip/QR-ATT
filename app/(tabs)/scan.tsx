import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import Screen from '@/components/Screen';
import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING, TYPE } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { registerAttendance } from '@/lib/attendance';

type Status = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
  title: string;
  text: string;
};

export default function ScanScreen() {
  const { user, loading: authLoading } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [scanned, setScanned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [torch, setTorch] = useState(false);

  // `scanned` alone is not enough: the camera keeps firing between the scan and
  // the network response, which would insert the same row many times.
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      inFlight.current = false;
    };
  }, []);

  const handleScanAgain = useCallback(() => {
    inFlight.current = false;
    setScanned(false);
    setSubmitting(false);
    setMessage(null);
    setSuccess(false);
  }, []);

  // Resumes the camera after a cancel. The tab bar is the other way back into
  // the scanner, so this only needs to cover the paused state on this screen.
  const handleStartScanning = useCallback(() => {
    handleScanAgain();
    setTorch(false);
    setScanning(true);
  }, [handleScanAgain]);

  // Unmounting CameraView is what actually shuts the camera down, so the
  // scanner stays on screen and simply stops scanning until the user resumes.
  const handleCancel = useCallback(() => {
    inFlight.current = false;
    handleScanAgain();
    setTorch(false);
    setScanning(false);
  }, [handleScanAgain]);

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (inFlight.current) return;
      inFlight.current = true;

      setScanned(true);
      setSubmitting(true);

      if (!user) {
        setSuccess(false);
        setMessage('You must be signed in to record attendance.');
        setSubmitting(false);
        return;
      }

      const result = await registerAttendance(data, user.id);
      if (!mounted.current) return;

      setMessage(result.message);
      setSuccess(result.success);
      setSubmitting(false);
    },
    [user]
  );

  if (authLoading) {
    return (
      <Screen scroll={false} contentStyle={styles.centerContent}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </Screen>
    );
  }

  if (!permission) {
    return (
      <Screen scroll={false} contentStyle={styles.centerContent}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <PageHeader
          eyebrow="SCANNER"
          title="Camera access"
          subtitle="We need your camera to read event QR codes."
        />
        <Card style={styles.permissionCard}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={30} color={COLORS.primary} />
          </View>
          <Text style={styles.permissionTitle}>Allow camera access</Text>
          <Text style={styles.permissionText}>
            You can change this later in your device settings.
          </Text>
          <AppButton
            theme="primary"
            title="Grant permission"
            icon="camera"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
        </Card>
      </Screen>
    );
  }

  if (!scanning) {
    return (
      <Screen>
        <PageHeader
          eyebrow="SCANNER"
          title="Scanner paused"
          subtitle="The camera is off until you start it again."
        />
        <Card style={styles.permissionCard}>
          <View style={styles.permissionIcon}>
            <Ionicons
              name="pause-circle-outline"
              size={30}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.permissionTitle}>Camera paused</Text>
          <Text style={styles.permissionText}>
            Start scanning when you are ready to check in.
          </Text>
          <AppButton
            theme="primary"
            title="Start scanning"
            icon="camera"
            onPress={handleStartScanning}
            style={styles.permissionButton}
          />
        </Card>
      </Screen>
    );
  }

  const status: Status = submitting
    ? {
        icon: 'hourglass-outline',
        color: COLORS.warningText,
        background: COLORS.warningSoft,
        title: 'Recording attendance',
        text: 'Checking the code and saving your check-in...',
      }
    : scanned
      ? success
        ? {
            icon: 'checkmark-circle',
            color: COLORS.successText,
            background: COLORS.successSoft,
            title: 'Attendance recorded',
            text: message ?? 'You are checked in.',
          }
        : {
            icon: 'alert-circle',
            color: COLORS.dangerText,
            background: COLORS.dangerSoft,
            title: 'Could not check in',
            text: message ?? 'Try scanning again.',
          }
      : {
          icon: 'qr-code-outline',
          color: COLORS.primary,
          background: COLORS.surface,
          title: 'Ready to scan',
          text: 'Point your camera at the event QR code.',
        };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={handleCancel}>
            <Ionicons
              name="close"
              size={22}
              color={COLORS.textOnPrimary}
            />
          </Pressable>

          <Text style={styles.topTitle}>Scan QR</Text>

          <Pressable
            style={styles.iconButton}
            onPress={() => setTorch((value) => !value)}
          >
            <Ionicons
              name={torch ? 'flash' : 'flash-off'}
              size={20}
              color={torch ? COLORS.accent : COLORS.textOnPrimary}
            />
          </Pressable>
        </View>

        <View style={styles.middle} pointerEvents="none">
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          <Text style={styles.frameText}>
            Align the QR code inside the frame
          </Text>
        </View>

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.statusRow}>
            <View
              style={[styles.statusIcon, { backgroundColor: status.background }]}
            >
              <Ionicons name={status.icon} size={22} color={status.color} />
            </View>

            <View style={styles.statusBody}>
              <Text style={styles.statusTitle}>{status.title}</Text>
              <Text style={styles.statusText}>{status.text}</Text>
            </View>
          </View>

          {scanned ? (
            <View style={styles.actions}>
              <AppButton
                theme="primary"
                title={submitting ? 'Recording...' : 'Scan again'}
                icon="refresh"
                onPress={handleScanAgain}
                disabled={submitting}
              />
              <AppButton
                theme="ghost"
                title="Pause camera"
                icon="pause"
                onPress={handleCancel}
                disabled={submitting}
                style={styles.pauseButton}
              />
            </View>
          ) : (
            <AppButton
              theme="secondary"
              title="Pause camera"
              icon="pause"
              onPress={handleCancel}
              style={styles.pauseButton}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  safe: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  topTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: COLORS.textOnPrimary,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
  },
  frame: {
    width: 250,
    height: 250,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: COLORS.accent,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: RADIUS.xl,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: RADIUS.xl,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: RADIUS.xl,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: RADIUS.xl,
  },
  frameText: {
    fontSize: 13,
    color: COLORS.textOnPrimary,
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowRadius: 4,
  },
  sheet: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.hero,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBody: {
    flex: 1,
  },
  statusTitle: {
    ...TYPE.h3,
    color: COLORS.textPrimary,
  },
  statusText: {
    ...TYPE.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actions: {
    marginTop: SPACING.lg,
  },
  pauseButton: {
    marginTop: SPACING.sm,
  },
  permissionCard: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  permissionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentSoft,
    marginBottom: SPACING.lg,
  },
  permissionTitle: {
    ...TYPE.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  permissionText: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    maxWidth: 300,
  },
  permissionButton: {
    marginTop: SPACING.xl,
  },
});
