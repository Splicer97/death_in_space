import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, Chip, Screen, SectionTitle } from '../../components/ui';
import { selectCharacter, useCharacterStore } from '../../store/characterStore';
import { selectHistory, useRollStore } from '../../store/rollStore';
import { ABILITY_LABELS, colors } from '../../theme';
import { defenseRating, type AbilityKey } from '../../types';
import {
  formatRoll,
  performRoll,
  rollDice,
  sum,
  type ModifierMode,
  type RollResult,
} from '../../utils/dice';
import type { RootStackParamList } from '../../navigation/types';
import { styles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Roll'>;

const MODES: { key: ModifierMode; label: string }[] = [
  { key: 'normal', label: 'ОБЫЧНЫЙ' },
  { key: 'advantage', label: 'ПРЕИМУЩЕСТВО' },
  { key: 'disadvantage', label: 'ПОМЕХА' },
];

const EXTRA_DICE: { label: string; count: number; sides: number }[] = [
  { label: '1d4', count: 1, sides: 4 },
  { label: '1d6', count: 1, sides: 6 },
  { label: '1d8', count: 1, sides: 8 },
  { label: '1d10', count: 1, sides: 10 },
  { label: '1d12', count: 1, sides: 12 },
  { label: '2d6', count: 2, sides: 6 },
  { label: '3d6', count: 3, sides: 6 },
];

function rollAll(): { label: string; value: number }[] {
  return EXTRA_DICE.map(die => ({
    label: die.label,
    value: sum(rollDice(die.count, die.sides)),
  }));
}

export default function RollScreen({ route }: Props) {
  const character = useCharacterStore(selectCharacter(route.params.id));
  const [ability, setAbility] = useState<AbilityKey | null>('body');
  const [mode, setMode] = useState<ModifierMode>('normal');
  const [target, setTarget] = useState<number | null>(12);
  const history = useRollStore(selectHistory(route.params.id));
  const push = useRollStore(state => state.push);
  const clear = useRollStore(state => state.clear);
  const [last, setLast] = useState<RollResult | null>(null);
  const [extra, setExtra] = useState(() => rollAll());

  const modifier = ability && character ? character.abilities[ability] : 0;
  const dr = character
    ? defenseRating(character.abilities.dexterity, character.armor)
    : 12;

  const roll = useCallback(() => {
    const result = performRoll(modifier, mode, target);
    setLast(result);
    setExtra(rollAll());
    push(route.params.id, result);
  }, [mode, modifier, push, route.params.id, target]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <SectionTitle
            title="БРОСОК"
            subtitle="1d20 + способность · успех от 12"
          />
          <Text style={styles.subLabel}>СПОСОБНОСТЬ</Text>
          <View style={styles.row}>
            <Chip
              label="БЕЗ"
              selected={ability === null}
              onPress={() => setAbility(null)}
            />
            {(['body', 'dexterity', 'savvy', 'tech'] as AbilityKey[]).map(
              key => (
                <Chip
                  key={key}
                  label={`${ABILITY_LABELS[key]} ${
                    character?.abilities[key] ?? 0
                  }`}
                  selected={ability === key}
                  onPress={() => setAbility(key)}
                />
              ),
            )}
          </View>

          <Text style={styles.subLabel}>РЕЖИМ</Text>
          <View style={styles.row}>
            {MODES.map(item => (
              <Chip
                key={item.key}
                label={item.label}
                selected={mode === item.key}
                onPress={() => setMode(item.key)}
              />
            ))}
          </View>

          <Text style={styles.subLabel}>ЦЕЛЬ</Text>
          <View style={styles.row}>
            <Chip
              label="НЕТ"
              selected={target === null}
              onPress={() => setTarget(null)}
            />
            <Chip
              label="12"
              selected={target === 12}
              onPress={() => setTarget(12)}
            />
            <Chip
              label={`ЗАЩИТА ${dr}`}
              selected={target === dr}
              onPress={() => setTarget(dr)}
              tone={colors.yellow}
            />
          </View>

          <Button title="БРОСИТЬ" onPress={roll} style={styles.rollButton} />
        </Card>

        {last ? (
          <Card>
            <Text style={styles.total}>{last.total}</Text>
            <Text style={styles.formula}>{formatRoll(last)}</Text>
            {last.success !== null ? (
              <Text
                style={[
                  styles.verdict,
                  { color: last.success ? colors.green : colors.red },
                ]}
              >
                {last.success ? 'УСПЕХ' : 'ПРОВАЛ'}
              </Text>
            ) : null}
            {last.mode !== 'normal' ? (
              <Text style={styles.note}>
                {last.dice.join(' и ')} →{' '}
                {last.mode === 'advantage'
                  ? Math.max(...last.dice)
                  : Math.min(...last.dice)}
              </Text>
            ) : null}
            {last.success === false && character && character.voidPoints < 4 ? (
              <Text style={styles.note}>
                Провал проверки или атаки даёт +1 очко пустоты.
              </Text>
            ) : null}
          </Card>
        ) : null}

        <Card>
          <SectionTitle title="КУБИКИ" subtitle="обновляются после броска" />
          <View style={styles.row}>
            {extra.map(item => (
              <View key={item.label} style={styles.dieBox}>
                <Text style={styles.dieValue}>{item.value}</Text>
                <Text style={styles.dieLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {history.length > 0 ? (
          <Card>
            <View style={styles.historyHeader}>
              <SectionTitle title="ИСТОРИЯ" />
              <Button
                title="ОЧИСТИТЬ"
                variant="ghost"
                singleLine
                onPress={() => clear(route.params.id)}
              />
            </View>
            {history.map((result, index) => (
              <View key={index} style={styles.historyRow}>
                <Text style={styles.historyText}>{formatRoll(result)}</Text>
                {result.success !== null ? (
                  <Text
                    style={[
                      styles.historyVerdict,
                      { color: result.success ? colors.green : colors.red },
                    ]}
                  >
                    {result.success ? 'УСПЕХ' : 'ПРОВАЛ'}
                  </Text>
                ) : null}
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
