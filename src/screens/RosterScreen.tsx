import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Empty, Screen } from '../components/ui';
import { useCharacterStore } from '../store/characterStore';
import {
  ABILITY_COLORS,
  ABILITY_LABELS,
  colors,
  font,
  radius,
  shadow,
  spacing,
} from '../theme';
import {
  defenseRating,
  availableSlots,
  type AbilityKey,
  type Character,
} from '../types';
import { findOrigin } from '../data/origins';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Roster'>;

const ABILITY_KEYS: AbilityKey[] = ['body', 'dexterity', 'savvy', 'tech'];

export default function RosterScreen({ navigation }: Props) {
  const characters = useCharacterStore(state => state.characters);
  const removeCharacter = useCharacterStore(state => state.removeCharacter);
  const setActive = useCharacterStore(state => state.setActive);
  const [longPressId, setLongPressId] = useState<string | null>(null);

  const open = useCallback(
    (id: string) => {
      setActive(id);
      navigation.navigate('Character', { id });
    },
    [navigation, setActive],
  );

  const confirmDelete = useCallback(
    (character: Character) => {
      Alert.alert(
        'Удалить персонажа?',
        `${
          character.name || 'Без имени'
        } будет удалён из хранилища безвозвратно.`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: () => removeCharacter(character.id),
          },
        ],
      );
    },
    [removeCharacter],
  );

  const renderItem = useCallback(
    ({ item }: { item: Character }) => {
      const origin = findOrigin(item.origin);
      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => open(item.id)}
          onLongPress={() => setLongPressId(item.id)}
          delayLongPress={350}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.cardTop}>
            <View style={styles.avatar}>
              <Text style={styles.portrait}>{item.portrait || '🛸'}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name || 'Без имени'}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {[
                  item.nickname && `«${item.nickname}»`,
                  origin?.name,
                  item.background,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Черновик'}
              </Text>
            </View>
          </View>
          <View style={styles.stats}>
            <Stat label="ХИТЫ" value={`${item.hp}/${item.hpMax}`} />
            <Stat
              label="ЗАЩИТА"
              value={String(
                defenseRating(item.abilities.dexterity, item.armor),
              )}
            />
            <Stat label="ГАЛО" value={String(item.holos)} />
            <Stat label="ПУСТОТА" value={String(item.voidPoints)} last />
          </View>

          <View style={styles.abilities}>
            {ABILITY_KEYS.map(key => (
              <View
                key={key}
                style={[styles.ability, { borderColor: ABILITY_COLORS[key] }]}
              >
                <Text
                  style={[styles.abilityValue, { color: ABILITY_COLORS[key] }]}
                >
                  {item.abilities[key] >= 0
                    ? `+${item.abilities[key]}`
                    : item.abilities[key]}
                </Text>
                <Text style={styles.abilityLabel}>{ABILITY_LABELS[key]}</Text>
              </View>
            ))}
          </View>

          <View style={styles.slots}>
            <Text style={styles.slotsText}>
              СЛОТЫ {item.items.length}/
              {availableSlots(item.abilities.body, item.armor)}
            </Text>
          </View>
          {longPressId === item.id ? (
            <View style={styles.deleteRow}>
              <Button
                title="УДАЛИТЬ"
                variant="danger"
                onPress={() => {
                  setLongPressId(null);
                  confirmDelete(item);
                }}
              />
              <Button
                title="ОТМЕНА"
                variant="ghost"
                onPress={() => setLongPressId(null)}
              />
            </View>
          ) : null}
        </Pressable>
      );
    },
    [confirmDelete, longPressId, open],
  );

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleMark}>
            <Text style={styles.titleMarkText}>☠</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>СМЕРТЬ В КОСМОСЕ</Text>
            <Text style={styles.subtitle}>ЛИСТ ПЕРСОНАЛЬНЫХ ДАННЫХ</Text>
          </View>
        </View>
        <Text style={styles.tagline}>
          {characters.length
            ? `${characters.length} ${
                characters.length === 1 ? 'персонаж' : 'персонажей'
              } на борту`
            : 'Экипаж не собран'}
        </Text>
        <View style={styles.headerActions}>
          <Button
            title="ХАБ"
            variant="ghost"
            onPress={() => navigation.navigate('Hub')}
            style={styles.headerButton}
          />
          <Button
            title="ТАБЛИЦЫ"
            variant="ghost"
            onPress={() => navigation.navigate('Tables')}
            style={styles.headerButton}
          />
          <Button
            title="+ ПЕРСОНАЖ"
            onPress={() => navigation.navigate('Create')}
            style={styles.headerButton}
          />
        </View>
      </View>
    ),
    [navigation, characters.length],
  );

  return (
    <Screen>
      <FlatList
        data={characters}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Empty
            glyph="☠️"
            text="Персонажей пока нет.\nНажмите «+ ПЕРСОНАЖ», чтобы бросить кости."
          />
        }
      />
    </Screen>
  );
}

function Stat({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.stat, last && styles.statLast]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  flex: { flex: 1 },
  header: { marginBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleMark: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.yellowDim,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  titleMarkText: { color: colors.yellow, fontSize: 20 },
  title: {
    color: colors.yellow,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
  },
  subtitle: {
    color: colors.textFaint,
    fontSize: font.tiny,
    letterSpacing: 2,
    marginTop: 3,
  },
  tagline: {
    color: colors.textFaint,
    fontSize: font.tiny,
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerActions: { flexDirection: 'row' },
  headerButton: { flex: 1, marginRight: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  pressed: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  portrait: { fontSize: 26 },
  cardInfo: { flex: 1 },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  cardSubtitle: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  stats: { flexDirection: 'row', marginTop: spacing.lg },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  statLast: { marginRight: 0 },
  statValue: { color: colors.text, fontSize: font.heading, fontWeight: '800' },
  statLabel: {
    color: colors.textFaint,
    fontSize: font.tiny,
    letterSpacing: 1,
    marginTop: 2,
  },
  abilities: { flexDirection: 'row', marginTop: spacing.lg },
  ability: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 1,
    marginRight: spacing.xs,
    alignItems: 'center',
  },
  abilityValue: { fontSize: font.heading, fontWeight: '800' },
  abilityLabel: {
    color: colors.textFaint,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  slots: { marginTop: spacing.md },
  slotsText: { color: colors.textFaint, fontSize: font.tiny, letterSpacing: 1 },
  deleteRow: { flexDirection: 'row', marginTop: spacing.md },
});
