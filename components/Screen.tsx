import { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function Screen({ children, scroll = true, contentStyle }: Props) {
  const body = (
    <View style={[styles.inner, !scroll && styles.fill, contentStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.frame}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  frame: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  scroll: {
    flexGrow: 1,
  },
  inner: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  fill: {
    flex: 1,
  },
});
