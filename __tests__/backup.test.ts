import {
  backupToText,
  buildBackup,
  hubName,
  parseBackup,
  summarize,
} from '../src/utils/backup';
import { emptyCharacter, useCharacterStore } from '../src/store/characterStore';
import { STARTING_HUBS, type Character, type Hub } from '../src/types';

function richCharacter(): Character {
  return {
    ...emptyCharacter(),
    id: 'char-1',
    createdAt: 1,
    updatedAt: 2,
    name: 'Вейн',
    playerName: 'Аня',
    nickname: 'Скальд',
    origin: 'void',
    originBenefits: ['Тихая пустота'],
    xp: 3,
    background: 'Беглый',
    trait: 'Хладнокровие',
    noteGroups: [{id: 'g0', title: 'Общие', text: 'Строка\nс переносом'}],
    portrait: '🛸',
    abilities: {body: 2, dexterity: 1, savvy: 0, tech: -1},
    hp: 3,
    hpMax: 6,
    voidPoints: 2,
    mutations: ['Дополнительный палец'],
    voidCorruption: ['Эхо'],
    items: [
      {id: 'item-1', name: 'Детектор', condition: 4, weight: 1},
      {id: 'item-2', name: 'Кредит', condition: 0, weight: 2},
    ],
    smallItems: [
      {name: 'Компонент', count: 1},
      {name: 'Шоколадный батончик', count: 3},
    ],
    weapons: [
      {
        name: 'Плазменный пистолет',
        damage: '1d6+1',
        uses: 4,
        maxUses: 12,
        condition: 3,
        ammo: '1d4×10 · 40/40',
      },
      {name: 'Мачете', damage: '1d8', uses: 3, maxUses: 3, condition: 1, ammo: ''},
    ],
    armor: {
      type: 'Скафандр',
      protectsAgainst: 'Вакуум',
      drBonus: 1,
      slots: 2,
    },
    holos: 12,
    debt: 300,
  };
}

function richHub(): Hub {
  return {
    ...STARTING_HUBS.starship,
    createdAt: 5,
    updatedAt: 6,
    hull: 'Кольцо Рас',
    energySource: 'Термоядерный реактор',
    condition: 3,
    fuel: 4,
    modules: [
      {id: 'mod-1', name: 'Бриг', energy: 2},
      {id: 'mod-2', name: 'Гидропонная ферма', energy: 2},
    ],
    backstory: 'Довоенный грузовик',
    quirk: 'Вечная течь',
    notes: 'Чинить в порту',
  };
}

describe('backup export', () => {
  it('keeps every field through a text round trip', () => {
    const text = backupToText({
      characters: [richCharacter()],
      activeId: 'char-1',
      hub: richHub(),
    });

    const result = parseBackup(text);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.backup.characters[0]).toEqual(richCharacter());
    expect(result.backup.hub).toEqual(richHub());
    expect(result.backup.activeId).toBe('char-1');
    expect(result.summary).toEqual({characters: 1, hub: 'Кольцо Рас'});
  });

  it('stamps the envelope so a stray paste is recognisable', () => {
    const backup = buildBackup({characters: [], activeId: null, hub: null});

    expect(backup.app).toBe('death-in-space');
    expect(backup.version).toBe(3);
    expect(typeof backup.exportedAt).toBe('number');
  });

  it('reports a hub without a name by its type', () => {
    expect(hubName(null)).toBeNull();
    expect(hubName({...richHub(), hull: ''})).toBe('Звездолёт');
    expect(
      hubName({...richHub(), hull: '', type: 'station', defenseRating: 13}),
    ).toBe('Станция');
  });
});

describe('backup import', () => {
  it('rejects empty, non-JSON and foreign payloads', () => {
    expect(parseBackup('   ')).toEqual({
      ok: false,
      error: 'Вставьте JSON из резервной копии',
    });
    expect(parseBackup('не json')).toEqual({
      ok: false,
      error: 'Это не JSON. Скопируйте текст копии целиком',
    });
    expect(parseBackup('{"app":"other-game","characters":[]}')).toEqual({
      ok: false,
      error: 'Это не резервная копия «Смерть в космосе»',
    });
    expect(parseBackup('42')).toEqual({
      ok: false,
      error: 'Ожидался объект с персонажами и хабом',
    });
    expect(parseBackup('{"version":1}')).toEqual({
      ok: false,
      error: 'В копии нет ни персонажей, ни хаба',
    });
  });

  it('refuses a copy from a newer app version', () => {
    const result = parseBackup(
      JSON.stringify({app: 'death-in-space', version: 99, characters: []}),
    );

    expect(result).toEqual({
      ok: false,
      error: 'Копия сохранена более новой версией приложения (v99)',
    });
  });

  it('accepts a bare character array as a minimal copy', () => {
    const result = parseBackup(JSON.stringify([{id: 'a', name: 'Вейн'}]));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.backup.characters[0].name).toBe('Вейн');
    expect(result.backup.activeId).toBe('a');
    expect(result.backup.hub).toBeNull();
  });

  it('fills in missing fields so a hand-edited copy cannot break the sheet', () => {
    const result = parseBackup(
      JSON.stringify({app: 'death-in-space', characters: [{name: 'Ковбой'}]}),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const [character] = result.backup.characters;
    expect(character.name).toBe('Ковбой');
    expect(character.id).toBeTruthy();
    expect(character.abilities).toEqual({
      body: 0,
      dexterity: 0,
      savvy: 0,
      tech: 0,
    });
    expect(character.weapons).toHaveLength(2);
    expect(character.mutations).toEqual([]);
    expect(character.lifeSupport).toBe(7);
    expect(character.portrait).toBe('🛸');
  });

  it('drops junk entries and rubbish field types', () => {
    const result = parseBackup(
      JSON.stringify({
        app: 'death-in-space',
        characters: [
          {
            id: 'a',
            name: 'Вейн',
            hp: 'много',
            mutations: ['Эхо', 7, null],
            items: [{id: 'i', name: 'Детектор', condition: 'x'}, 'мусор'],
            smallItems: 'Кружка\nКлюч',
            weapons: [{name: 'Пистолет'}],
            armor: 'броня',
          },
        ],
        hub: {type: 'chartreuse', energyOutput: 'много', modules: [{}, {name: 'Бриг', energy: 2}]},
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const [character] = result.backup.characters;
    expect(character.hp).toBe(0);
    expect(character.mutations).toEqual(['Эхо']);
    expect(character.items).toEqual([
      {id: 'i', name: 'Детектор', condition: 0, weight: 1},
    ]);
    expect(character.smallItems).toEqual([
      {name: 'Кружка', count: 1},
      {name: 'Ключ', count: 1},
    ]);
    expect(character.weapons[0].name).toBe('Пистолет');
    expect(character.weapons[0].ammo).toBe('');
    expect(character.armor).toBeNull();

    const hub = result.backup.hub as Hub;
    expect(hub.type).toBe('starship');
    expect(hub.energyOutput).toBe(STARTING_HUBS.starship.energyOutput);
    expect(hub.modules).toHaveLength(1);
    expect(hub.modules[0].name).toBe('Бриг');
  });

  it('gives duplicated ids a fresh value and repairs a dangling active id', () => {
    const result = parseBackup(
      JSON.stringify({
        app: 'death-in-space',
        activeId: 'улетел',
        characters: [
          {id: 'same', name: 'Первый'},
          {id: 'same', name: 'Второй'},
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const [first, second] = result.backup.characters;
    expect(first.id).not.toBe(second.id);
    expect(result.backup.activeId).toBe(first.id);
  });

  it('describes an empty copy without pretending it holds data', () => {
    const result = parseBackup(
      backupToText({characters: [], activeId: null, hub: null}),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(summarize(result.backup)).toEqual({characters: 0, hub: null});
  });
});

describe('store import', () => {
  beforeEach(() => {
    useCharacterStore.setState({
      characters: [],
      activeId: null,
      hub: null,
      undoCharacter: null,
      undoHub: null,
    });
  });

  it('replaces the roster and the hub, and drops the undo slot', () => {
    useCharacterStore.getState().addCharacter({...emptyCharacter(), name: 'Лишний'});
    useCharacterStore.getState().createHub({...STARTING_HUBS.station});
    useCharacterStore.getState().removeHub();
    expect(useCharacterStore.getState().undoHub).not.toBeNull();

    const result = parseBackup(
      backupToText({characters: [richCharacter()], activeId: 'char-1', hub: richHub()}),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    useCharacterStore.getState().importBackup(result.backup);
    const state = useCharacterStore.getState();

    expect(state.characters).toHaveLength(1);
    expect(state.characters[0].name).toBe('Вейн');
    expect(state.activeId).toBe('char-1');
    expect(state.hub?.hull).toBe('Кольцо Рас');
    expect(state.undoHub).toBeNull();
    expect(state.undoCharacter).toBeNull();
  });
});
