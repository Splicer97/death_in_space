import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import {
  Button,
  Card,
  Chip,
  Field,
  NumberStepper,
  Screen,
  SectionTitle,
  Tag,
} from '../../components/ui';
import { TablePicker } from '../../components/TablePicker';
import { Track } from '../../components/Track';
import { ORIGINS } from '../../data/origins';
import {
  BACKGROUNDS,
  DRIVES,
  LOOKS,
  PAST_ALLEGIANCES,
  STARTING_BONUSES,
  STARTING_KITS,
  TRAITS,
  TRINKETS,
  type TableEntry,
} from '../../data/tables';
import {
  ABILITY_LABELS,
  ABILITY_NAMES,
  colors,
} from '../../theme';
import {
  abilitySum,
  itemSlots,
  LIFE_SUPPORT_STEPS,
  MAX_VOID_POINTS,
  type Abilities,
  type AbilityKey,
  type CharacterDraft,
} from '../../types';
import { ABILITY_KEYS } from '../../types';
import { emptyCharacter, useCharacterStore } from '../../store/characterStore';
import { rollAbilityValue, rollDie, sum, rollDice } from '../../utils/dice';
import type { RootStackParamList } from '../../navigation/types';
import { styles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Create'>;

const PORTRAITS = [
  '🛸',
  '🪐',
  '👩‍🚀',
  '👨‍🚀',
  '🤖',
  '👾',
  '☠️',
  '🧟',
  '🦾',
  '👁️',
  '⚡',
  '🧬',
];
const DEFAULT_HP = 6;

const STEPS = [
  'СПОСОБНОСТИ',
  'ПРОИСХОЖДЕНИЕ',
  'ДЕТАЛИ ПЕРСОНАЖА',
  'БЫВШАЯ ПРЕДАННОСТЬ',
  'ХИТЫ И ЗАЩИТА',
  'СНАРЯЖЕНИЕ И БОНУС',
];

export default function CreateScreen({ navigation }: Props) {
  const addCharacter = useCharacterStore(state => state.addCharacter);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CharacterDraft>(() => {
    const base = emptyCharacter();
    return { ...base, hpMax: DEFAULT_HP, hp: DEFAULT_HP };
  });

  const patch = useCallback((value: Partial<CharacterDraft>) => {
    setDraft(current => ({ ...current, ...value }));
  }, []);

  const rollAbilities = useCallback(() => {
    const abilities = {} as Abilities;
    ABILITY_KEYS.forEach(key => {
      abilities[key] = rollAbilityValue().value;
    });
    patch({ abilities });
  }, [patch]);

  const setAbility = useCallback((key: AbilityKey, value: number) => {
    setDraft(current => ({
      ...current,
      abilities: { ...current.abilities, [key]: value },
    }));
  }, []);

  const pick = useCallback(
    (entries: TableEntry[]) => entries[rollDie(entries.length) - 1].text,
    [],
  );

  const [picker, setPicker] = useState<{
    title: string;
    die: string;
    entries: TableEntry[];
    value: string;
    onSelect: (value: string) => void;
  } | null>(null);

  const openPicker = useCallback(
    (
      title: string,
      die: string,
      entries: TableEntry[],
      value: string,
      apply: (value: string) => void,
    ) => setPicker({ title, die, entries, value, onSelect: apply }),
    [],
  );

  const sumOfAbilities = useMemo(
    () => abilitySum(draft.abilities),
    [draft.abilities],
  );
  const needsBonus = sumOfAbilities < 0;
  const hpBonus = needsBonus ? 3 : 0;

  const finish = useCallback(() => {
    if (!draft.name.trim()) {
      Alert.alert('Нужно имя', 'Дайте персонажу имя, чтобы создать лист.');
      return;
    }
    const maxHp = draft.hpMax + (needsBonus ? 3 : 0);
    const id = addCharacter({
      ...draft,
      hpMax: maxHp,
      hp: maxHp,
    });
    navigation.replace('Character', { id });
  }, [addCharacter, draft, navigation, needsBonus]);

  return (
    <Screen>
      <View style={styles.stepBar}>
        {STEPS.map((title, index) => (
          <Pressable
            key={title}
            accessibilityRole="button"
            onPress={() => setStep(index)}
            style={[styles.stepDot, index === step && styles.stepDotActive]}
          >
            <Text
              style={[styles.stepNum, index === step && styles.stepNumActive]}
            >
              {index + 1}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.stepTitle}>
        {step + 1}. {STEPS[step]}
      </Text>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={12}
      >
        {step === 0 ? (
          <>
            <Card>
<SectionTitle
                  index="ШАГ 1"
                  title="ГЕНЕРАЦИЯ СПОСОБНОСТЕЙ"
                  subtitle="2d4, первая минус вторая · диапазон −3…+3"
                />
              {ABILITY_KEYS.map(key => (
                <NumberStepper
                  key={key}
                  label={`${ABILITY_LABELS[key]} — ${ABILITY_NAMES[key]}`}
                  value={draft.abilities[key]}
                  onChange={value => setAbility(key, value)}
                  min={-3}
                  max={3}
                />
              ))}
              <Text style={styles.sum}>
                СУММА:{' '}
                {sumOfAbilities >= 0 ? `+${sumOfAbilities}` : sumOfAbilities}
              </Text>
              <Button title="БРОСИТЬ 2d4 × 4" onPress={rollAbilities} />
              <View style={styles.spacer} />
              <Text style={styles.help}>
                {ABILITY_KEYS.map(
                  key => `${ABILITY_LABELS[key]}: ${draft.abilities[key]}`,
                ).join('   ')}
              </Text>
            </Card>
            <Card>
              <Text style={styles.help}>
                ТЕЛ — физическая сила и сопротивление, атаки в ближнем бою{'\n'}
                ЛОВ — рефлексы, уравновешенность и скорость{'\n'}
                РАЗУМ — восприятие, интуиция, психологическая устойчивость,
                пилотирование{'\n'}
                ТЕХ — понимание и использование технологий, дальние атаки
              </Text>
            </Card>
          </>
        ) : null}

        {step === 1 ? (
          <>
            {ORIGINS.map(origin => {
              const selected = draft.origin === origin.key;
              return (
                <Card
                  key={origin.key}
                  style={[
                    styles.originCard,
                    selected && styles.originCardActive,
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() =>
                      patch({ origin: origin.key, originBenefits: [] })
                    }
                    style={styles.rowBetween}
                  >
                    <Text
                      style={[
                        styles.originName,
                        selected && styles.originNameActive,
                      ]}
                    >
                      {origin.name}
                    </Text>
                    {selected ? (
                      <Tag label="ВЫБРАН" color={colors.yellow} />
                    ) : null}
                  </Pressable>
                  <Text style={styles.originDesc}>{origin.description}</Text>
                  <Text style={styles.benefitsLabel}>ОДНА ИЗ ДВУХ ВЫГОД:</Text>
                  {origin.benefits.map(benefit => {
                    const active = draft.originBenefits.includes(benefit.name);
                    return (
                      <Pressable
                        key={benefit.name}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        onPress={() =>
                          patch({
                            originBenefits: active ? [] : [benefit.name],
                          })
                        }
                        style={[styles.benefit, active && styles.benefitActive]}
                      >
                        <Text
                          style={[
                            styles.benefitName,
                            active && styles.benefitNameActive,
                          ]}
                        >
                          {benefit.name}
                        </Text>
                        <Text style={styles.benefitDesc}>
                          {benefit.description}
                        </Text>
                      </Pressable>
                    );
                  })}
                </Card>
              );
            })}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Card>
              <SectionTitle
                index="ШАГ 3"
                title="ДЕТАЛИ"
                subtitle="Бросьте или придумайте своё"
              />
              <Row2>
                <Field
                  style={styles.half}
                  label="ИМЯ"
                  value={draft.name}
                  onChangeText={value => patch({ name: value })}
                  placeholder="Кто ты?"
                />
                <Field
                  style={styles.half}
                  label="ПРОЗВИЩЕ"
                  value={draft.nickname}
                  onChangeText={value => patch({ nickname: value })}
                  placeholder="Необязательно"
                />
              </Row2>
              <Text style={styles.label}>ПОРТРЕТ</Text>
              <View style={styles.row}>
                {PORTRAITS.map(emoji => (
                  <Chip
                    key={emoji}
                    label={emoji}
                    selected={draft.portrait === emoji}
                    onPress={() => patch({ portrait: emoji })}
                  />
                ))}
              </View>
              <Field
                label="ИМЕНА ИГРОКА"
                value={draft.playerName}
                onChangeText={value => patch({ playerName: value })}
              />
            </Card>

            <Card>
              <SectionTitle title="ПРЕДЫСТОРИЯ" subtitle="d20" />
              <RolledRow
                name="предыстория"
                value={draft.background}
                onChange={value => patch({ background: value })}
                onRoll={() => patch({ background: pick(BACKGROUNDS) })}
                onPickFrom={() =>
                  openPicker(
                    'ПРЕДЫСТОРИЯ',
                    'd20',
                    BACKGROUNDS,
                    draft.background,
                    value => patch({ background: value }),
                  )
                }
              />
              <SectionTitle title="ЧЕРТА" subtitle="d20" />
              <RolledRow
                name="черта"
                value={draft.trait}
                onChange={value => patch({ trait: value })}
                onRoll={() => patch({ trait: pick(TRAITS) })}
                onPickFrom={() =>
                  openPicker('ЧЕРТА', 'd20', TRAITS, draft.trait, value =>
                    patch({ trait: value }),
                  )
                }
              />
              <SectionTitle title="СТИМУЛ" subtitle="d20" />
              <RolledRow
                name="стимул"
                value={draft.drive}
                onChange={value => patch({ drive: value })}
                onRoll={() => patch({ drive: pick(DRIVES) })}
                onPickFrom={() =>
                  openPicker('СТИМУЛ', 'd20', DRIVES, draft.drive, value =>
                    patch({ drive: value }),
                  )
                }
                multiline
              />
              <SectionTitle title="ВНЕШНОСТЬ" subtitle="d20" />
              <RolledRow
                name="внешность"
                value={draft.looks}
                onChange={value => patch({ looks: value })}
                onRoll={() => patch({ looks: pick(LOOKS) })}
                onPickFrom={() =>
                  openPicker('ВНЕШНОСТЬ', 'd20', LOOKS, draft.looks, value =>
                    patch({ looks: value }),
                  )
                }
                multiline
              />
            </Card>
          </>
        ) : null}

        {step === 3 ? (
          <Card>
            <SectionTitle
              index="ШАГ 4"
              title="БЫВШАЯ ПРЕДАННОСТЬ"
              subtitle="d6 · война за самоцветы"
            />
            {PAST_ALLEGIANCES.map(entry => (
              <Pressable
                key={entry.roll}
                accessibilityRole="button"
                onPress={() => patch({ pastAllegiance: entry.text })}
              >
                <View
                  style={[
                    styles.option,
                    draft.pastAllegiance === entry.text && styles.optionActive,
                  ]}
                >
                  <Text style={styles.optionRoll}>{entry.roll}</Text>
                  <Text style={styles.optionText}>{entry.text}</Text>
                </View>
              </Pressable>
            ))}
            <Button
              title="БРОСИТЬ d6"
              onPress={() => patch({ pastAllegiance: pick(PAST_ALLEGIANCES) })}
            />
          </Card>
        ) : null}

        {step === 4 ? (
          <Card>
            <SectionTitle
              index="ШАГ 5"
              title="ХИТЫ И ЗАЩИТА"
              subtitle="Максимум хитов 1d8 · защита 12+ЛОВ · лечение 1d8+ТЕЛ"
            />
            <NumberStepper
              label="МАКСИМУМ ХИТОВ"
              value={draft.hpMax + hpBonus}
              onChange={value => {
                const raw = Math.max(1, Math.min(8, value - hpBonus));
                patch({ hpMax: raw, hp: raw });
              }}
              min={1 + hpBonus}
              max={8 + hpBonus}
              big
            />
            {needsBonus ? (
              <View style={styles.bonusBanner}>
                <Text style={styles.bonusBannerText}>
                  Сумма способностей {sumOfAbilities} — отрицательная. Стартовый
                  бонус добавил{' '}
                  <Text style={styles.bonusBannerAccent}>+3 к ОЗ</Text>.
                </Text>
              </View>
            ) : null}
            <Text style={styles.help}>
              Если не бросать кубик, лист стартует с {DEFAULT_HP} хитами
              {needsBonus ? ` плюс ${hpBonus} за стартовый бонус` : ''}.
            </Text>
            <Button
              title="БРОСИТЬ 1d8"
              onPress={() => {
                const rolled = rollDie(8);
                patch({ hpMax: rolled, hp: rolled });
              }}
            />
            <View style={styles.spacer} />
            <Text style={styles.help}>
              Защита без брони: {12 + draft.abilities.dexterity}
              {'\n'}Слоты предметов: {itemSlots(draft.abilities.body)}
              {'\n'}Лечение за отдых: 1d8+{draft.abilities.body}
            </Text>
            <View style={styles.spacer} />
            <Field
              label="ОЧКИ ПУСТОТЫ (0–4)"
              value={String(draft.voidPoints)}
              onChangeText={value =>
                patch({
                  voidPoints: Math.max(
                    0,
                    Math.min(MAX_VOID_POINTS, parseInt(value, 10) || 0),
                  ),
                })
              }
              keyboardType="number-pad"
            />
            <Track
              value={draft.voidPoints}
              max={MAX_VOID_POINTS}
              onChange={value => patch({ voidPoints: value })}
            />
          </Card>
        ) : null}

        {step === 5 ? (
          <>
            <Card>
              <SectionTitle
                index="ШАГ 6"
                title="СТАРТОВОЕ СНАРЯЖЕНИЕ"
                subtitle="Набор d6, белка d20"
              />
              <SectionTitle title="НАБОР" subtitle="d6" />
              <RolledRow
                name="набор"
                value={draft.startingKit}
                onChange={value => patch({ startingKit: value })}
                onRoll={() => patch({ startingKit: pick(STARTING_KITS) })}
                onPickFrom={() =>
                  openPicker(
                    'НАБОР',
                    'd6',
                    STARTING_KITS,
                    draft.startingKit,
                    value => patch({ startingKit: value }),
                  )
                }
              />
              <SectionTitle title="ЛИЧНАЯ БЕЗДЕЛУШКА" subtitle="d20" />
              <RolledRow
                name="безделушка"
                value={draft.trinket}
                onChange={value => patch({ trinket: value })}
                onRoll={() => patch({ trinket: pick(TRINKETS) })}
                onPickFrom={() =>
                  openPicker(
                    'ЛИЧНАЯ БЕЗДЕЛУШКА',
                    'd20',
                    TRINKETS,
                    draft.trinket,
                    value => patch({ trinket: value }),
                  )
                }
                multiline
              />
            </Card>
            <Card>
              <SectionTitle title="СБЕРЕЖЕНИЯ" subtitle="3d10 гало" />
              <NumberStepper
                label="ГАЛО"
                value={draft.holos}
                onChange={value => patch({ holos: value })}
                min={0}
                max={999}
                big
              />
              <Button
                title="БРОСИТЬ 3d10"
                onPress={() => patch({ holos: sum(rollDice(3, 10)) })}
              />
            </Card>
            {needsBonus ? (
              <Card>
                <SectionTitle
                  title="СТАРТОВЫЙ БОНУС"
                  subtitle={`Сумма способностей ${sumOfAbilities} — бросьте 1d6`}
                />
                {STARTING_BONUSES.map(entry => (
                  <Pressable
                    key={entry.roll}
                    accessibilityRole="button"
                    onPress={() => patch({ startingBonus: entry.text })}
                  >
                    <View
                      style={[
                        styles.option,
                        draft.startingBonus === entry.text &&
                          styles.optionActive,
                      ]}
                    >
                      <Text style={styles.optionRoll}>{entry.roll}</Text>
                      <Text style={styles.optionText}>{entry.text}</Text>
                    </View>
                  </Pressable>
                ))}
                <Button
                  title="БРОСИТЬ 1d6"
                  onPress={() =>
                    patch({ startingBonus: pick(STARTING_BONUSES) })
                  }
                />
              </Card>
            ) : (
              <Card>
                <Text style={styles.help}>
                  Сумма способностей не отрицательна — стартовый бонус не нужен.
                </Text>
              </Card>
            )}
            <Card>
              <SectionTitle
                title="ЖИЗНЕОБЕСПЕЧЕНИЕ"
                subtitle={`${LIFE_SUPPORT_STEPS} шагов`}
              />
              <Track
                value={draft.lifeSupport}
                max={LIFE_SUPPORT_STEPS}
                onChange={value => patch({ lifeSupport: value })}
                color={colors.blue}
              />
            </Card>
            <Text style={styles.footer}>
              ЭТО БЫЛ ПОСЛЕДНИЙ ШАГ / ПРИЯТНОЙ СМЕРТИ В КОСМОСЕ
            </Text>
          </>
        ) : null}
      </KeyboardAwareScrollView>

      <View style={styles.footerBar}>
        <Button
          title="НАЗАД"
          variant="ghost"
          onPress={() => (step === 0 ? navigation.goBack() : setStep(step - 1))}
          style={styles.footerButton}
        />
        {step < STEPS.length - 1 ? (
          <Button
            title="ДАЛЬШЕ"
            onPress={() => setStep(step + 1)}
            style={styles.footerButton}
          />
        ) : (
          <Button
            title="СОЗДАТЬ"
            onPress={finish}
            style={styles.footerButton}
          />
        )}
      </View>

      {picker ? (
        <TablePicker
          title={picker.title}
          die={picker.die}
          entries={picker.entries}
          value={picker.value}
          onSelect={picker.onSelect}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </Screen>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <View style={styles.row2}>{children}</View>;
}

function RolledRow({
  name,
  value,
  onChange,
  onRoll,
  onPickFrom,
  placeholder,
  multiline,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  onRoll: () => void;
  onPickFrom: () => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.rolled}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? 'Впишите своё или выберите из таблицы…'}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        style={[styles.rolledInput, multiline && styles.rolledInputMultiline]}
      />
      <View style={styles.rolledActions}>
        <Chip
          label="БРОСОК"
          accessibilityLabel={`Бросок: ${name}`}
          onPress={onRoll}
        />
        <Chip
          label="ИЗ ТАБЛИЦЫ"
          accessibilityLabel={`Таблица: ${name}`}
          onPress={onPickFrom}
        />
        {value ? (
          <Chip
            label="ОЧИСТИТЬ"
            accessibilityLabel={`Очистить: ${name}`}
            onPress={() => onChange('')}
          />
        ) : null}
      </View>
    </View>
  );
}
