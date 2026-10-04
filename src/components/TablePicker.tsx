import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, font, radius, spacing } from '../theme';
import type { TableEntry } from '../data/tables';

export function TablePicker({
  title,
  die,
  entries,
  value,
  onSelect,
  onClose,
}: {
  title: string;
  die: string;
  entries: TableEntry[];
  value: string;
  onSelect: (text: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        accessibilityRole="button"
        accessibilityLabel="Закрыть таблицу"
        onPress={onClose}
      />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.titles}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.die}>{die}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
            onPress={onClose}
          >
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>
          Выберите строку или впишите своё в поле выше
        </Text>
        <ScrollView style={styles.list}>
          {entries.map(entry => (
            <Pressable
              key={entry.roll}
              accessibilityRole="button"
              accessibilityState={{ selected: value === entry.text }}
              onPress={() => {
                onSelect(entry.text);
                onClose();
              }}
            >
              <View
                style={[
                  styles.option,
                  value === entry.text && styles.optionActive,
                ]}
              >
                <Text style={styles.optionRoll}>{entry.roll}</Text>
                <View style={styles.optionBody}>
                  <Text style={styles.optionText}>{entry.text}</Text>
                  {entry.description ? (
                    <Text style={styles.optionDesc}>{entry.description}</Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    maxHeight: '80%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  titles: { flexDirection: 'row', alignItems: 'center' },
  title: { color: colors.text, fontSize: font.heading, fontWeight: '800' },
  die: {
    color: colors.yellow,
    fontSize: font.small,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  close: { color: colors.textDim, fontSize: 20, padding: spacing.xs },
  hint: {
    color: colors.textFaint,
    fontSize: font.small,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  option: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionActive: {
    borderColor: colors.yellow,
    backgroundColor: colors.surfaceAlt,
  },
  optionRoll: {
    color: colors.yellow,
    fontSize: font.small,
    fontWeight: '800',
    width: 26,
  },
  optionBody: { flex: 1 },
  optionText: { color: colors.text, fontSize: font.small, lineHeight: 18 },
  optionDesc: {
    color: colors.textFaint,
    fontSize: font.small,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
});
