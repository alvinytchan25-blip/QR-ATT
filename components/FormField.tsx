import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPE } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function FormField({
  label,
  hint,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={COLORS.textMuted}
        selectionColor={COLORS.accent}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[styles.input, focused && styles.inputFocused, style]}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs + 2,
  },
  label: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  hint: {
    ...TYPE.small,
    color: COLORS.textMuted,
  },
});
