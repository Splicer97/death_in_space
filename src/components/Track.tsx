import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '../theme';

export function Track({
  value,
  max,
  onChange,
  color = colors.yellow,
  disabled,
}: {
  value: number;
  max: number;
  onChange?: (value: number) => void;
  color?: string;
  disabled?: boolean;
}) {
  const cells = Array.from({ length: max }, (_, index) => index);
  return (
    <View style={styles.track}>
      {cells.map(index => {
        const filled = index < value;
        const cell = (
          <View
            key={index}
            style={[
              styles.cell,
              filled && { backgroundColor: color, borderColor: color },
            ]}
          />
        );
        if (!onChange || disabled) {
          return cell;
        }
        return (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`Значение ${index + 1} из ${max}`}
            onPress={() => onChange(index + 1 === value ? index : index + 1)}
          >
            {cell}
          </Pressable>
        );
      })}
    </View>
  );
}

export function StatBlock({
  label,
  value,
  sub,
  tone = colors.text,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row' },
  cell: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.xs,
  },
  stat: {
    flex: 1,
    minWidth: 80,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  statLabel: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statValue: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  statSub: { color: colors.textFaint, fontSize: font.tiny, marginTop: 2 },
});
