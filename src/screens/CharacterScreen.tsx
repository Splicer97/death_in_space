import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView';

import {
  Button,
  Card,
  Chip,
  Divider,
  Field,
  Hint,
  KeyValue,
  NumberStepper,
  Screen,
  SectionTitle,
} from '../components/ui';
import { Track } from '../components/Track';
import { TablePicker } from '../components/TablePicker';
import { ARMOR_PRESETS } from '../data/armor';
import { findOrigin, ORIGINS } from '../data/origins';
import { COSMIC_MUTATIONS, VOID_CORRUPTIONS } from '../data/mutations';
import {
  BACKGROUNDS,
  DRIVES,
  LOOKS,
  PAST_ALLEGIANCES,
  TRAITS,
} from '../data/tables';
import type { TableEntry } from '../data/tables';
import {
  emptyCharacter,
  newId,
  selectCharacter,
  useCharacterStore,
} from '../store/characterStore';
import {
  ABILITY_COLORS,
  ABILITY_LABELS,
  ABILITY_NAMES,
  colors,
  font,
  radius,
  spacing,
} from '../theme';
import {
  defenseRating,
  availableSlots,
  itemSlots,
  itemWeight,
  itemsUsed,
  LIFE_SUPPORT_STEPS,
  MAX_VOID_POINTS,
  MAX_WEAPON_CONDITION,
  type Character,
  type Item,
} from '../types';
import { rollDie } from '../utils/dice';
import { characterToText } from '../utils/sheetText';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Character'>;

const TABS = ['ЛИСТ', 'ВЕЩИ', 'ЗАМЕТКИ'] as const;

export default function CharacterScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const character = useCharacterStore(selectCharacter(id));
  const updateCharacter = useCharacterStore(state => state.updateCharacter);
  const removeCharacter = useCharacterStore(state => state.removeCharacter);
  const [tab, setTab] = useState<0 | 1 | 2>(0);
  const [showMutations, setShowMutations] = useState(false);
  const [showCorruptions, setShowCorruptions] = useState(false);
  const [tablePicker, setTablePicker] = useState<null | {
    title: string;
    die: string;
    entries: TableEntry[];
    current: string;
    onSelect: (text: string) => void;
  }>(null);

  const share = useCallback(() => {
    if (!character) {
      return;
    }
    Share.share({
      title: character.name || 'Лист персонажа',
      message: characterToText(character),
    }).catch(() => undefined);
  }, [character]);

  const set = useCallback(
    (patch: Partial<Character>) => {
      if (character) {
        updateCharacter(character.id, patch);
      }
    },
    [character, updateCharacter],
  );

  if (!character) {
    return (
      <Screen>
        <View style={styles.missing}>
          <Text style={styles.missingText}>
            Персонаж не найден в хранилище.
          </Text>
          <Button title="НАЗАД" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  const origin = findOrigin(character.origin);
  const armor = character.armor;
  const dr = defenseRating(character.abilities.dexterity, character.armor);
  const totalSlots = itemSlots(character.abilities.body);
  const slots = availableSlots(character.abilities.body, character.armor);
  const usedSlots = itemsUsed(character.items);
  const overloaded = usedSlots > slots;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.portraitFrame}>
            <Text style={styles.portrait}>{character.portrait || '🛸'}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {character.name || 'Без имени'}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {origin ? origin.name : 'ПРОИСХОЖДЕНИЕ НЕ ВЫБРАНО'}
              {character.nickname ? ` · «${character.nickname}»` : ''}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Поделиться листом"
              onPress={share}
              style={styles.shareButton}
            >
              <Text style={styles.shareButtonText}>⤴</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Открыть броски"
              onPress={() => navigation.navigate('Roll', { id })}
              style={styles.rollButton}
            >
              <Text style={styles.rollButtonText}>d20</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.headerStats}>
          <HeadStat
            label="ХИТЫ"
            value={`${character.hp}/${character.hpMax}`}
            tone={character.hp <= 2 ? colors.red : colors.text}
          />
          <HeadStat label="ЗАЩИТА" value={String(dr)} />
          <HeadStat label="ГАЛО" value={String(character.holos)} />
          <HeadStat
            label="ДОЛГ"
            value={String(character.debt)}
            tone={character.debt > 0 ? colors.red : colors.text}
          />
          <HeadStat label="XP" value={String(character.xp)} />
          <HeadStat
            label="ПУСТОТА"
            value={`${character.voidPoints}/${MAX_VOID_POINTS}`}
            tone={colors.violet}
          />
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((title, index) => (
          <Pressable
            key={title}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === index }}
            onPress={() => setTab(index as 0 | 1 | 2)}
            style={[styles.tab, tab === index && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === index && styles.tabTextActive]}
            >
              {title}
            </Text>
          </Pressable>
        ))}
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={12}
      >
        {tab === 0 ? (
          <>
            <Card>
              <SectionTitle index="0" title="ИНФОРМАЦИЯ ИГРОКА" />
              <Field
                label="ИМЯ ИГРОКА"
                value={character.playerName}
                onChangeText={playerName => set({ playerName })}
                placeholder="Кто ведёт этого персонажа"
                autoCapitalize="words"
              />
            </Card>

            <Card>
              <SectionTitle index="1" title="ЛИЧНАЯ ИНФОРМАЦИЯ" />
              <View style={styles.row}>
                {(['body', 'dexterity', 'savvy', 'tech'] as const).map(key => (
                  <View
                    key={key}
                    style={[
                      styles.abilityBox,
                      { borderColor: ABILITY_COLORS[key] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.abilityLabel,
                        { color: ABILITY_COLORS[key] },
                      ]}
                    >
                      {ABILITY_LABELS[key]}
                    </Text>
                    <Text style={styles.abilityValue}>
                      {character.abilities[key] >= 0
                        ? `+${character.abilities[key]}`
                        : character.abilities[key]}
                    </Text>
                    <View style={styles.abilityControls}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          set({
                            abilities: {
                              ...character.abilities,
                              [key]: Math.max(-3, character.abilities[key] - 1),
                            },
                          })
                        }
                        style={styles.abilityButton}
                      >
                        <Text style={styles.abilitySign}>−</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          set({
                            abilities: {
                              ...character.abilities,
                              [key]: Math.min(3, character.abilities[key] + 1),
                            },
                          })
                        }
                        style={styles.abilityButton}
                      >
                        <Text style={styles.abilitySign}>+</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.abilityName}>{ABILITY_NAMES[key]}</Text>
                  </View>
                ))}
              </View>
              <Divider />
              <NumberStepper
                label="XP (не потрачено)"
                value={character.xp}
                onChange={xp => set({ xp: Math.max(0, xp) })}
                min={0}
                max={999}
              />
              <Divider />
              <SectionTitle
                index="3"
                title="СОВЕРШЕНСТВОВАНИЕ"
                subtitle="Стр. 64 · каждый «да» сессии = 1 очко опыта"
              />
              <KeyValue label="Способность +1 (максимум +1)" value="5 XP" />
              <KeyValue
                label="Способность +1 (+2 и выше)"
                value="3 × желаемое значение"
              />
              <KeyValue label="Максимум ОЗ +1d4" value="5 XP" />
              <KeyValue
                label="Случайная мутация (−1 к способности)"
                value="15 XP"
              />
              <KeyValue
                label="Преимущество происхождения (макс. 2)"
                value="15 XP"
              />
              <Field
                label="ИМЯ"
                value={character.name}
                onChangeText={name => set({ name })}
              />
              <Field
                label="ПРОЗВИЩЕ"
                value={character.nickname}
                onChangeText={nickname => set({ nickname })}
              />
              <Field
                label="ПРЕДЫСТОРИЯ (d20)"
                value={character.background}
                onChangeText={background => set({ background })}
              />
              <SelectFromTable
                label="ПРЕДЫСТОРИЯ (d20)"
                onOpen={() =>
                  setTablePicker({
                    title: 'ПРЕДЫСТОРИЯ',
                    die: 'd20',
                    entries: BACKGROUNDS,
                    current: character.background,
                    onSelect: background => set({ background }),
                  })
                }
              />
              <Field
                label="БЫВШАЯ ПРЕДАННОСТЬ (d6)"
                value={character.pastAllegiance}
                onChangeText={pastAllegiance => set({ pastAllegiance })}
                multiline
              />
              <SelectFromTable
                label="БЫВШАЯ ПРЕДАННОСТЬ (d6)"
                onOpen={() =>
                  setTablePicker({
                    title: 'БЫВШАЯ ПРЕДАННОСТЬ',
                    die: 'd6',
                    entries: PAST_ALLEGIANCES,
                    current: character.pastAllegiance,
                    onSelect: pastAllegiance => set({ pastAllegiance }),
                  })
                }
              />
              <Field
                label="ЧЕРТА (d20)"
                value={character.trait}
                onChangeText={trait => set({ trait })}
              />
              <SelectFromTable
                label="ЧЕРТА (d20)"
                onOpen={() =>
                  setTablePicker({
                    title: 'ЧЕРТА',
                    die: 'd20',
                    entries: TRAITS,
                    current: character.trait,
                    onSelect: trait => set({ trait }),
                  })
                }
              />
              <Field
                label="СТИМУЛ (d20)"
                value={character.drive}
                onChangeText={drive => set({ drive })}
                multiline
              />
              <SelectFromTable
                label="СТИМУЛ (d20)"
                onOpen={() =>
                  setTablePicker({
                    title: 'СТИМУЛ',
                    die: 'd20',
                    entries: DRIVES,
                    current: character.drive,
                    onSelect: drive => set({ drive }),
                  })
                }
              />
              <Field
                label="ВНЕШНОСТЬ (d20)"
                value={character.looks}
                onChangeText={looks => set({ looks })}
                multiline
              />
              <SelectFromTable
                label="ВНЕШНОСТЬ (d20)"
                onOpen={() =>
                  setTablePicker({
                    title: 'ВНЕШНОСТЬ',
                    die: 'd20',
                    entries: LOOKS,
                    current: character.looks,
                    onSelect: looks => set({ looks }),
                  })
                }
              />
              {origin ? (
                <>
                  <Divider />
                  <Text style={styles.body}>{origin.name}</Text>
                  <Text style={styles.dim}>{origin.description}</Text>
                  <Text style={[styles.subLabel, { marginTop: spacing.md }]}>
                    ВЫГОДЫ
                  </Text>
                  {origin.benefits.map(benefit => {
                    const active = character.originBenefits.includes(
                      benefit.name,
                    );
                    return (
                      <Pressable
                        key={benefit.name}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        onPress={() =>
                          set({
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
                        <Text style={styles.dim}>{benefit.description}</Text>
                      </Pressable>
                    );
                  })}
                  <View style={styles.row}>
                    <Button
                      title="СМЕНИТЬ ПРОИСХОЖДЕНИЕ"
                      variant="ghost"
                      onPress={() => set({ origin: null, originBenefits: [] })}
                      style={styles.wideButton}
                    />
                  </View>
                </>
              ) : (
                <>
                  <Divider />
                  <Text style={styles.subLabel}>ПРОИСХОЖДЕНИЕ</Text>
                  <View style={styles.row}>
                    {ORIGINS.map(item => (
                      <Chip
                        key={item.key}
                        label={item.name}
                        selected={character.origin === item.key}
                        onPress={() =>
                          set({
                            origin: item.key,
                            originBenefits: [],
                          })
                        }
                      />
                    ))}
                  </View>
                  <Hint text="Выберите происхождение — выгоды появятся ниже." />
                </>
              )}
            </Card>

            <Card>
              <SectionTitle
                index="1"
                title="ЗАЩИТА И ХИТЫ"
                subtitle="12+ЛОВ · старт 1d8 · лечение 1d8+ТЕЛ"
              />
              <NumberStepper
                label="ТЕКУЩИЕ ХИТЫ"
                value={character.hp}
                onChange={hp => set({ hp })}
                min={-99}
                max={character.hpMax}
                big
              />
              <NumberStepper
                label="МАКСИМУМ ХИТОВ"
                value={character.hpMax}
                onChange={hpMax => set({ hpMax: Math.max(1, hpMax) })}
                min={1}
                max={99}
              />
              <View style={styles.row}>
                <Button
                  title="−1"
                  variant="ghost"
                  onPress={() => set({ hp: character.hp - 1 })}
                  style={styles.smallButton}
                />
                <Button
                  title="ОТДЫХ 1d8+ТЕЛ"
                  onPress={() => {
                    const healed =
                      rollDie(8) + Math.max(0, character.abilities.body);
                    set({
                      hp: Math.min(character.hpMax, character.hp + healed),
                    });
                    Alert.alert('Отдых', `Восстановлено ${healed} хитов.`);
                  }}
                  style={styles.wideButton}
                />
                <Button
                  title="+1"
                  variant="ghost"
                  onPress={() =>
                    set({ hp: Math.min(character.hpMax, character.hp + 1) })
                  }
                  style={styles.smallButton}
                />
              </View>
              <KeyValue
                label="ЗАЩИТА БЕЗ БРОНИ"
                value={String(12 + character.abilities.dexterity)}
              />
              <KeyValue
                label="ЗАЩИТА С БРОНЁЙ"
                value={String(dr)}
                valueStyle={{ color: colors.yellow }}
              />
              <KeyValue label="СЛОТЫ ПРЕДМЕТОВ" value={String(slots)} />
              {armor && (armor.slots ?? 0) > 0 ? (
                <KeyValue
                  label="БРОНЯ ЗАНИМАЕТ"
                  value={`${armor.slots ?? 0} из ${totalSlots}`}
                />
              ) : null}
            </Card>

            <Card>
              <SectionTitle
                index="2"
                title="ТЕКУЩАЯ СИТУАЦИЯ"
                subtitle="Пустота растёт от провалов, максимум 4"
              />
              <Text style={styles.subLabel}>ОЧКИ ПУСТОТЫ</Text>
              <Track
                value={character.voidPoints}
                max={MAX_VOID_POINTS}
                color={colors.violet}
                onChange={voidPoints => set({ voidPoints })}
              />
              <Hint text="Тратятся: преимущество на проверке/атаке либо активация мутации." />
              <Divider />
              <Text style={styles.subLabel}>ЖИЗНЕОБЕСПЕЧЕНИЕ</Text>
              <Track
                value={character.lifeSupport}
                max={LIFE_SUPPORT_STEPS}
                color={colors.blue}
                onChange={lifeSupport => set({ lifeSupport })}
              />
              <Hint
                text={`${LIFE_SUPPORT_STEPS} шагов, минус один за час в скафандре.`}
              />
              <Divider />
              <Text style={styles.subLabel}>КОСМИЧЕСКИЕ МУТАЦИИ</Text>
              {character.mutations.length === 0 ? (
                <Hint text="Пока нет мутаций." />
              ) : (
                character.mutations.map(mutation => (
                  <Pressable
                    key={mutation}
                    accessibilityRole="button"
                    onPress={() =>
                      set({
                        mutations: character.mutations.filter(
                          item => item !== mutation,
                        ),
                      })
                    }
                    style={styles.listRow}
                  >
                    <Text style={styles.listText}>{mutation}</Text>
                    <Text style={styles.listRemove}>✕</Text>
                  </Pressable>
                ))
              )}
              <View style={styles.row}>
                <Button
                  title="ВЫБРАТЬ МУТАЦИЮ"
                  variant="ghost"
                  onPress={() => setShowMutations(true)}
                  style={styles.wideButton}
                />
              </View>
            </Card>

            <Card>
              <SectionTitle
                index="2"
                title="ПОРЧА ПУСТОТЫ"
                subtitle="d20 · постоянные последствия"
              />
              {character.voidCorruption.map((corruption, index) => (
                <Pressable
                  key={`${corruption}-${index}`}
                  accessibilityRole="button"
                  onPress={() =>
                    set({
                      voidCorruption: character.voidCorruption.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    })
                  }
                  style={styles.listRow}
                >
                  <Text style={styles.listText}>{corruption}</Text>
                  <Text style={styles.listRemove}>✕</Text>
                </Pressable>
              ))}
              <View style={styles.row}>
                <Button
                  title="БРОСОК d20"
                  onPress={() => {
                    const result =
                      VOID_CORRUPTIONS[rollDie(VOID_CORRUPTIONS.length) - 1];
                    set({
                      voidCorruption: [
                        ...character.voidCorruption,
                        `${result.id}. ${result.text}`,
                      ],
                    });
                  }}
                  style={styles.wideButton}
                />
                <Button
                  title="ИЗ СПИСКА"
                  variant="ghost"
                  onPress={() => setShowCorruptions(true)}
                  style={styles.wideButton}
                />
              </View>
              <AddRow
                placeholder="Своя порча пустоты…"
                onAdd={text =>
                  text.trim()
                    ? set({
                        voidCorruption: [
                          ...character.voidCorruption,
                          text.trim(),
                        ],
                      })
                    : undefined
                }
              />
            </Card>
          </>
        ) : null}

        {tab === 1 ? (
          <>
            <Card>
              <SectionTitle
                index="3"
                title="ЛИЧНОЕ ИМУЩЕСТВО"
                subtitle={`${usedSlots}/${slots} слотов${
                  overloaded ? ' · ПЕРЕГРУЗ' : ''
                }`}
              />
              {overloaded ? (
                <Text style={styles.warning}>
                  Занято {usedSlots} слотов при {slots} свободных — помеха на
                  все действия.
                </Text>
              ) : null}
              {character.items.map(item => (
                <View key={item.id} style={styles.itemBlock}>
                  <View style={styles.itemRow}>
                    <TextInput
                      value={item.name}
                      onChangeText={name =>
                        set({
                          items: character.items.map(current =>
                            current.id === item.id
                              ? { ...current, name }
                              : current,
                          ),
                        })
                      }
                      placeholder="Предмет"
                      placeholderTextColor={colors.textFaint}
                      style={[styles.itemInput, styles.flex]}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        item.condition > 0
                          ? 'Убрать состояние'
                          : 'Добавить состояние'
                      }
                      onPress={() =>
                        set({
                          items: character.items.map(current =>
                            current.id === item.id
                              ? {
                                  ...current,
                                  condition:
                                    current.condition > 0
                                      ? 0
                                      : MAX_WEAPON_CONDITION,
                                }
                              : current,
                          ),
                        })
                      }
                      style={[
                        styles.conditionToggle,
                        item.condition > 0 && styles.conditionToggleOn,
                      ]}
                    >
                      <Text style={styles.conditionToggleText}>
                        {item.condition > 0 ? 'СОСТ' : '+ СОСТ'}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Удалить предмет"
                      onPress={() =>
                        set({
                          items: character.items.filter(
                            current => current.id !== item.id,
                          ),
                        })
                      }
                      style={styles.removeButton}
                    >
                      <Text style={styles.listRemove}>✕</Text>
                    </Pressable>
                  </View>
                  {item.condition > 0 ? (
                    <View style={styles.conditionBox}>
                      {[1, 2, 3, 4, 5].map(level => (
                        <Pressable
                          key={level}
                          accessibilityRole="button"
                          accessibilityLabel={`Состояние ${level}`}
                          onPress={() =>
                            set({
                              items: character.items.map(current =>
                                current.id === item.id
                                  ? {
                                      ...current,
                                      condition:
                                        level === item.condition ? 0 : level,
                                    }
                                  : current,
                              ),
                            })
                          }
                          style={[
                            styles.conditionCell,
                            item.condition >= level && styles.conditionCellOn,
                          ]}
                        />
                      ))}
                    </View>
                  ) : null}
                  <View style={styles.itemWeight}>
                    <Text style={styles.itemWeightLabel}>ВЕС</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Уменьшить вес"
                      onPress={() =>
                        set({
                          items: character.items.map(current =>
                            current.id === item.id
                              ? { ...current, weight: Math.max(0, itemWeight(current) - 1) }
                              : current,
                          ),
                        })
                      }
                      style={styles.weightButton}
                    >
                      <Text style={styles.weightSign}>−</Text>
                    </Pressable>
                    <Text style={styles.itemWeightValue}>
                      {itemWeight(item)}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Увеличить вес"
                      onPress={() =>
                        set({
                          items: character.items.map(current =>
                            current.id === item.id
                              ? {
                                  ...current,
                                  weight: Math.min(12, itemWeight(current) + 1),
                                }
                              : current,
                          ),
                        })
                      }
                      style={styles.weightButton}
                    >
                      <Text style={styles.weightSign}>+</Text>
                    </Pressable>
                    <Text style={styles.itemWeightHint}>
                      слот{itemWeight(item) === 1 ? '' : 'а'}
                    </Text>
                  </View>
                </View>
              ))}
              <Button
                title="+ ПРЕДМЕТ"
                variant="ghost"
                onPress={() =>
                  set({
                    items: [
                      ...character.items,
                      {
                        id: newId(),
                        name: '',
                        condition: MAX_WEAPON_CONDITION,
                        weight: 1,
                      },
                    ] as Item[],
                  })
                }
              />
              <Divider />
              <Text style={styles.subLabel}>МЕЛКИЕ ПРЕДМЕТЫ (без слотов)</Text>
              {character.smallItems.length === 0 ? (
                <Hint text="Компоненты — 1 слот, запчасти для техники — 5 слотов." />
              ) : (
                <View style={styles.smallItemsWrap}>
                  {character.smallItems.map((item, index) => (
                    <View
                      key={`${item.name}-${index}`}
                      style={styles.smallItemCell}
                    >
                      <View style={styles.smallItemRow}>
                        <TextInput
                          value={item.name}
                          onChangeText={name =>
                            set({
                              smallItems: character.smallItems.map(
                                (current, itemIndex) =>
                                  itemIndex === index
                                    ? { ...current, name }
                                    : current,
                              ),
                            })
                          }
                          placeholder="Мелкий предмет"
                          placeholderTextColor={colors.textFaint}
                          style={[styles.smallItemInput, styles.flex]}
                        />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            item.condition
                              ? 'Убрать состояние'
                              : 'Добавить состояние'
                          }
                          onPress={() =>
                            set({
                              smallItems: character.smallItems.map(
                                (current, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...current,
                                        condition: current.condition
                                          ? 0
                                          : MAX_WEAPON_CONDITION,
                                      }
                                    : current,
                              ),
                            })
                          }
                          style={[
                            styles.conditionToggle,
                            item.condition != null &&
                              item.condition > 0 &&
                              styles.conditionToggleOn,
                          ]}
                        >
                          <Text style={styles.conditionToggleText}>
                            {item.condition != null && item.condition > 0
                              ? 'СОСТ'
                              : '+ СОСТ'}
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Меньше: ${item.name}`}
                          onPress={() =>
                            set({
                              smallItems: character.smallItems.map(
                                (current, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...current,
                                        count: Math.max(1, current.count - 1),
                                      }
                                    : current,
                              ),
                            })
                          }
                          style={styles.smallItemStepper}
                        >
                          <Text style={styles.smallItemCountSign}>−</Text>
                        </Pressable>
                        <Text style={styles.smallItemCount}>
                          {item.count}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Больше: ${item.name}`}
                          onPress={() =>
                            set({
                              smallItems: character.smallItems.map(
                                (current, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...current,
                                        count: Math.min(999, current.count + 1),
                                      }
                                    : current,
                              ),
                            })
                          }
                          style={styles.smallItemStepper}
                        >
                          <Text style={styles.smallItemCountSign}>+</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Удалить: ${item.name}`}
                          onPress={() =>
                            set({
                              smallItems: character.smallItems.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            })
                          }
                        >
                          <Text style={styles.smallItemRemove}>✕</Text>
                        </Pressable>
                      </View>
                      {item.condition != null && item.condition > 0 ? (
                        <View style={styles.conditionBox}>
                          {[1, 2, 3, 4, 5].map(level => (
                            <Pressable
                              key={level}
                              accessibilityRole="button"
                              accessibilityLabel={`Состояние ${level}`}
                              onPress={() =>
                                set({
                                  smallItems: character.smallItems.map(
                                    (current, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...current,
                                            condition:
                                              level === item.condition
                                                ? 0
                                                : level,
                                          }
                                        : current,
                                  ),
                                })
                              }
                              style={[
                                styles.conditionCell,
                                item.condition != null &&
                                  item.condition >= level &&
                                  styles.conditionCellOn,
                              ]}
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
              <AddRow
                placeholder="Мелкий предмет…"
                onAdd={text => {
                  const name = text.trim();
                  if (name) {
                    set({
                      smallItems: [...character.smallItems, {name, count: 1}],
                    });
                  }
                }}
              />
            </Card>

            <Card>
              <SectionTitle
                title="ОРУЖИЕ"
                subtitle="Урон · заряды · состояние 1–5"
              />
              {character.weapons.map((weapon, index) => (
                <View key={index} style={styles.weaponBox}>
                  <Text style={styles.subLabel}>ОРУЖИЕ {index + 1}</Text>
                  <Field
                    label="НАЗВАНИЕ"
                    value={weapon.name}
                    onChangeText={name =>
                      set({
                        weapons: replaceWeapon(character.weapons, index, {
                          ...weapon,
                          name,
                        }),
                      })
                    }
                  />
<View style={styles.row}>
                      <Field
                        style={styles.weaponHalf}
                        label="УРОН"
                        value={weapon.damage}
                        onChangeText={damage =>
                          set({
                            weapons: replaceWeapon(character.weapons, index, {
                              ...weapon,
                              damage,
                            }),
                          })
                        }
                        placeholder="1d6"
                      />
                      <Field
                        style={styles.weaponHalf}
                        label="В ОБОЙМЕ СЕЙЧАС"
                        value={weapon.uses ? String(weapon.uses) : ''}
                        onChangeText={value =>
                          set({
                            weapons: replaceWeapon(character.weapons, index, {
                              ...weapon,
                              uses: parseInt(value, 10) || 0,
                            }),
                          })
                        }
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.row}>
                      <Field
                        style={styles.weaponHalf}
                        label="В ОБОЙМЕ МАКСИМУМ"
                        value={
                          weapon.maxUses != null && weapon.maxUses > 0
                            ? String(weapon.maxUses)
                            : ''
                        }
                        onChangeText={value =>
                          set({
                            weapons: replaceWeapon(character.weapons, index, {
                              ...weapon,
                              maxUses: parseInt(value, 10) || 0,
                            }),
                          })
                        }
                        keyboardType="number-pad"
                      />
                      <Field
                        style={styles.weaponHalf}
                        label="ВСЕГО ПАТРОН"
                        value={weapon.ammo ?? ''}
                        onChangeText={ammo =>
                          set({
                            weapons: replaceWeapon(character.weapons, index, {
                              ...weapon,
                              ammo,
                            }),
                          })
                        }
                      />
                    </View>
                  <Text style={styles.subLabel}>СОСТОЯНИЕ</Text>
                  <Track
                    value={weapon.condition}
                    max={MAX_WEAPON_CONDITION}
                    color={colors.green}
                    onChange={condition =>
                      set({
                        weapons: replaceWeapon(character.weapons, index, {
                          ...weapon,
                          condition,
                        }),
                      })
                    }
                  />
                </View>
              ))}
            </Card>

            <Card>
              <SectionTitle
                title="БРОНЯ"
                subtitle="Защита 12+ЛОВ плюс бонус брони"
              />
              {armor ? (
                <>
                  <Field
                    label="ТИП"
                    value={armor.type}
                    onChangeText={type => set({ armor: { ...armor, type } })}
                  />
                  <Field
                    label="ЗАЩИЩАЕТ ОТ"
                    value={armor.protectsAgainst}
                    onChangeText={protectsAgainst =>
                      set({ armor: { ...armor, protectsAgainst } })
                    }
                  />
                  <NumberStepper
                    label="БОНУС ЗАЩИТЫ"
                    value={armor.drBonus}
                    onChange={drBonus => set({ armor: { ...armor, drBonus } })}
                    min={0}
                    max={5}
                  />
                  <NumberStepper
                    label="ЗАНИМАЕТ СЛОТОВ"
                    value={armor.slots ?? 0}
                    onChange={value =>
                      set({ armor: { ...armor, slots: value } })
                    }
                    min={0}
                    max={12}
                  />

                  <View style={styles.row}>
                    <Button
                      title="СНЯТЬ БРОНЮ"
                      variant="danger"
                      onPress={() => set({ armor: null })}
                      style={styles.wideButton}
                    />
                  </View>
                </>
              ) : (
                <Button
                  title="НАДЕТЬ БРОНЮ"
                  onPress={() =>
                    set({
                      armor: {
                        type: ARMOR_PRESETS[1].type,
                        protectsAgainst: ARMOR_PRESETS[1].protectsAgainst,
                        drBonus: ARMOR_PRESETS[1].drBonus,
                        slots: ARMOR_PRESETS[1].slots,
                      },
                    })
                  }
                />
              )}
              <Divider />
              <Text style={styles.subLabel}>ГОТОВЫЕ ВАРИАНТЫ</Text>
              <View style={styles.row}>
                {ARMOR_PRESETS.map(preset => (
                  <Chip
                    key={preset.type}
                    label={`${preset.type} +${preset.drBonus} / ${preset.slots} сл.`}
                    selected={armor?.type === preset.type}
                    onPress={() =>
                      set({
                        armor: {
                          type: preset.type,
                          protectsAgainst: preset.protectsAgainst,
                          drBonus: preset.drBonus,
                          slots: preset.slots,
                        },
                      })
                    }
                  />
                ))}
              </View>
            </Card>

            <Card>
              <SectionTitle
                title="ГАЛО И ДОЛГИ"
                subtitle="Ремонт: 30 гало за состояние, 300 за корабль"
              />
              <View style={styles.row}>
                <NumberStepper
                  label="ГАЛО"
                  value={character.holos}
                  onChange={holos => set({ holos: Math.max(0, holos) })}
                  min={0}
                  max={999999}
                />
                <NumberStepper
                  label="ДОЛГ"
                  value={character.debt}
                  onChange={debt => set({ debt: Math.max(0, debt) })}
                  min={0}
                  max={999999}
                />
              </View>
            </Card>
          </>
        ) : null}

        {tab === 2 ? (
          <>
            <SectionTitle
              index="4"
              title="ЗАМЕТКИ"
              subtitle="Группы записей: цели, связи, долги, детали"
            />
            {character.noteGroups.map((group, index) => (
              <Card key={group.id}>
                <Field
                  label="НАЗВАНИЕ ГРУППЫ"
                  value={group.title}
                  onChangeText={title =>
                    set({
                      noteGroups: character.noteGroups.map((entry, i) =>
                        i === index ? {...entry, title} : entry,
                      ),
                    })
                  }
                  placeholder="Цели, связи, долги…"
                />
                <Field
                  label="ЗАМЕТКИ"
                  value={group.text}
                  onChangeText={text =>
                    set({
                      noteGroups: character.noteGroups.map((entry, i) =>
                        i === index ? {...entry, text} : entry,
                      ),
                    })
                  }
                  multiline
                  placeholder="Что запомнить по этой группе…"
                  style={styles.tall}
                />
                <Button
                  title="УДАЛИТЬ ГРУППУ"
                  variant="danger"
                  onPress={() =>
                    Alert.alert(
                      'Удалить группу?',
                      `Группа «${group.title || 'Без названия'}» будет удалена.`,
                      [
                        {text: 'Отмена', style: 'cancel'},
                        {
                          text: 'Удалить',
                          style: 'destructive',
                          onPress: () =>
                            set({
                              noteGroups: character.noteGroups.filter(
                                (_, i) => i !== index,
                              ),
                            }),
                        },
                      ],
                    )
                  }
                />
              </Card>
            ))}
            <Card>
              <AddRow
                placeholder="Название группы заметок…"
                onAdd={title => {
                  const trimmed = title.trim();
                  if (trimmed) {
                    set({
                      noteGroups: [
                        ...character.noteGroups,
                        {id: newId(), title: trimmed, text: ''},
                      ],
                    });
                  }
                }}
              />
              {character.noteGroups.length === 0 ? (
                <Hint text="Заметок пока нет — добавьте первую группу, например «Цели» или «Долги мастеру»." />
              ) : null}
            </Card>
            <Card>
              <SectionTitle title="СТАРТОВОЕ СНАРЯЖЕНИЕ" />
              <KeyValue label="НАБОР" value={character.startingKit} />
              <KeyValue label="ЛИЧНАЯ БЕЗДЕЛУШКА" value={character.trinket} />
              <KeyValue
                label="СТАРТОВЫЙ БОНУС"
                value={character.startingBonus}
              />
            </Card>
            <Button
              title="УДАЛИТЬ ПЕРСОНАЖА"
              variant="danger"
              onPress={() =>
                Alert.alert(
                  'Удалить персонажа?',
                  `${character.name || 'Без имени'} будет удалён из ростера.`,
                  [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Удалить',
                      style: 'destructive',
                      onPress: () => {
                        removeCharacter(character.id);
                        navigation.goBack();
                      },
                    },
                  ],
                )
              }
            />
            <View style={styles.spacer} />
            <Button
              title="ОЧИСТИТЬ ВСЁ"
              variant="danger"
              onPress={() =>
                Alert.alert(
                  'Очистить персонажа?',
                  'Все поля, кроме имени и способностей, будут сброшены.',
                  [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Очистить',
                      style: 'destructive',
                      onPress: () => {
                        const fresh = emptyCharacter();
                        set({
                          ...fresh,
                          name: character.name,
                          abilities: character.abilities,
                          hp: character.hp,
                          hpMax: character.hpMax,
                        });
                      },
                    },
                  ],
                )
              }
            />
          </>
        ) : null}
      </KeyboardAwareScrollView>

      {showMutations ? (
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <ScrollView>
              <Text style={styles.modalTitle}>КОСМИЧЕСКИЕ МУТАЦИИ</Text>
              <Text style={styles.modalSub}>
                Активация стоит 1+ очков пустоты. Эффект ~10 минут, радиус 10
                метров.
              </Text>
              {COSMIC_MUTATIONS.map(mutation => {
                const active = character.mutations.includes(mutation.name);
                return (
                  <Pressable
                    key={mutation.id}
                    accessibilityRole="button"
                    onPress={() =>
                      set({
                        mutations: active
                          ? character.mutations.filter(
                              item => item !== mutation.name,
                            )
                          : [...character.mutations, mutation.name],
                      })
                    }
                    style={[
                      styles.mutationRow,
                      active && styles.mutationRowActive,
                    ]}
                  >
                    <Text style={styles.mutationRoll}>{mutation.id}</Text>
                    <View style={styles.flex}>
                      <Text
                        style={[
                          styles.mutationName,
                          active && { color: colors.yellow },
                        ]}
                      >
                        {mutation.name}
                      </Text>
                      <Text style={styles.dim}>{mutation.description}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Button title="ЗАКРЫТЬ" onPress={() => setShowMutations(false)} />
          </View>
        </View>
      ) : null}

      {tablePicker ? (
        <TablePicker
          title={tablePicker.title}
          die={tablePicker.die}
          entries={tablePicker.entries}
          value={tablePicker.current}
          onSelect={tablePicker.onSelect}
          onClose={() => setTablePicker(null)}
        />
      ) : null}
      {showCorruptions ? (
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <ScrollView>
              <Text style={styles.modalTitle}>ПОРЧА ПУСТОТЫ</Text>
              <Text style={styles.modalSub}>
                Постоянные последствия провалов. Дубли по ролям невозможны.
              </Text>
              {VOID_CORRUPTIONS.map(corruption => {
                const active = character.voidCorruption.some(
                  item => item === `${corruption.id}. ${corruption.text}`,
                );
                return (
                  <Pressable
                    key={corruption.id}
                    accessibilityRole="button"
                    onPress={() =>
                      set({
                        voidCorruption: active
                          ? character.voidCorruption.filter(
                              item => item !== `${corruption.id}. ${corruption.text}`,
                            )
                          : [
                              ...character.voidCorruption,
                              `${corruption.id}. ${corruption.text}`,
                            ],
                      })
                    }
                    style={[
                      styles.mutationRow,
                      active && styles.mutationRowActive,
                    ]}
                  >
                    <Text style={styles.mutationRoll}>{corruption.id}</Text>
                    <View style={styles.flex}>
                      <Text
                        style={[
                          styles.mutationName,
                          active && { color: colors.yellow },
                        ]}
                      >
                        {corruption.text}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Button title="ЗАКРЫТЬ" onPress={() => setShowCorruptions(false)} />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function replaceWeapon(
  weapons: Character['weapons'],
  index: number,
  next: Character['weapons'][number],
): Character['weapons'] {
  const copy: Character['weapons'] = [weapons[0], weapons[1]];
  copy[index] = next;
  return copy;
}

function SelectFromTable({
  label,
  onOpen,
}: {
  label: string;
  onOpen: () => void;
}) {
  return (
    <View style={styles.selectRow}>
      <Chip
        label="ИЗ ТАБЛИЦЫ"
        accessibilityLabel={`Таблица: ${label}`}
        onPress={onOpen}
      />
    </View>
  );
}

function AddRow({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const submit = useCallback(() => {
    if (text.trim()) {
      onAdd(text);
      setText('');
    }
  }, [onAdd, text]);

  return (
    <View style={styles.addRow}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={[styles.itemInput, styles.flex]}
        returnKeyType="done"
      />
      <Button title="+" onPress={submit} style={styles.addButton} />
    </View>
  );
}

function HeadStat({
  label,
  value,
  tone = colors.text,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <View style={styles.headStat}>
      <Text style={[styles.headStatValue, { color: tone }]}>{value}</Text>
      <Text style={styles.headStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  missing: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  missingText: {
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  portraitFrame: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  portrait: { fontSize: 26 },
  headerInfo: { flex: 1 },
  name: { color: colors.text, fontSize: 20, fontWeight: '800' },
  headerSub: {
    color: colors.textDim,
    fontSize: font.tiny,
    letterSpacing: 1,
    marginTop: 2,
  },
  rollButton: {
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  rollButtonText: {
    color: colors.yellow,
    fontSize: font.body,
    fontWeight: '800',
  },
  headerButtons: {flexDirection: 'row', alignItems: 'center'},
  spacer: {height: spacing.sm},
  shareButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  shareButtonText: {color: colors.textDim, fontSize: font.body},
  headerStats: {
    flexDirection: 'row',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  headStat: { flex: 1, alignItems: 'center' },
  headStatValue: { fontSize: font.heading, fontWeight: '800' },
  headStatLabel: {
    color: colors.textFaint,
    fontSize: 9,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: { borderBottomColor: colors.yellow },
  tabText: {
    color: colors.textFaint,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  tabTextActive: { color: colors.yellow },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' },
  smallButton: { width: 56, marginRight: spacing.sm },
  wideButton: { flex: 1, marginRight: spacing.sm },
  subLabel: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  body: { color: colors.text, fontSize: font.body, fontWeight: '700' },
  dim: {
    color: colors.textDim,
    fontSize: font.small,
    lineHeight: 18,
    marginTop: 2,
  },
  abilityBox: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  abilityLabel: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontWeight: '800',
    letterSpacing: 1,
  },
  abilityValue: { color: colors.yellow, fontSize: 26, fontWeight: '900' },
  abilityControls: { flexDirection: 'row', marginTop: spacing.xs },
  abilityButton: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 3,
  },
  abilitySign: { color: colors.text, fontSize: 16, fontWeight: '800' },
  abilityName: {
    color: colors.textFaint,
    fontSize: 8,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  benefit: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  benefitActive: { borderColor: colors.yellow },
  benefitName: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  benefitNameActive: { color: colors.yellow },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listText: {
    color: colors.text,
    fontSize: font.small,
    lineHeight: 18,
    flex: 1,
  },
  listRemove: {
    color: colors.textFaint,
    fontSize: font.body,
    paddingHorizontal: spacing.sm,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  addButton: { width: 48, marginLeft: spacing.sm },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemBlock: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemWeight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  selectRow: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  itemWeightLabel: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginRight: spacing.md,
  },
  weightButton: {
    width: 30,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weightSign: { color: colors.text, fontSize: 16, fontWeight: '800' },
  itemWeightValue: {
    color: colors.yellow,
    fontSize: font.body,
    fontWeight: '800',
    width: 34,
    textAlign: 'center',
  },
  itemWeightHint: {
    color: colors.textDim,
    fontSize: font.tiny,
    marginLeft: spacing.xs,
  },
  smallItemsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  smallItemCell: {
    flexDirection: 'column',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    maxWidth: '100%',
  },
  smallItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallItemInput: {
    color: colors.text,
    fontSize: font.small,
    flexShrink: 1,
    minWidth: 60,
    paddingHorizontal: spacing.xs,
  },
  smallItemCount: {
    color: colors.yellow,
    fontSize: font.small,
    fontWeight: '800',
    width: 28,
    textAlign: 'center',
  },
  smallItemStepper: {
    width: 26,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 2,
  },
  smallItemCountSign: { color: colors.text, fontSize: 14, fontWeight: '800' },
  smallItemRemove: {
    color: colors.textFaint,
    fontSize: font.body,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
  },
  itemInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: font.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  conditionBox: { flexDirection: 'row', marginLeft: spacing.sm },
  conditionCell: {
    width: 12,
    height: 24,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: 1,
  },
  conditionCellOn: { backgroundColor: colors.green, borderColor: colors.green },
  conditionToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.xs,
  },
  conditionToggleOn: {
    borderColor: colors.green,
    backgroundColor: colors.surfaceAlt,
  },
  conditionToggleText: {
    color: colors.textFaint,
    fontSize: font.tiny,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  removeButton: { paddingHorizontal: spacing.sm },
  weaponBox: { marginBottom: spacing.lg },
  weaponHalf: { flex: 1, marginRight: spacing.sm },
  warning: {
    color: colors.red,
    fontSize: font.small,
    marginBottom: spacing.sm,
  },
  tall: { marginBottom: 0 },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalTitle: {
    color: colors.yellow,
    fontSize: font.heading,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  modalSub: {
    color: colors.textDim,
    fontSize: font.tiny,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  mutationRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  mutationRowActive: { borderColor: colors.yellow },
  mutationRoll: {
    color: colors.yellow,
    fontSize: font.small,
    fontWeight: '800',
    width: 24,
  },
  mutationName: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
});
