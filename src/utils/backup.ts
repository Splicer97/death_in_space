import { emptyCharacter, newId } from '../store/characterStore';
import {
  STARTING_HUBS,
  type Armor,
  type Character,
  type Hub,
  type HubType,
  type InstalledModule,
  type Item,
  type Weapon,
} from '../types';

export const BACKUP_APP = 'death-in-space';
export const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: number;
  characters: Character[];
  activeId: string | null;
  hub: Hub | null;
}

export interface BackupSummary {
  characters: number;
  hub: string | null;
}

export type ParseResult =
  | { ok: true; backup: Backup; summary: BackupSummary }
  | { ok: false; error: string };

type Raw = Record<string, unknown>;

function isRaw(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function count(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function recordList(value: unknown): Raw[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isRaw);
}

function sanitizeItem(raw: Raw): Item {
  return {
    id: text(raw.id) || newId(),
    name: text(raw.name),
    condition: count(raw.condition),
  };
}

function sanitizeWeapon(raw: Raw | undefined, fallback: Weapon): Weapon {
  if (!raw) {
    return { ...fallback };
  }
  return {
    name: text(raw.name),
    damage: text(raw.damage),
    uses: count(raw.uses),
    condition: count(raw.condition),
  };
}

function sanitizeArmor(raw: unknown): Armor | null {
  if (!isRaw(raw)) {
    return null;
  }
  const slots = raw.slots;
  return {
    type: text(raw.type),
    protectsAgainst: text(raw.protectsAgainst),
    drBonus: count(raw.drBonus),
    ...(typeof slots === 'number' && Number.isFinite(slots) ? {slots} : {}),
  };
}

function sanitizeCharacter(raw: Raw): Character {
  const base = emptyCharacter();
  const weapons = recordList(raw.weapons);
  return {
    ...base,
    id: text(raw.id) || newId(),
    createdAt: count(raw.createdAt, Date.now()),
    updatedAt: count(raw.updatedAt, Date.now()),
    playerName: text(raw.playerName),
    name: text(raw.name),
    nickname: text(raw.nickname),
    origin: (raw.origin ?? null) as Character['origin'],
    originBenefits: textList(raw.originBenefits),
    xp: count(raw.xp),
    background: text(raw.background),
    pastAllegiance: text(raw.pastAllegiance),
    trait: text(raw.trait),
    drive: text(raw.drive),
    looks: text(raw.looks),
    portrait: text(raw.portrait, base.portrait),
    abilities: {
      body: count(raw.abilities && isRaw(raw.abilities) ? raw.abilities.body : 0),
      dexterity: count(
        raw.abilities && isRaw(raw.abilities) ? raw.abilities.dexterity : 0,
      ),
      savvy: count(
        raw.abilities && isRaw(raw.abilities) ? raw.abilities.savvy : 0,
      ),
      tech: count(raw.abilities && isRaw(raw.abilities) ? raw.abilities.tech : 0),
    },
    hp: count(raw.hp),
    hpMax: count(raw.hpMax),
    voidPoints: count(raw.voidPoints),
    mutations: textList(raw.mutations),
    voidCorruption: textList(raw.voidCorruption),
    lifeSupport: count(raw.lifeSupport, base.lifeSupport),
    items: recordList(raw.items).map(sanitizeItem),
    smallItems: text(raw.smallItems),
    weapons: [
      sanitizeWeapon(weapons[0], base.weapons[0]),
      sanitizeWeapon(weapons[1], base.weapons[1]),
    ],
    armor: sanitizeArmor(raw.armor),
    holos: count(raw.holos),
    debt: count(raw.debt),
    startingKit: text(raw.startingKit),
    trinket: text(raw.trinket),
    startingBonus: text(raw.startingBonus),
    notes: text(raw.notes),
  };
}

function sanitizeModule(raw: Raw): InstalledModule {
  return {
    id: text(raw.id) || newId(),
    name: text(raw.name),
    energy: count(raw.energy),
  };
}

function sanitizeHub(raw: unknown): Hub | null {
  if (!isRaw(raw)) {
    return null;
  }
  const type: HubType = raw.type === 'station' ? 'station' : 'starship';
  const base = STARTING_HUBS[type];
  return {
    ...base,
    createdAt: count(raw.createdAt, Date.now()),
    updatedAt: count(raw.updatedAt, Date.now()),
    type,
    hull: text(raw.hull, base.hull),
    defenseRating: count(raw.defenseRating, base.defenseRating),
    conditionMax: count(raw.conditionMax, base.conditionMax),
    fuelMax: count(raw.fuelMax, base.fuelMax),
    integrity: count(raw.integrity, base.integrity),
    condition: count(raw.condition),
    fuel: count(raw.fuel),
    energySource: text(raw.energySource, base.energySource),
    energyOutput: count(raw.energyOutput, base.energyOutput),
    backstory: text(raw.backstory),
    quirk: text(raw.quirk),
    modules: recordList(raw.modules)
      .map(sanitizeModule)
      .filter(module => module.name !== ''),
    notes: text(raw.notes),
  };
}

function withUniqueIds(characters: Character[]): Character[] {
  const seen = new Set<string>();
  return characters.map(character => {
    if (!seen.has(character.id)) {
      seen.add(character.id);
      return character;
    }
    const replacement = {...character, id: newId()};
    seen.add(replacement.id);
    return replacement;
  });
}

export function hubName(hub: Hub | null): string | null {
  if (!hub) {
    return null;
  }
  return hub.hull || (hub.type === 'starship' ? 'Звездолёт' : 'Станция');
}

export function summarize(backup: Backup): BackupSummary {
  return {
    characters: backup.characters.length,
    hub: hubName(backup.hub),
  };
}

export function buildBackup(state: {
  characters: Character[];
  activeId: string | null;
  hub: Hub | null;
}): Backup {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    characters: state.characters,
    activeId: state.activeId,
    hub: state.hub,
  };
}

export function backupToText(state: {
  characters: Character[];
  activeId: string | null;
  hub: Hub | null;
}): string {
  return JSON.stringify(buildBackup(state), null, 2);
}

export function parseBackup(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {ok: false, error: 'Вставьте JSON из резервной копии'};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {ok: false, error: 'Это не JSON. Скопируйте текст копии целиком'};
  }

  if (!isRaw(parsed) && !Array.isArray(parsed)) {
    return {ok: false, error: 'Ожидался объект с персонажами и хабом'};
  }

  if (Array.isArray(parsed)) {
    return finish({characters: parsed, activeId: null, hub: null});
  }

  if (parsed.app !== undefined && parsed.app !== BACKUP_APP) {
    return {ok: false, error: 'Это не резервная копия «Смерть в космосе»'};
  }

  const version = parsed.version === undefined ? BACKUP_VERSION : count(parsed.version);
  if (version > BACKUP_VERSION) {
    return {
      ok: false,
      error: `Копия сохранена более новой версией приложения (v${version})`,
    };
  }

  if (parsed.characters === undefined && parsed.hub === undefined) {
    return {ok: false, error: 'В копии нет ни персонажей, ни хаба'};
  }

  return finish({
    characters: parsed.characters,
    activeId: parsed.activeId,
    hub: parsed.hub,
  });
}

function finish(input: {
  characters: unknown;
  activeId: unknown;
  hub: unknown;
}): ParseResult {
  const characters = withUniqueIds(
    recordList(input.characters).map(sanitizeCharacter),
  );
  const hub = sanitizeHub(input.hub);
  const requested = text(input.activeId);
  const activeId = characters.some(character => character.id === requested)
    ? requested
    : characters[0]?.id ?? null;
  const backup: Backup = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    characters,
    activeId,
    hub,
  };
  return {ok: true, backup, summary: summarize(backup)};
}
