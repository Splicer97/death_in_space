import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  Chip,
  Divider,
  Screen,
  SearchInput,
  SectionTitle,
} from '../components/ui';
import { Track } from '../components/Track';
import { DERIVED_HINTS, RULES } from '../data/armor';
import { ORIGINS } from '../data/origins';
import { COSMIC_MUTATIONS, VOID_CORRUPTIONS } from '../data/mutations';
import { HUB_TABLES, NPC_STARSHIPS, NPC_STATIONS } from '../data/hub';
import { TABLES, type Table } from '../data/tables';
import { colors, font, radius, spacing } from '../theme';
import {
  HUB_CORE_FUNCTIONS,
  HUB_MAX_INTEGRITY,
  STARTING_HUBS,
  MAX_VOID_POINTS,
  LIFE_SUPPORT_STEPS,
} from '../types';
import { rollDie } from '../utils/dice';

type Category =
  | 'TABLES'
  | 'ORIGINS'
  | 'MUTATIONS'
  | 'CORRUPTION'
  | 'HUBS'
  | 'RULES';

const CATEGORIES: Category[] = [
  'TABLES',
  'ORIGINS',
  'MUTATIONS',
  'CORRUPTION',
  'HUBS',
  'RULES',
];

const CATEGORY_TITLES: Record<Category, string> = {
  TABLES: 'ТАБЛИЦЫ',
  ORIGINS: 'ПРОИСХОЖДЕНИЯ',
  MUTATIONS: 'МУТАЦИИ',
  CORRUPTION: 'ПОРЧА ПУСТОТЫ',
  HUBS: 'ХАБЫ',
  RULES: 'ПРАВИЛА',
};

function rollQuickDice(): { label: string; value: number }[] {
  return [
    { label: '1d20', value: rollDie(20) },
    { label: '1d8', value: rollDie(8) },
    { label: '1d6', value: rollDie(6) },
  ];
}

export default function TablesScreen() {
  const [category, setCategory] = useState<Category>('TABLES');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [dice, setDice] = useState(() => rollQuickDice());
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const matches = (text: string) => !needle || text.toLowerCase().includes(needle);
  const entriesOf = (table: Table) =>
    needle
      ? table.entries.filter(
          entry => matches(entry.text) || matches(entry.description ?? ''),
        )
      : table.entries;

  const filteredTables = TABLES.filter(
    table =>
      matches(table.title) ||
      table.entries.some(entry => matches(entry.text)),
  );
  const filteredHubTables = HUB_TABLES.filter(
    table =>
      matches(table.title) ||
      table.entries.some(entry => matches(entry.text) || matches(entry.description ?? '')),
  );
  const visibleOrigins = ORIGINS.filter(
    origin =>
      matches(origin.name) ||
      matches(origin.description) ||
      origin.benefits.some(benefit => matches(benefit.name) || matches(benefit.description)),
  );
  const visibleMutations = COSMIC_MUTATIONS.filter(
    mutation => matches(mutation.name) || matches(mutation.description),
  );
  const visibleCorruptions = VOID_CORRUPTIONS.filter(item => matches(item.text));
  const visibleNpcStarships = NPC_STARSHIPS.filter(
    item =>
      matches(item.type) ||
      matches(item.modules) ||
      matches(item.energy) ||
      matches(item.crew),
  );
  const visibleNpcStations = NPC_STATIONS.filter(
    item =>
      matches(item.type) ||
      matches(item.modules) ||
      matches(item.energy) ||
      matches(item.crew),
  );
  const nothingFound =
    needle.length > 0 &&
    filteredTables.length === 0 &&
    filteredHubTables.length === 0 &&
    visibleOrigins.length === 0 &&
    visibleMutations.length === 0 &&
    visibleCorruptions.length === 0 &&
    visibleNpcStarships.length === 0 &&
    visibleNpcStations.length === 0;

  const toggle = (key: string) =>
    setOpen(current => ({ ...current, [key]: !current[key] }));

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{CATEGORY_TITLES[category]}</Text>
        <View style={styles.chips}>
          {CATEGORIES.map(item => (
            <Chip
              key={item}
              label={CATEGORY_TITLES[item]}
              selected={category === item}
              onPress={() => setCategory(item)}
            />
          ))}
        </View>
        <View style={styles.searchWrap}>
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск по справочнику"
            accessibilityLabel="Поиск по справочнику"
          />
        </View>
        <View style={styles.diceRow}>
          {dice.map(item => (
            <View key={item.label} style={styles.dieBox}>
              <Text style={styles.dieValue}>{item.value}</Text>
              <Text style={styles.dieLabel}>{item.label}</Text>
            </View>
          ))}
          <View style={styles.diceButtonWrap}>
            <Text
              style={styles.diceButton}
              onPress={() => setDice(rollQuickDice())}
            >
              БРОСИТЬ
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {nothingFound ? (
          <Card>
            <Text style={styles.body}>
              {`По запросу «${query.trim()}» ничего не найдено. Попробуйте другое слово или очистить поиск.`}
            </Text>
          </Card>
        ) : null}
        {category === 'TABLES' ? (
          <>
            {filteredTables.map(table => (
              <Card key={table.key}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => toggle(table.key)}
                >
                  <View style={styles.tableHead}>
                    <Text style={styles.tableTitle}>{table.title}</Text>
                    <Text style={styles.tableDie}>{table.die}</Text>
                  </View>
                </Pressable>
                {open[table.key] || !!needle ? (
                  <View style={styles.entries}>
                    {entriesOf(table).map(entry => (
                      <View key={entry.roll} style={styles.entry}>
                        <Text style={styles.entryRoll}>{entry.roll}</Text>
                        <View style={styles.flex}>
                          <Text style={styles.entryText}>{entry.text}</Text>
                          {entry.description ? (
                            <Text style={styles.body}>
                              {entry.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.hint}>Нажмите, чтобы раскрыть</Text>
                )}
              </Card>
            ))}
          </>
        ) : null}

        {category === 'ORIGINS' ? (
          <>
            {visibleOrigins.map(origin => (
              <Card key={origin.key}>
                <Text style={styles.tableTitle}>{origin.name}</Text>
                <Text style={styles.body}>{origin.description}</Text>
                {origin.benefits.map(benefit => (
                  <View key={benefit.name} style={styles.benefit}>
                    <Text style={styles.benefitName}>{benefit.name}</Text>
                    <Text style={styles.body}>{benefit.description}</Text>
                  </View>
                ))}
              </Card>
            ))}
          </>
        ) : null}

        {category === 'MUTATIONS' ? (
          <Card>
            <SectionTitle
              title="КОСМИЧЕСКИЕ МУТАЦИИ"
              subtitle="1d20 · активация тратит очки пустоты"
            />
            {visibleMutations.map(mutation => (
              <View key={mutation.id} style={styles.entry}>
                <Text style={styles.entryRoll}>{mutation.id}</Text>
                <View style={styles.flex}>
                  <Text style={styles.benefitName}>{mutation.name}</Text>
                  <Text style={styles.body}>{mutation.description}</Text>
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        {category === 'CORRUPTION' ? (
          <Card>
            <SectionTitle
              title="ПОРЧА ПУСТОТЫ"
              subtitle="1d20 · бросок, если потраченная на преимущество пустота не сработала"
            />
            {visibleCorruptions.map(corruption => (
              <View key={corruption.id} style={styles.entry}>
                <Text style={styles.entryRoll}>{corruption.id}</Text>
                <Text style={styles.body}>{corruption.text}</Text>
              </View>
            ))}
            <Divider />
            <Text style={styles.subLabel}>ОЧКИ ПУСТОТЫ</Text>
            <Track
              value={4}
              max={MAX_VOID_POINTS}
              color={colors.violet}
              disabled
            />
            <Text style={styles.subLabel}>ЖИЗНЕОБЕСПЕЧЕНИЕ</Text>
            <Track
              value={LIFE_SUPPORT_STEPS}
              max={LIFE_SUPPORT_STEPS}
              color={colors.blue}
              disabled
            />
          </Card>
        ) : null}

        {category === 'HUBS' ? (
          <>
            <Card>
              <SectionTitle
                title="СТАРТОВЫЕ ХАРАКТЕРИСТИКИ"
                subtitle="значения, с которыми хаб входит в игру"
              />
              <Text style={styles.body}>
                {`Звездолёт: УЗ ${STARTING_HUBS.starship.defenseRating}, состояние ${STARTING_HUBS.starship.conditionMax}, топливо ${STARTING_HUBS.starship.fuelMax}. Станция: УЗ ${STARTING_HUBS.station.defenseRating}, состояние ${STARTING_HUBS.station.conditionMax}, топливо ${STARTING_HUBS.station.fuelMax}. Целостность корпуса — ${HUB_MAX_INTEGRITY}%. Модули в начале игры не установлены: их нужно найти, украсть или получить по контракту.`}
              </Text>
            </Card>
            {filteredHubTables.map(table => (
              <Card key={table.key}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => toggle(table.key)}
                >
                  <View style={styles.tableHead}>
                    <Text style={styles.tableTitle}>{table.title}</Text>
                    <Text style={styles.tableDie}>{table.die}</Text>
                  </View>
                </Pressable>
                {open[table.key] || !!needle ? (
                  <View style={styles.entries}>
                    {entriesOf(table).map(entry => (
                      <View key={entry.roll} style={styles.entry}>
                        <Text style={styles.entryRoll}>{entry.roll}</Text>
                        <View style={styles.flex}>
                          <Text style={styles.entryText}>{entry.text}</Text>
                          {entry.description ? (
                            <Text style={styles.body}>
                              {entry.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.hint}>Нажмите, чтобы раскрыть</Text>
                )}
              </Card>
            ))}
            <Card>
              <SectionTitle
                title="ОСНОВНЫЕ ФУНКЦИИ ХАБА"
                subtitle="включены в любой хаб, выходной мощности не требуют"
              />
              {HUB_CORE_FUNCTIONS.map(item => (
                <View key={item.name} style={styles.benefit}>
                  <Text style={styles.benefitName}>{item.name}</Text>
                  <Text style={styles.body}>{item.description}</Text>
                </View>
              ))}
            </Card>
            <Card>
              <SectionTitle
                title="НЕИГРОВЫЕ ЗВЕЗДОЛЁТЫ"
                subtitle="готовые корабли для мастера"
              />
              {visibleNpcStarships.map(item => (
                <View key={item.roll} style={styles.entry}>
                  <Text style={styles.entryRoll}>{item.roll}</Text>
                  <View style={styles.flex}>
                    <Text style={styles.benefitName}>{item.type}</Text>
                    <Text style={styles.body}>
                      {`Экипаж ${item.crew} · ${item.energy}`}
                    </Text>
                    <Text style={styles.body}>{item.modules}</Text>
                  </View>
                </View>
              ))}
            </Card>
            <Card>
              <SectionTitle
                title="НЕИГРОВЫЕ СТАНЦИИ"
                subtitle="готовые станции для мастера"
              />
              {visibleNpcStations.map(item => (
                <View key={item.roll} style={styles.entry}>
                  <Text style={styles.entryRoll}>{item.roll}</Text>
                  <View style={styles.flex}>
                    <Text style={styles.benefitName}>{item.type}</Text>
                    <Text style={styles.body}>
                      {`Экипаж ${item.crew} · ${item.energy}`}
                    </Text>
                    <Text style={styles.body}>{item.modules}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {category === 'RULES' ? (
          <>
            <Card>
              <SectionTitle title="ФОРМУЛЫ" />
              {DERIVED_HINTS.map(hint => (
                <View key={hint.label} style={styles.formulaRow}>
                  <Text style={styles.formulaLabel}>{hint.label}</Text>
                  <Text style={styles.formulaValue}>{hint.formula}</Text>
                </View>
              ))}
            </Card>
            {RULES.map(rule => (
              <Card key={rule.title}>
                <SectionTitle title={rule.title} />
                {rule.lines.map(line => (
                  <Text key={line} style={styles.bullet}>
                    • {line}
                  </Text>
                ))}
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.yellow,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  diceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  dieBox: {
    width: 62,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  dieValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  dieLabel: { color: colors.textFaint, fontSize: font.tiny, letterSpacing: 1 },
  diceButtonWrap: { flex: 1, alignItems: 'flex-end' },
  diceButton: {
    color: colors.yellow,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 1.5,
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  tableHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableTitle: {
    color: colors.text,
    fontSize: font.heading,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  tableDie: { color: colors.yellow, fontSize: font.small, fontWeight: '800' },
  entries: { marginTop: spacing.md },
  entry: { flexDirection: 'row', marginBottom: spacing.sm },
  entryRoll: {
    color: colors.yellow,
    fontSize: font.small,
    fontWeight: '800',
    width: 26,
  },
  entryText: {
    color: colors.text,
    fontSize: font.small,
    lineHeight: 19,
    flex: 1,
  },
  hint: { color: colors.textFaint, fontSize: font.tiny, marginTop: spacing.xs },
  body: {
    color: colors.textDim,
    fontSize: font.small,
    lineHeight: 19,
    marginTop: 2,
  },
  benefit: {
    borderLeftWidth: 2,
    borderLeftColor: colors.yellow,
    paddingLeft: spacing.md,
    marginTop: spacing.md,
  },
  benefitName: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subLabel: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  formulaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  formulaLabel: { color: colors.textDim, fontSize: font.small, flex: 1 },
  formulaValue: {
    color: colors.yellow,
    fontSize: font.small,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  searchWrap: {paddingHorizontal: spacing.lg},
  bullet: {
    color: colors.textDim,
    fontSize: font.small,
    lineHeight: 19,
    marginBottom: spacing.xs,
  },
});
