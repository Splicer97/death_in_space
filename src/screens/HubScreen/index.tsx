import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { TablePicker } from '../../components/TablePicker';
import {
  Button,
  Card,
  Divider,
  Empty,
  Field,
  NumberStepper,
  Screen,
  SearchInput,
  SectionTitle,
  Snackbar,
  Tag,
} from '../../components/ui';
import {
  ENERGY_SYSTEMS,
  HULLS,
  HUB_MODULES,
  HUB_MODULE_GROUPS,
  HUB_QUIRKS,
  hubBackstories,
} from '../../data/hub';
import { newId, useCharacterStore } from '../../store/characterStore';
import { colors } from '../../theme';
import {
  HUB_CORE_FUNCTIONS,
  HUB_MAX_INTEGRITY,
  STARTING_HUBS,
  energyOverdrawn,
  energyUsed,
  type Hub,
  type HubDraft,
  type HubType,
} from '../../types';
import type { TableEntry } from '../../data/tables';
import { rollDie } from '../../utils/dice';
import { hubToText } from '../../utils/sheetText';
import type { RootStackParamList } from '../../navigation/types';
import { styles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Hub'>;

const STEPS = [
  'ТИП И ХАРАКТЕРИСТИКИ',
  'ИСТОЧНИК ЭНЕРГИИ',
  'ПРЕДЫСТОРИЯ ХАБА',
  'ИЗЮМИНКА ХАБА',
];

function backstoryEntries(type: HubType): TableEntry[] {
  return hubBackstories(type).map((text, index) => ({
    roll: String(index + 1),
    text,
  }));
}

function quirkEntries(): TableEntry[] {
  return HUB_QUIRKS.map((text, index) => ({ roll: String(index + 1), text }));
}

function energyEntries(type: HubType): TableEntry[] {
  return ENERGY_SYSTEMS[type].map((item, index) => ({
    roll: String(index + 1),
    text: item.name,
    description: `ВМ ${item.output} · ${item.accessibility}${
      item.requirement ? ` · ${item.requirement}` : ''
    }`,
  }));
}

function hullEntries(): TableEntry[] {
  return HULLS.map((item, index) => ({
    roll: String(index + 1),
    text: item.name,
    description: `Состояние ${item.condition} · УЗ ${item.defenseRating} · топливо ${item.fuel} · ${item.accessibility}`,
  }));
}

export default function HubScreen({ navigation }: Props) {
  const hub = useCharacterStore(state => state.hub);
  const createHub = useCharacterStore(state => state.createHub);
  const updateHub = useCharacterStore(state => state.updateHub);
  const removeHub = useCharacterStore(state => state.removeHub);
  const undoHub = useCharacterStore(state => state.undoHub);
  const undoRemove = useCharacterStore(state => state.undoRemove);
  const clearUndo = useCharacterStore(state => state.clearUndo);

  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<HubDraft>({
    ...STARTING_HUBS.starship,
  });
  const [picker, setPicker] = useState<{
    title: string;
    die: string;
    entries: TableEntry[];
    value: string;
    onSelect: (text: string) => void;
  } | null>(null);

  const patch = useCallback((value: Partial<HubDraft>) => {
    setDraft(current => ({ ...current, ...value }));
  }, []);

  const applyType = useCallback((type: HubType) => {
    setDraft(current => {
      const base = STARTING_HUBS[type];
      // корпус и стартовые характеристики сохраняем, если хаб уже был в игре
      return {
        ...base,
        hull: current.hull,
        defenseRating: current.defenseRating,
        conditionMax: current.conditionMax,
        fuelMax: current.fuelMax,
        energyOutput: base.energyOutput,
        fuel: base.fuel,
        modules: [],
      };
    });
  }, []);

  const requestType = useCallback(
    (type: HubType) => {
      if (type === draft.type) {
        return;
      }
      const from = draft.type === 'starship' ? 'звездолёта' : 'станции';
      const to = type === 'starship' ? 'звездолёта' : 'станции';
      const hasModules = draft.modules.length > 0;
      const hasCustomHull = draft.hull !== STARTING_HUBS[draft.type].hull;

      if (!hasModules && !hasCustomHull) {
        applyType(type);
        return;
      }

      Alert.alert(
        `Сменить тип на ${to}?`,
        `Уровень защиты, состояние, запас топлива и выходная мощность будут взяты от ${from}, а установленные модули сбросятся. Название хаба сохранится.`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Сменить',
            style: 'destructive',
            onPress: () => applyType(type),
          },
        ],
      );
    },
    [applyType, draft],
  );

  useEffect(
    () =>
      navigation.addListener('beforeRemove', event => {
        if (step > 0) {
          event.preventDefault();
          setStep(current => current - 1);
          return;
        }
        if (creating && !hub) {
          event.preventDefault();
          setCreating(false);
        }
      }),
    [creating, hub, navigation, step],
  );

  const finish = useCallback(() => {
    createHub(draft);
    setCreating(false);
  }, [createHub, draft]);

  const reset = useCallback(() => {
    Alert.alert(
      'Удалить хаб?',
      'Лист хаба и установленные модули будут стёрты. Персонажи останутся.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            removeHub();
            setDraft({ ...STARTING_HUBS.starship });
            setStep(0);
            setCreating(true);
          },
        },
      ],
    );
  }, [removeHub]);

  const restoreHub = useCallback(() => {
    undoRemove();
    setCreating(false);
  }, [undoRemove]);

  if (!hub && !creating) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <Empty
              glyph="⟁"
              text="Хаба пока нет. Это дом команды: звездолёт или станция с модулями, топливом и историей."
            />
            <Button
              title="СОЗДАТЬ ХАБ"
              onPress={() => {
                setDraft({ ...STARTING_HUBS.starship });
                setStep(0);
                setCreating(true);
              }}
            />
            <View style={styles.spacer} />
            <Text style={styles.help}>
              Подсказка: у хаба есть выходная мощность, за счёт которой держатся
              модули. Без модулей команда просто живёт и перелетает.
            </Text>
          </Card>
        </ScrollView>
        <Snackbar
          visible={undoHub !== null}
          message="Хаб удалён"
          actionLabel="ОТМЕНИТЬ"
          onAction={restoreHub}
          onDismiss={() => clearUndo()}
        />
      </Screen>
    );
  }

  if (creating || !hub) {
    return (
      <Screen>
        <WizardHeader step={step} />
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
                  title="ТИП ХАБА И ОСНОВНЫЕ ХАРАКТЕРИСТИКИ"
                  subtitle="Звездолёт — для исследований, станция — для интриг"
                />
                <View style={styles.typeRow}>
                  {(['starship', 'station'] as const).map(type => (
                    <Pressable
                      key={type}
                      accessibilityRole="button"
                      accessibilityState={{ selected: draft.type === type }}
                      onPress={() => requestType(type)}
                      style={[
                        styles.typeCard,
                        draft.type === type && styles.typeCardActive,
                      ]}
                    >
                      <Text style={styles.typeIcon}>
                        {type === 'starship' ? '🛰' : '🛸'}
                      </Text>
                      <Text style={styles.typeName}>
                        {type === 'starship' ? 'ЗВЕЗДОЛЁТ' : 'СТАНЦИЯ'}
                      </Text>
                      <Text style={styles.typeMeta}>
                        УЗ {STARTING_HUBS[type].defenseRating} · состояние{' '}
                        {STARTING_HUBS[type].conditionMax} · топливо{' '}
                        {STARTING_HUBS[type].fuelMax}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Card>

              <Card>
                <SectionTitle
                  title="КОРПУС"
                  subtitle="Можно заменить стартовый корпус на любой"
                />
                <Field
                  label="НАЗВАНИЕ КОРПУСА"
                  value={draft.hull}
                  onChangeText={hull => patch({ hull })}
                  placeholder="Звездолёт или станция"
                />
                <View style={styles.presetRow}>
                  <Button
                    title="ИЗ ТАБЛИЦЫ"
                    variant="ghost"
                    onPress={() =>
                      setPicker({
                        title: 'КОРПУСА',
                        die: '20 корпусов',
                        entries: hullEntries(),
                        value: draft.hull,
                        onSelect: text => {
                          const found = HULLS.find(item => item.name === text);
                          if (!found) {
                            patch({ hull: text });
                            return;
                          }
                          patch({
                            hull: found.name,
                            conditionMax: found.condition,
                            condition: found.condition,
                            defenseRating: found.defenseRating,
                            fuelMax: Number.isNaN(Number(found.fuel))
                              ? draft.fuelMax
                              : Number(found.fuel),
                            fuel: Number.isNaN(Number(found.fuel))
                              ? draft.fuel
                              : Number(found.fuel),
                          });
                        },
                      })
                    }
                    style={styles.presetButton}
                  />
                  <Button
                    title="СБРОСИТЬ"
                    variant="ghost"
                    onPress={() => patch(STARTING_HUBS[draft.type])}
                    style={styles.presetButton}
                  />
                </View>
                <Divider />
                <NumberStepper
                  label="УРОВЕНЬ ЗАЩИТЫ"
                  value={draft.defenseRating}
                  onChange={value => patch({ defenseRating: value })}
                  min={0}
                  max={40}
                />
                <NumberStepper
                  label="МАКС. СОСТОЯНИЕ"
                  value={draft.conditionMax}
                  onChange={value =>
                    patch({
                      conditionMax: value,
                      condition: Math.min(draft.condition, value),
                    })
                  }
                  min={1}
                  max={20}
                />
                <NumberStepper
                  label="ЗАПАС ТОПЛИВА"
                  value={draft.fuelMax}
                  onChange={value =>
                    patch({ fuelMax: value, fuel: Math.min(draft.fuel, value) })
                  }
                  min={0}
                  max={40}
                />
                <Text style={styles.help}>
                  Целостность корпуса отслеживает повреждения: изначально{' '}
                  {HUB_MAX_INTEGRITY}%. При нулевом запасе топлива
                  жизнеобеспечение работает, остальные функции отключаются.
                </Text>
              </Card>
            </>
          ) : null}

          {step === 1 ? (
            <Card>
              <SectionTitle
                index="ШАГ 2"
                title="ИСТОЧНИК ЭНЕРГИИ И ВЫХОДНАЯ МОЩНОСТЬ"
                subtitle="Выходная мощность ограничивает количество модулей"
              />
              <Field
                label="ИСТОЧНИК"
                value={draft.energySource}
                onChangeText={energySource => patch({ energySource })}
                placeholder="Химический двигатель"
              />
              <View style={styles.presetRow}>
                <Button
                  title="ИЗ ТАБЛИЦЫ"
                  variant="ghost"
                  onPress={() =>
                    setPicker({
                      title: 'ЭНЕРГОСИСТЕМЫ',
                      die: draft.type === 'starship' ? 'звездолёт' : 'станция',
                      entries: energyEntries(draft.type),
                      value: draft.energySource,
                      onSelect: text => {
                        const found = ENERGY_SYSTEMS[draft.type].find(
                          item => item.name === text,
                        );
                        patch({
                          energySource: text,
                          energyOutput: found?.output ?? draft.energyOutput,
                        });
                      },
                    })
                  }
                  style={styles.presetButton}
                />
              </View>
              <Divider />
              <NumberStepper
                label="ВЫХОДНАЯ МОЩНОСТЬ (ВМ)"
                value={draft.energyOutput}
                onChange={value => patch({ energyOutput: value })}
                min={0}
                max={60}
                big
              />
              <Text style={styles.help}>
                Сумма затрат энергии всех модулей всегда должна быть меньше или
                равна выходной мощности хаба. Основные функции выходной мощности
                не требуют.
              </Text>
            </Card>
          ) : null}

          {step === 2 ? (
            <Card>
              <SectionTitle
                index="ШАГ 3"
                title="ПРЕДЫСТОРИЯ ХАБА"
                subtitle={
                  draft.type === 'starship'
                    ? 'У корабля было иное назначение'
                    : 'У станции было другое назначение'
                }
              />
              <Field
                label="ПРЕДЫСТОРИЯ"
                value={draft.backstory}
                onChangeText={backstory => patch({ backstory })}
                placeholder="Придумайте или выберите из таблицы"
                multiline
              />
              <View style={styles.presetRow}>
                <Button
                  title="ИЗ ТАБЛИЦЫ"
                  variant="ghost"
                  onPress={() =>
                    setPicker({
                      title: 'ПРЕДЫСТОРИЯ',
                      die: 'd20',
                      entries: backstoryEntries(draft.type),
                      value: draft.backstory,
                      onSelect: text => patch({ backstory: text }),
                    })
                  }
                  style={styles.presetButton}
                />
                <Button
                  title="БРОСИТЬ d20"
                  onPress={() =>
                    patch({
                      backstory: backstoryEntries(draft.type)[rollDie(20) - 1]
                        .text,
                    })
                  }
                  style={styles.presetButton}
                />
              </View>
            </Card>
          ) : null}

          {step === 3 ? (
            <Card>
              <SectionTitle
                index="ШАГ 4"
                title="ИЗЮМИНКА ХАБА"
                subtitle="Что-то странное или раздражающее, но притягательное"
              />
              <Field
                label="ПРИЧУДА"
                value={draft.quirk}
                onChangeText={quirk => patch({ quirk })}
                placeholder="Придумайте или выберите из таблицы"
                multiline
              />
              <View style={styles.presetRow}>
                <Button
                  title="ИЗ ТАБЛИЦЫ"
                  variant="ghost"
                  onPress={() =>
                    setPicker({
                      title: 'ПРИЧУДА',
                      die: 'd20',
                      entries: quirkEntries(),
                      value: draft.quirk,
                      onSelect: text => patch({ quirk: text }),
                    })
                  }
                  style={styles.presetButton}
                />
                <Button
                  title="БРОСИТЬ d20"
                  onPress={() =>
                    patch({ quirk: quirkEntries()[rollDie(20) - 1].text })
                  }
                  style={styles.presetButton}
                />
              </View>
              <Text style={styles.footerNote}>Это был последний шаг.</Text>
            </Card>
          ) : null}
        </KeyboardAwareScrollView>

        <View style={styles.footer}>
          <Button
            title="НАЗАД"
            variant="ghost"
            onPress={() =>
              step === 0
                ? hub
                  ? navigation.goBack()
                  : setCreating(false)
                : setStep(step - 1)
            }
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
              title="СОЗДАТЬ ХАБ"
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

        <Snackbar
          visible={undoHub !== null}
          message="Хаб удалён"
          actionLabel="ОТМЕНИТЬ"
          onAction={restoreHub}
          onDismiss={() => clearUndo()}
        />
      </Screen>
    );
  }

  return (
    <HubSheet
      hub={hub}
      update={updateHub}
      onEdit={() => {
        setDraft({
          type: hub.type,
          hull: hub.hull,
          defenseRating: hub.defenseRating,
          conditionMax: hub.conditionMax,
          fuelMax: hub.fuelMax,
          integrity: hub.integrity,
          condition: hub.condition,
          fuel: hub.fuel,
          energySource: hub.energySource,
          energyOutput: hub.energyOutput,
          backstory: hub.backstory,
          quirk: hub.quirk,
          modules: hub.modules,
          notes: hub.notes,
        });
        setStep(0);
        setCreating(true);
      }}
      onReset={reset}
      onShare={() => {
        Share.share({
          title: hub.hull || 'Лист хаба',
          message: hubToText(hub),
        }).catch(() => undefined);
      }}
    />
  );
}

function WizardHeader({ step }: { step: number }) {
  return (
    <View style={styles.stepBar}>
      {STEPS.map((title, index) => (
        <View
          key={title}
          style={[styles.stepDot, index <= step && styles.stepDotActive]}
        />
      ))}
    </View>
  );
}

function HubSheet({
  hub,
  update,
  onEdit,
  onReset,
  onShare,
}: {
  hub: Hub;
  update: (patch: Partial<Hub>) => void;
  onEdit: () => void;
  onReset: () => void;
  onShare: () => void;
}) {
  const [moduleTab, setModuleTab] =
    useState<keyof typeof HUB_MODULES>('general');
  const [query, setQuery] = useState('');
  const [picker, setPicker] = useState<{
    title: string;
    die: string;
    entries: TableEntry[];
    value: string;
    onSelect: (text: string) => void;
  } | null>(null);

  const used = energyUsed(hub.modules);
  const overdrawn = energyOverdrawn(hub.modules, hub.energyOutput);
  const modules = HUB_MODULES[moduleTab];
  const group = HUB_MODULE_GROUPS.find(item => item.key === moduleTab);

  const addModule = useCallback(
    (name: string, energy: number) => {
      update({
        modules: [...hub.modules, { id: newId(), name, energy }],
      });
    },
    [hub.modules, update],
  );

  const removeModule = useCallback(
    (id: string) => {
      update({ modules: hub.modules.filter(item => item.id !== id) });
    },
    [hub.modules, update],
  );

  const installed = useMemo(
    () => new Set(hub.modules.map(m => m.name)),
    [hub.modules],
  );

  const visibleModules = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return modules;
    }
    return modules.filter(
      item =>
        item.name.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle),
    );
  }, [modules, query]);

  return (
    <Screen>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={12}
      >
        <Card>
          <View style={styles.hubHead}>
            <View style={styles.hubIcon}>
              <Text style={styles.hubIconText}>
                {hub.type === 'starship' ? '🛰' : '🛸'}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.hubName}>{hub.hull || 'ХАБ'}</Text>
              <Text style={styles.hubMeta}>
                {hub.type === 'starship' ? 'ЗВЕЗДОЛЁТ' : 'СТАНЦИЯ'} ·{' '}
                {hub.energySource}
              </Text>
            </View>
            <View style={styles.headActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Поделиться листом хаба"
                onPress={onShare}
                style={styles.headIconButton}
              >
                <Text style={styles.headIconText}>⤴</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Пересоздать хаб"
                onPress={onEdit}
                style={styles.headButton}
              >
                <Text style={styles.headButtonText}>ИЗМЕНИТЬ</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.statGrid}>
            <HubStat label="УЗ" value={String(hub.defenseRating)} />
            <HubStat
              label="СОСТОЯНИЕ"
              value={`${hub.condition}/${hub.conditionMax}`}
              tone={hub.condition <= 1 ? colors.red : colors.text}
            />
            <HubStat
              label="ТОПЛИВО"
              value={`${hub.fuel}/${hub.fuelMax}`}
              tone={hub.fuel === 0 ? colors.red : colors.text}
            />
            <HubStat label="ЦЕЛОСТНОСТЬ" value={`${hub.integrity}%`} />
          </View>
        </Card>

        <Card>
          <SectionTitle
            index="1"
            title="ВЫХОДНАЯ МОЩНОСТЬ И МОДУЛИ"
            subtitle={`${used} из ${hub.energyOutput} ВМ`}
          />
          <View
            style={[
              styles.powerBar,
              { borderColor: overdrawn ? colors.red : colors.border },
            ]}
          >
            <View
              style={[
                styles.powerFill,
                {
                  width: `${Math.min(
                    100,
                    hub.energyOutput === 0
                      ? 100
                      : (used / hub.energyOutput) * 100,
                  )}%`,
                  backgroundColor: overdrawn ? colors.red : colors.yellow,
                },
              ]}
            />
          </View>
          {overdrawn ? (
            <Text style={styles.warning}>
              Сумма затрат энергии модулей ({used}) превышает выходную мощность
              хаба ({hub.energyOutput}). Либо уберите модуль, либо
              модернизируйте источник энергии.
            </Text>
          ) : null}
          <View style={styles.presetRow}>
            <View style={styles.half}>
              <NumberStepper
                label="ВЫХОДНАЯ МОЩНОСТЬ"
                value={hub.energyOutput}
                onChange={energyOutput => update({ energyOutput })}
                min={0}
                max={60}
              />
            </View>
          </View>

          <Divider />
          <Text style={styles.subLabel}>УСТАНОВЛЕННЫЕ МОДУЛИ</Text>
          {hub.modules.length === 0 ? (
            <Text style={styles.help}>
              В начале хаб вступает в игру без модулей. Команда должна найти,
              украсть или получить их по контракту.
            </Text>
          ) : (
            hub.modules.map(item => (
              <View key={item.id} style={styles.moduleRow}>
                <View style={styles.flex}>
                  <Text style={styles.moduleName}>{item.name}</Text>
                </View>
                <Tag label={`${item.energy} ВМ`} color={colors.yellow} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Убрать модуль ${item.name}`}
                  onPress={() => removeModule(item.id)}
                  style={styles.moduleRemove}
                >
                  <Text style={styles.moduleRemoveText}>✕</Text>
                </Pressable>
              </View>
            ))
          )}

          <Divider />
          <Text style={styles.subLabel}>ДОСТУПНЫЕ МОДУЛИ</Text>
          <View style={styles.moduleTabs}>
            {HUB_MODULE_GROUPS.map(item => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                accessibilityState={{ selected: moduleTab === item.key }}
                onPress={() => setModuleTab(item.key)}
                style={[
                  styles.moduleTab,
                  moduleTab === item.key && styles.moduleTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.moduleTabText,
                    moduleTab === item.key && styles.moduleTabTextActive,
                  ]}
                >
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </View>
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск модуля"
            accessibilityLabel="Поиск модуля"
          />
          <Text style={styles.subLabel}>{group?.subtitle}</Text>
          {visibleModules.length === 0 ? (
            <Text style={styles.help}>
              Ничего не найдено. Попробуйте другое слово или сбросьте поиск.
            </Text>
          ) : null}
          {visibleModules.map(item => {
            const isInstalled = installed.has(item.name);
            const fits = used + item.energy <= hub.energyOutput;
            return (
              <Pressable
                key={item.name}
                accessibilityRole="button"
                accessibilityLabel={`Добавить модуль ${item.name}`}
                onPress={() => addModule(item.name, item.energy)}
                style={[styles.moduleCard, !fits && styles.moduleCardWarn]}
              >
                <View style={styles.moduleCardHead}>
                  <Text style={styles.moduleCardName}>{item.name}</Text>
                  <Tag
                    label={`${item.energy} ВМ`}
                    color={fits ? colors.violet : colors.red}
                  />
                </View>
                <Text style={styles.moduleCardDesc}>{item.description}</Text>
                <Text
                  style={[
                    styles.moduleCardHint,
                    isInstalled && { color: colors.green },
                  ]}
                >
                  {isInstalled
                    ? 'уже установлен — можно поставить ещё'
                    : fits
                    ? 'Нажмите, чтобы установить'
                    : 'Не помещается в выходную мощность'}
                </Text>
              </Pressable>
            );
          })}
        </Card>

        <Card>
          <SectionTitle
            index="2"
            title="ПРЕДЫСТОРИЯ И ПРИЧУДА"
            subtitle="Бросок или выбор из таблицы"
          />
          <View style={styles.presetRow}>
            <Button
              title="ПРЕДЫСТОРИЯ"
              variant="ghost"
              onPress={() =>
                setPicker({
                  title: 'ПРЕДЫСТОРИЯ',
                  die: 'd20',
                  entries: backstoryEntries(hub.type),
                  value: hub.backstory,
                  onSelect: text => update({ backstory: text }),
                })
              }
              style={styles.presetButton}
            />
            <Button
              title="ПРИЧУДА"
              variant="ghost"
              onPress={() =>
                setPicker({
                  title: 'ПРИЧУДА',
                  die: 'd20',
                  entries: quirkEntries(),
                  value: hub.quirk,
                  onSelect: text => update({ quirk: text }),
                })
              }
              style={styles.presetButton}
            />
          </View>
          <Text style={styles.storyLabel}>ПРЕДЫСТОРИЯ</Text>
          <Text style={styles.storyText}>{hub.backstory || '—'}</Text>
          <Text style={styles.storyLabel}>ИЗЮМИНКА</Text>
          <Text style={styles.storyText}>{hub.quirk || '—'}</Text>
        </Card>

        <Card>
          <SectionTitle
            index="3"
            title="ОСНОВНЫЕ ФУНКЦИИ"
            subtitle="включены в любой хаб, выходной мощности не требуют"
          />
          {HUB_CORE_FUNCTIONS.map(item => (
            <View key={item.name} style={styles.coreRow}>
              <Text style={styles.coreName}>{item.name}</Text>
              <Text style={styles.coreDesc}>{item.description}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <SectionTitle index="4" title="СОСТОЯНИЕ ХАБА" />
          <NumberStepper
            label="СОСТОЯНИЕ"
            value={hub.condition}
            onChange={value => update({ condition: value })}
            min={0}
            max={hub.conditionMax}
            big
          />
          <NumberStepper
            label="ЦЕЛОСТНОСТЬ КОРПУСА"
            value={hub.integrity}
            onChange={value =>
              update({
                integrity: Math.max(0, Math.min(HUB_MAX_INTEGRITY, value)),
              })
            }
            min={0}
            max={HUB_MAX_INTEGRITY}
            big
          />
          <NumberStepper
            label="ТОПЛИВО"
            value={hub.fuel}
            onChange={value =>
              update({ fuel: Math.max(0, Math.min(hub.fuelMax, value)) })
            }
            min={0}
            max={hub.fuelMax}
            big
          />
          <Text style={styles.help}>
            Ремонт 1 единицы состояния предмета стоит 30 гало, ремонт 1 единицы
            состояния транспорта — 300 гало. Время ремонта 1d20 часов.
          </Text>
        </Card>

        <Card>
          <SectionTitle index="5" title="ЗАМЕТКИ" subtitle="Журнал хаба" />
          <Field
            label="ЗАМЕТКИ"
            value={hub.notes}
            onChangeText={notes => update({ notes })}
            placeholder="Контракты, события, долги перед мастером…"
            multiline
          />
          <Button title="УДАЛИТЬ ХАБ" variant="ghost" onPress={onReset} />
        </Card>
      </KeyboardAwareScrollView>

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

function HubStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, tone ? { color: tone } : null]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
