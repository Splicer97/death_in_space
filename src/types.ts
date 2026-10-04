export type AbilityKey = 'body' | 'dexterity' | 'savvy' | 'tech';

export const ABILITY_KEYS: AbilityKey[] = [
  'body',
  'dexterity',
  'savvy',
  'tech',
];

export type Abilities = Record<AbilityKey, number>;

export type OriginKey =
  | 'carbon'
  | 'chrome'
  | 'punk'
  | 'solpod'
  | 'velocityCursed'
  | 'void';

export interface NoteGroup {
  id: string;
  title: string;
  text: string;
}

export interface Item {
  id: string;
  name: string;
  condition: number;
  weight?: number;
}

export interface SmallItem {
  name: string;
  count: number;
  condition?: number;
}

export interface Weapon {
  name: string;
  damage: string;
  uses: number;
  maxUses?: number;
  condition: number;
  ammo?: string;
}

export interface Armor {
  type: string;
  protectsAgainst: string;
  drBonus: number;
  slots?: number;
}

export interface Character {
  id: string;
  createdAt: number;
  updatedAt: number;

  playerName: string;
  name: string;
  nickname: string;

  origin: OriginKey | null;
  originBenefits: string[];

  xp: number;
  background: string;
  pastAllegiance: string;
  trait: string;
  drive: string;
  looks: string;
  portrait: string;

  abilities: Abilities;
  hp: number;
  hpMax: number;

  voidPoints: number;
  mutations: string[];
  voidCorruption: string[];
  lifeSupport: number;

  items: Item[];
  smallItems: SmallItem[];
  weapons: [Weapon, Weapon];
  armor: Armor | null;
  holos: number;
  debt: number;

  startingKit: string;
  trinket: string;
  startingBonus: string;

  noteGroups: NoteGroup[];
}

export type CharacterDraft = Omit<Character, 'id' | 'createdAt' | 'updatedAt'>;

export type HubType = 'starship' | 'station';

export type Accessibility =
  | 'обычный'
  | 'необычный'
  | 'редкий'
  | 'очень редкий'
  | 'уникальный';

export interface HubEnergy {
  name: string;
  output: number;
  accessibility: Accessibility;
  requirement: string;
  speed: string;
  note: string;
}

export interface HubModule {
  name: string;
  energy: number;
  description: string;
}

export interface InstalledModule {
  id: string;
  name: string;
  energy: number;
}

export interface Hub {
  createdAt: number;
  updatedAt: number;

  type: HubType;
  hull: string;
  defenseRating: number;
  conditionMax: number;
  fuelMax: number;
  integrity: number;
  condition: number;
  fuel: number;

  energySource: string;
  energyOutput: number;

  backstory: string;
  quirk: string;

  modules: InstalledModule[];

  notes: string;
}

export type HubDraft = Omit<Hub, 'createdAt' | 'updatedAt'>;

export const MAX_VOID_POINTS = 4;
export const LIFE_SUPPORT_STEPS = 7;
export const MAX_WEAPON_CONDITION = 5;
export const HUB_MAX_INTEGRITY = 100;

export const EMPTY_ARMOR: Armor = {
  type: '',
  protectsAgainst: '',
  drBonus: 0,
  slots: 0,
};

export const STARTING_HUBS: Record<HubType, HubDraft> = {
  starship: {
    type: 'starship',
    hull: 'Звездолёт',
    defenseRating: 11,
    conditionMax: 5,
    fuelMax: 6,
    integrity: HUB_MAX_INTEGRITY,
    condition: 5,
    fuel: 6,
    energySource: 'Химический двигатель',
    energyOutput: 3,
    backstory: '',
    quirk: '',
    modules: [],
    notes: '',
  },
  station: {
    type: 'station',
    hull: 'Станция',
    defenseRating: 11,
    conditionMax: 5,
    fuelMax: 4,
    integrity: HUB_MAX_INTEGRITY,
    condition: 5,
    fuel: 4,
    energySource: 'Промышленный генератор',
    energyOutput: 3,
    backstory: '',
    quirk: '',
    modules: [],
    notes: '',
  },
};

export const HUB_CORE_FUNCTIONS: { name: string; description: string }[] = [
  {
    name: 'Командный центр',
    description: 'Мостик хаба: сканирование, связь и управление (только звездолёты).',
  },
  {
    name: 'Каюты экипажа',
    description: 'Единственное убежище члена экипажа, с местом для кровати.',
  },
  {
    name: 'Жизнеобеспечение',
    description:
      'Подача и генерация кислорода, отопление, рециркуляция воды, переработка мусора, искусственная гравитация.',
  },
  {
    name: 'Столовая',
    description: 'Единственное место, достаточно большое для всей команды.',
  },
];

export function energyUsed(modules: InstalledModule[]): number {
  return modules.reduce((sum, item) => sum + item.energy, 0);
}

export function energyOverdrawn(modules: InstalledModule[], output: number): boolean {
  return energyUsed(modules) > output;
}

export function itemWeight(item: Item): number {
  return Math.max(0, Math.round(item.weight ?? 1));
}

export function itemsUsed(items: Item[]): number {
  return items.reduce((sum, item) => sum + itemWeight(item), 0);
}

export function itemSlots(body: number): number {
  return 12 + body;
}

export function availableSlots(body: number, armor: Armor | null): number {
  return Math.max(0, itemSlots(body) - (armor?.slots ?? 0));
}

export function defenseRating(dexterity: number, armor: Armor | null): number {
  return 12 + dexterity + (armor ? armor.drBonus : 0);
}

export function abilitySum(abilities: Abilities): number {
  return ABILITY_KEYS.reduce((sum, key) => sum + abilities[key], 0);
}
