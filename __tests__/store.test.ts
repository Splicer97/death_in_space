import {
  createCharacterStore,
  emptyCharacter,
  useCharacterStore,
} from '../src/store/characterStore';
import {storage} from '../src/store/storage';
import {STARTING_HUBS} from '../src/types';
import {performRoll, rollAbilityValue} from '../src/utils/dice';

describe('character store', () => {
  beforeEach(() => {
    storage.clearAll();
    useCharacterStore.setState({characters: [], activeId: null, hub: null});
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
    useCharacterStore.setState({characters: [], activeId: null, hub: null});
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

  it('rehydrates the hub from MMKV', async () => {
    useCharacterStore
      .getState()
      .createHub({...STARTING_HUBS.starship, hull: 'Из хранилища'});

    const restored = createCharacterStore();
    await restored.persist.rehydrate();

    expect(restored.getState().hub?.hull).toBe('Из хранилища');
  });
});
