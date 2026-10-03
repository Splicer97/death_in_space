import {
  createCharacterStore,
  emptyCharacter,
  useCharacterStore,
} from '../src/store/characterStore';
import {storage} from '../src/store/storage';
import {STARTING_HUBS, itemWeight} from '../src/types';
import {performRoll, rollAbilityValue} from '../src/utils/dice';

describe('character store', () => {
  beforeEach(() => {
    storage.clearAll();
    useCharacterStore.setState({
      characters: [],
      activeId: null,
      hub: null,
      undoCharacter: null,
      undoHub: null,
    });
  });

  it('starts empty', () => {
    expect(useCharacterStore.getState().characters).toHaveLength(0);
  });

  it('creates a character and makes it active', () => {
    const draft = {...emptyCharacter(), name: 'Вейн'};
    const id = useCharacterStore.getState().addCharacter(draft);
    const state = useCharacterStore.getState();

    expect(state.characters).toHaveLength(1);
    expect(state.characters[0].name).toBe('Вейн');
    expect(state.activeId).toBe(id);
  });

  it('patches a character without touching the others', () => {
    const first = useCharacterStore
      .getState()
      .addCharacter({...emptyCharacter(), name: 'Первый'});
    useCharacterStore.getState().addCharacter({...emptyCharacter(), name: 'Второй'});

    useCharacterStore.getState().updateCharacter(first, {holos: 42});
    const state = useCharacterStore.getState();

    expect(state.characters.find(item => item.id === first)?.holos).toBe(42);
    expect(state.characters.find(item => item.name === 'Второй')?.holos).toBe(0);
  });

  it('removes a character and clears the active id', () => {
    const id = useCharacterStore
      .getState()
      .addCharacter({...emptyCharacter(), name: 'Труп'});

    useCharacterStore.getState().removeCharacter(id);
    const state = useCharacterStore.getState();

    expect(state.characters).toHaveLength(0);
    expect(state.activeId).toBeNull();
  });

  it('restores a deleted character with the same id', () => {
    const store = useCharacterStore.getState();
    const id = store.addCharacter({...emptyCharacter(), name: 'Возвращённый'});
    const snapshot = useCharacterStore.getState().characters[0];

    store.removeCharacter(id);
    expect(useCharacterStore.getState().characters).toHaveLength(0);

    store.restoreCharacter(snapshot);
    const state = useCharacterStore.getState();

    expect(state.characters).toHaveLength(1);
    expect(state.characters[0].id).toBe(id);
    expect(state.characters[0].name).toBe('Возвращённый');
    expect(state.activeId).toBe(id);
  });

  it('brings a removed character back through undoRemove', () => {
    const store = useCharacterStore.getState();
    const id = store.addCharacter({...emptyCharacter(), name: 'Отменённый'});
    store.removeCharacter(id);

    expect(useCharacterStore.getState().undoCharacter?.name).toBe('Отменённый');

    useCharacterStore.getState().undoRemove();
    const state = useCharacterStore.getState();

    expect(state.characters).toHaveLength(1);
    expect(state.characters[0].id).toBe(id);
    expect(state.undoCharacter).toBeNull();
  });

  it('ignores a restore of a character that is still in the roster', () => {
    const store = useCharacterStore.getState();
    const id = store.addCharacter({...emptyCharacter(), name: 'Дубль'});
    const snapshot = useCharacterStore.getState().characters[0];

    store.restoreCharacter(snapshot);

    expect(useCharacterStore.getState().characters).toHaveLength(1);
    expect(useCharacterStore.getState().activeId).toBe(id);
  });

  it('writes the state into MMKV', () => {
    useCharacterStore
      .getState()
      .addCharacter({...emptyCharacter(), name: 'Персистентный'});

    const raw = storage.getString('characters');
    expect(raw).toBeDefined();
    expect(JSON.parse(raw as string).state.characters[0].name).toBe(
      'Персистентный',
    );
  });

  it('rehydrates from MMKV in a fresh store instance', async () => {
    useCharacterStore
      .getState()
      .addCharacter({...emptyCharacter(), name: 'Из хранилища'});
    const raw = storage.getString('characters') as string;
    expect(raw).toContain('Из хранилища');

    const restored = createCharacterStore();
    await restored.persist.rehydrate();

    expect(restored.getState().characters).toHaveLength(1);
    expect(restored.getState().characters[0].name).toBe('Из хранилища');
  });
});

describe('storage migration', () => {
  beforeEach(() => {
    storage.clearAll();
    useCharacterStore.setState({
      characters: [],
      activeId: null,
      hub: null,
      undoCharacter: null,
      undoHub: null,
    });
  });

  it('converts a v1 snapshot into the v4 shape', async () => {
    storage.set(
      'characters',
      JSON.stringify({
        state: {
          characters: [
            {
              id: 'a',
              name: 'Вейн',
              notes: 'Долг за груз',
              smallItems: 'Компонент\nЗапчасти',
              items: [{id: 'i1', name: 'Детектор', condition: 3}],
              weapons: [
                {name: 'Пистолет', damage: '1d6', uses: 4, condition: 2},
              ],
            },
          ],
          activeId: 'a',
          hub: null,
        },
        version: 1,
      }),
    );

    const restored = createCharacterStore();
    await restored.persist.rehydrate();

    const [character] = restored.getState().characters;
    expect(character.noteGroups).toEqual([
      {id: 'g0', title: 'Общие', text: 'Долг за груз'},
    ]);
    expect(character.smallItems).toEqual([
      {name: 'Компонент', count: 1},
      {name: 'Запчасти', count: 1},
    ]);
    expect(character.items).toEqual([
      {id: 'i1', name: 'Детектор', condition: 3, weight: 1},
    ]);
    expect(character.weapons[0]).toEqual({
      name: 'Пистолет',
      damage: '1d6',
      uses: 4,
      condition: 2,
      ammo: '',
    });
    expect(character.weapons[1].ammo).toBe('');
    expect(
      JSON.parse(storage.getString('characters') as string).version,
    ).toBe(4);
  });

  it('keeps a single-line v1 smallItems as one entry', async () => {
    storage.set(
      'characters',
      JSON.stringify({
        state: {
          characters: [{id: 'a', name: 'Вейн', smallItems: 'Кружка'}],
          activeId: 'a',
          hub: null,
        },
        version: 1,
      }),
    );

    const restored = createCharacterStore();
    await restored.persist.rehydrate();

    expect(restored.getState().characters[0].smallItems).toEqual([
      {name: 'Кружка', count: 1},
    ]);
  });

  it('upgrades v2 string-list small items and fills weight and ammo', async () => {
    storage.set(
      'characters',
      JSON.stringify({
        state: {
          characters: [
            {
              id: 'a',
              name: 'Вейн',
              smallItems: ['Кружка'],
              items: [{id: 'i1', name: 'Нож', condition: 2}],
              weapons: [{name: 'Мачете', damage: '1d8'}],
            },
          ],
          activeId: 'a',
          hub: null,
        },
        version: 2,
      }),
    );

    const restored = createCharacterStore();
    await restored.persist.rehydrate();

    const [character] = restored.getState().characters;
    expect(character.smallItems).toEqual([{name: 'Кружка', count: 1}]);
    expect(itemWeight(character.items[0])).toBe(1);
    expect(character.items[0].weight).toBe(1);
    expect(character.weapons[0].ammo).toBe('');
  });

  it('keeps v3 small items with their counts', async () => {
    storage.set(
      'characters',
      JSON.stringify({
        state: {
          characters: [
            {
              id: 'a',
              name: 'Вейн',
              smallItems: [
                {name: 'Шоколадный батончик', count: 3},
                {name: 'Кружка', count: 1},
              ],
            },
          ],
          activeId: 'a',
          hub: null,
        },
        version: 3,
      }),
    );

    const restored = createCharacterStore();
    await restored.persist.rehydrate();

    expect(restored.getState().characters[0].smallItems).toEqual([
      {name: 'Шоколадный батончик', count: 3},
      {name: 'Кружка', count: 1},
    ]);
  });

  it('migrates a v3 notes string into one note group', async () => {
    storage.set(
      'characters',
      JSON.stringify({
        state: {
          characters: [
            {
              id: 'a',
              name: 'Вейн',
              notes: 'Цели: отдать долг',
            },
          ],
          activeId: 'a',
          hub: null,
        },
        version: 3,
      }),
    );

    const restored = createCharacterStore();
    await restored.persist.rehydrate();

    expect(restored.getState().characters[0].noteGroups).toEqual([
      {id: 'g0', title: 'Общие', text: 'Цели: отдать долг'},
    ]);
  });

  it('keeps multiple note groups untouched', async () => {
    storage.set(
      'characters',
      JSON.stringify({
        state: {
          characters: [
            {
              id: 'a',
              name: 'Вейн',
              noteGroups: [
                {id: 'n1', title: 'Цели', text: 'Отдать долг'},
                {id: 'n2', title: 'Мастеру', text: 'Нужен нож'},
              ],
            },
          ],
          activeId: 'a',
          hub: null,
        },
        version: 4,
      }),
    );

    const restored = createCharacterStore();
    await restored.persist.rehydrate();

    expect(restored.getState().characters[0].noteGroups).toEqual([
      {id: 'n1', title: 'Цели', text: 'Отдать долг'},
      {id: 'n2', title: 'Мастеру', text: 'Нужен нож'},
    ]);
  });
});

describe('dice', () => {
  it('keeps ability values in the -3..+3 range', () => {
    for (let i = 0; i < 500; i += 1) {
      const {first, second, value} = rollAbilityValue();
      expect(first).toBeGreaterThanOrEqual(1);
      expect(first).toBeLessThanOrEqual(4);
      expect(value).toBe(first - second);
      expect(value).toBeGreaterThanOrEqual(-3);
      expect(value).toBeLessThanOrEqual(3);
    }
  });

  it('rolls a single die in normal mode', () => {
    const result = performRoll(0);
    expect(result.dice).toHaveLength(1);
    expect(result.dice[0]).toBeGreaterThanOrEqual(1);
    expect(result.dice[0]).toBeLessThanOrEqual(20);
    expect(result.total).toBe(result.dice[0]);
  });

  it('keeps the best of two dice with advantage', () => {
    const result = performRoll(0, 'advantage');
    expect(result.dice).toHaveLength(2);
    expect(result.total).toBe(Math.max(...result.dice));
  });

  it('keeps the worst of two dice with disadvantage', () => {
    const result = performRoll(0, 'disadvantage');
    expect(result.dice).toHaveLength(2);
    expect(result.total).toBe(Math.min(...result.dice));
  });

  it('applies the modifier and evaluates the target', () => {
    const success = performRoll(20, 'normal', 12);
    expect(success.total).toBeGreaterThanOrEqual(12);
    expect(success.success).toBe(true);

    const failure = performRoll(-20, 'normal', 12);
    expect(failure.success).toBe(false);
  });

  it('leaves success undefined without a target', () => {
    expect(performRoll(0).success).toBeNull();
  });
});

describe('hub store', () => {
  beforeEach(() => {
    storage.clearAll();
    useCharacterStore.setState({
      characters: [],
      activeId: null,
      hub: null,
      undoCharacter: null,
      undoHub: null,
    });
  });

  it('starts without a hub', () => {
    expect(useCharacterStore.getState().hub).toBeNull();
  });

  it('creates a hub from a draft and stamps it', () => {
    useCharacterStore
      .getState()
      .createHub({...STARTING_HUBS.station, hull: 'Кольцо Рас'});
    const hub = useCharacterStore.getState().hub;

    expect(hub).not.toBeNull();
    expect(hub?.hull).toBe('Кольцо Рас');
    expect(hub?.type).toBe('station');
    expect(hub?.fuelMax).toBe(STARTING_HUBS.station.fuelMax);
    expect(hub?.createdAt).toBeGreaterThan(0);
    expect(hub?.modules).toHaveLength(0);
  });

  it('recreates a hub without leaving the previous one behind', () => {
    const store = useCharacterStore.getState();
    store.createHub({...STARTING_HUBS.starship, hull: 'Первый'});
    store.createHub({...STARTING_HUBS.starship, hull: 'Второй'});
    const hub = useCharacterStore.getState().hub;

    expect(hub?.hull).toBe('Второй');
  });

  it('patches a hub and keeps characters untouched', () => {
    const store = useCharacterStore.getState();
    store.addCharacter({...emptyCharacter(), name: 'Вейн'});
    store.createHub({...STARTING_HUBS.starship});

    store.updateHub({
      fuel: 2,
      modules: [{id: 'm1', name: 'Бар', energy: 1}],
    });
    const state = useCharacterStore.getState();

    expect(state.hub?.fuel).toBe(2);
    expect(state.hub?.modules).toHaveLength(1);
    expect(state.characters).toHaveLength(1);
    expect(state.characters[0].name).toBe('Вейн');
  });

  it('removes a hub and leaves characters in place', () => {
    const store = useCharacterStore.getState();
    store.addCharacter({...emptyCharacter(), name: 'Вейн'});
    store.createHub({...STARTING_HUBS.starship});

    store.removeHub();
    const state = useCharacterStore.getState();

    expect(state.hub).toBeNull();
    expect(state.characters).toHaveLength(1);
  });

  it('brings a removed hub back through undoRemove', () => {
    const store = useCharacterStore.getState();
    store.createHub({...STARTING_HUBS.starship, hull: 'Возвращённый хаб'});
    store.removeHub();

    expect(useCharacterStore.getState().undoHub?.hull).toBe(
      'Возвращённый хаб',
    );

    useCharacterStore.getState().undoRemove();
    const state = useCharacterStore.getState();

    expect(state.hub?.hull).toBe('Возвращённый хаб');
    expect(state.undoHub).toBeNull();
  });

  it('keeps the undo slot empty when nothing was removed', () => {
    useCharacterStore.getState().undoRemove();

    const state = useCharacterStore.getState();
    expect(state.undoCharacter).toBeNull();
    expect(state.undoHub).toBeNull();
  });

  it('rehydrates the hub from MMKV', async () => {
    useCharacterStore
      .getState()
      .createHub({...STARTING_HUBS.starship, hull: 'Из хранилища'});

    const restored = createCharacterStore();
    await restored.persist.rehydrate();

    expect(restored.getState().hub?.hull).toBe('Из хранилища');
  });
});
