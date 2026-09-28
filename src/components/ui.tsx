import React, { useContext } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { Starfield } from './Starfield';
import { colors, font, radius, shadow, spacing, type } from '../theme';

const FALLBACK_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useContext(SafeAreaInsetsContext) ?? FALLBACK_INSETS;
  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, spacing.sm),
          paddingBottom: insets.bottom,
        },
        style,
      ]}
    >
      <Starfield />
      {children}
    </View>
  );
}

export function Ornament({
  glyphs = ['✦', '⌬', '✶'],
  color = colors.textFaint,
  style,
}: {
  glyphs?: string[];
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.ornament}>
      <View style={styles.ornamentRule} />
      <Text style={[styles.ornamentText, {color}, style]}>
        {glyphs.join(' ')}
      </Text>
      <View style={styles.ornamentRule} />
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardSheen} />
      {children}
    </View>
  );
}

export function SectionTitle({
  index,
  title,
  subtitle,
}: {
  index?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.sectionAccent} />
      <View style={styles.flex}>
        <View style={styles.sectionHeadline}>
          {index ? <Text style={styles.sectionIndex}>{index}</Text> : null}
          <Text style={styles.sectionText}>{title}</Text>
        </View>
        {subtitle ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  style,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'number-pad';
  style?: StyleProp<ViewStyle>;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        style={[
          styles.input,
          multiline ? styles.inputMultiline : null,
          keyboardType && keyboardType !== 'default'
            ? styles.inputNumber
            : null,
        ]}
      />
    </View>
  );
}

export function NumberStepper({
  label,
  value,
  onChange,
  min = -3,
  max = 3,
  hint,
  big,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  hint?: string;
  big?: boolean;
}) {
  const clamp = (next: number) => Math.max(min, Math.min(max, next));
  return (
    <View style={styles.stepper}>
      <View style={styles.flex}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={styles.stepperControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Уменьшить ${label}`}
          onPress={() => onChange(clamp(value - 1))}
          style={({ pressed }) => [
            styles.stepperButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.stepperSign}>−</Text>
        </Pressable>
        <Text style={[styles.stepperValue, big && styles.stepperValueBig]}>
          {value >= 0 ? `+${value}` : value}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Увеличить ${label}`}
          onPress={() => onChange(clamp(value + 1))}
          style={({ pressed }) => [
            styles.stepperButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.stepperSign}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
  textStyle,
  singleLine,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  singleLine?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'danger' && styles.buttonDanger,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        numberOfLines={singleLine ? 1 : undefined}
        style={[
          styles.buttonText,
          variant === 'ghost' && styles.buttonTextGhost,
          variant === 'danger' && styles.buttonTextDanger,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  tone,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: string;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        tone ? { borderColor: tone } : null,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Tag({
  label,
  color = colors.textDim,
}: {
  label: string;
  color?: string;
}) {
  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function KeyValue({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={[styles.kvValue, valueStyle]}>{value || '—'}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Empty({
  text,
  glyph = '🛸',
}: {
  text: string;
  glyph?: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyGlyph}>
        <View style={styles.emptyHalo} />
        <Text style={styles.emptyGlyphText}>{glyph}</Text>
      </View>
      <Text style={styles.emptyText}>{text}</Text>
      <Ornament glyphs={['✦', '⌬']} />
    </View>
  );
}

export function Hint({ text }: { text: string }) {
  return <Text style={styles.hint}>{text}</Text>;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Поиск',
  accessibilityLabel = 'Поиск',
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
}) {
  return (
    <View style={styles.search}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={accessibilityLabel}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Очистить поиск"
          onPress={() => onChangeText('')}
          style={styles.searchClear}
        >
          <Text style={styles.searchClearText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Snackbar({
  message,
  actionLabel,
  onAction,
  onDismiss,
  visible,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }
  return (
    <View style={styles.snackbar} pointerEvents="box-none">
      <View style={styles.snackbarBox}>
        <Text style={styles.snackbarText}>{message}</Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={onAction}
          >
            <Text style={styles.snackbarAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
        {onDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
            onPress={onDismiss}
          >
            <Text style={styles.snackbarClose}>✕</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  ornamentRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  ornamentText: {
    fontSize: font.tiny,
    letterSpacing: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.surfaceHi,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: spacing.md,
  },
  sectionAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.yellow,
    marginRight: spacing.sm,
  },
  sectionHeadline: { flexDirection: 'row', alignItems: 'center' },
  sectionIndex: {
    color: colors.yellow,
    fontSize: font.small,
    fontWeight: '800',
    marginRight: spacing.sm,
    letterSpacing: 1,
  },
  sectionText: { ...type.section, color: colors.text },
  sectionSubtitle: {
    color: colors.textFaint,
    fontSize: font.tiny,
    lineHeight: 14,
    letterSpacing: 0.6,
    marginTop: 3,
  },
  field: { marginBottom: spacing.md },
  label: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: font.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 3,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  inputNumber: { textAlign: 'right' },
  hint: { color: colors.textFaint, fontSize: font.tiny, lineHeight: 14 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepperControls: { flexDirection: 'row', alignItems: 'center' },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSign: { color: colors.yellow, fontSize: 20, fontWeight: '700' },
  stepperValue: {
    color: colors.text,
    fontSize: font.heading,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'center',
  },
  stepperValueBig: { fontSize: 26 },
  button: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonPrimary: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  buttonGhost: { backgroundColor: 'transparent', borderColor: colors.border },
  buttonDanger: {
    backgroundColor: 'transparent',
    borderColor: colors.red,
  },
  buttonText: {
    color: '#111114',
    fontSize: font.body,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  buttonTextGhost: { color: colors.text },
  buttonTextDanger: { color: colors.red },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.35 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow,
    ...shadow.raised,
  },
  chipText: {
    color: colors.textDim,
    fontSize: font.small,
    fontWeight: '700',
    letterSpacing: 1,
  },
  chipTextSelected: { color: '#111114' },
  tag: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagText: { fontSize: font.tiny, fontWeight: '800', letterSpacing: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  kvLabel: {
    color: colors.textDim,
    fontSize: font.small,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginRight: spacing.md,
  },
  kvValue: {
    color: colors.text,
    fontSize: font.small,
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  searchIcon: {color: colors.textFaint, fontSize: 16, marginRight: spacing.xs},
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: font.small,
    paddingVertical: spacing.sm,
  },
  searchClear: {paddingHorizontal: spacing.xs},
  searchClearText: {color: colors.textFaint, fontSize: font.small},
  snackbar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
  snackbarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHi,
    borderWidth: 1,
    borderColor: colors.yellowDim,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.card,
  },
  snackbarText: {flex: 1, color: colors.text, fontSize: font.small},
  snackbarAction: {
    color: colors.yellow,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.sm,
  },
  snackbarClose: {color: colors.textFaint, fontSize: font.small},
  emptyGlyph: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyHalo: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: colors.yellowDim,
    opacity: 0.35,
  },
  emptyGlyphText: { fontSize: 40 },
  emptyText: {
    color: colors.textFaint,
    fontSize: font.small,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
