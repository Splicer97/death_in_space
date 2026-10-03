import React from 'react';
import { Alert, Share } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import CreateScreen from '../src/screens/CreateScreen';
import CharacterScreen from '../src/screens/CharacterScreen';
import DataScreen from '../src/screens/DataScreen';
import RosterScreen from '../src/screens/RosterScreen';
import { emptyCharacter, useCharacterStore } from '../src/store/characterStore';
import { TRAITS } from '../src/data/tables';
import { VOID_CORRUPTIONS } from '../src/data/mutations';
import { STARTING_HUBS } from '../src/types';
import { storage } from '../src/store/storage';
import type { RootStackParamList } from '../src/navigation/types';

type CreateProps = NativeStackScreenProps<RootStackParamList, 'Create'>;
type CharacterProps = NativeStackScreenProps<RootStackParamList, 'Character'>;
type RosterProps = NativeStackScreenProps<RootStackParamList, 'Roster'>;
type DataProps = NativeStackScreenProps<RootStackParamList, 'Data'>;

type NavMock = {
  navigate: jest.Mock;
  replace: jest.Mock;
  goBack: jest.Mock;
  setOptions: jest.Mock;
};

function makeNav<T>(): { nav: T; calls: NavMock } {
  const calls: NavMock = {
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  };
  return { nav: calls as unknown as T, calls };
}

type Child = TestRenderer.ReactTestInstance | string;

function collectText(node: TestRenderer.ReactTestInstance): string {
  const parts: string[] = [];
  const walk = (current: Child | Child[]): void => {
    if (typeof current === 'string') {
      parts.push(current);
    } else if (Array.isArray(current)) {
      current.forEach(walk);
    } else {
      current.children.forEach(walk);
    }
  };
  walk(node.children);
  return parts.join(' ');
}

function findByLabel(
  tree: TestRenderer.ReactTestInstance,
  label: string,
): TestRenderer.ReactTestInstance {
  return tree.findAll(node => node.props?.accessibilityLabel === label, {
    deep: true,
  })[0];
}

function pressNth(
  tree: TestRenderer.ReactTestInstance,
  text: string,
  index: number,
) {
  const nodes = tree.findAll(
    candidate =>
      typeof candidate.props?.onPress === 'function' &&
      collectText(candidate).includes(text),
    { deep: true },
  );
  expect(nodes[index]).toBeDefined();
  act(() => {
    nodes[index].props.onPress();
  });
}

function press(tree: TestRenderer.ReactTestInstance, text: string) {
  pressNth(tree, text, 0);
}

describe('character creation flow', () => {
  beforeEach(() => {
    storage.clearAll();
    act(() => {
      useCharacterStore.setState({
        characters: [],
        activeId: null,
        hub: null,
        undoCharacter: null,
        undoHub: null,
      });
    });
  });

  it('accepts hand-written details and details chosen from the table', () => {
    const { nav } = makeNav<CreateProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CreateScreen navigation={nav} route={{ key: 'k', name: 'Create' }} />,
      );
    });
    press(tree.root, 'БРОСИТЬ 2d4 × 4');
    press(tree.root, 'ДАЛЬШЕ');
    press(tree.root, 'ДАЛЬШЕ');

    const nameInput = tree.root.findAll(
      node =>
        typeof node.type === 'string' && node.props.placeholder === 'Кто ты?',
    )[0];
    act(() => {
      nameInput.props.onChangeText('Вейн');
    });

    // Hand-written background, no dice at all.
    const detailInputs = tree.root.findAll(
      node =>
        typeof node.type === 'string' &&
        typeof node.props.placeholder === 'string' &&
        node.props.placeholder.startsWith('Впишите своё'),
    );
    expect(detailInputs.length).toBe(4);
    act(() => {
      detailInputs[0].props.onChangeText('Беглый с Кара-Корума');
    });

    // Trait picked from the d20 table instead of rolled.
    press(findByLabel(tree.root, 'Таблица: черта'), '');
    press(tree.root, TRAITS[0].text);

    press(tree.root, 'ДАЛЬШЕ');
    press(tree.root, 'ДАЛЬШЕ');
    press(tree.root, 'ДАЛЬШЕ');
    press(tree.root, 'СОЗДАТЬ');

    const created = useCharacterStore.getState().characters[0];
    expect(created.background).toBe('Беглый с Кара-Корума');
    expect(created.trait).toBe(TRAITS[0].text);
  });

  it('creates a character through the wizard and persists it to MMKV', () => {
    const { nav, calls } = makeNav<CreateProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CreateScreen navigation={nav} route={{ key: 'k', name: 'Create' }} />,
      );
    });

    // Step 1: roll abilities.
    press(tree.root, 'БРОСИТЬ 2d4 × 4');
    // Step 2: pick an origin.
    press(tree.root, 'ДАЛЬШЕ');
    press(tree.root, 'КАРБОН');
    press(tree.root, 'ШЕСТЕРЁНКОГОЛОВЫЙ');
    press(tree.root, 'ИСКУССТВЕННЫЕ ЛЕГКИЕ');
    press(tree.root, 'ДАЛЬШЕ');

    // Step 3: details.
    const nameInput = tree.root.findAll(
      node =>
        typeof node.type === 'string' && node.props.placeholder === 'Кто ты?',
    )[0];
    act(() => {
      nameInput.props.onChangeText('Вейн');
    });
    press(tree.root, 'ДАЛЬШЕ');

    // Steps 4-5.
    press(tree.root, 'ДАЛЬШЕ');
    press(tree.root, 'ДАЛЬШЕ');

    // Step 6: gear.
    press(tree.root, 'БРОСИТЬ 3d10');
    press(tree.root, 'СОЗДАТЬ');

    const state = useCharacterStore.getState();
    expect(state.characters).toHaveLength(1);
    expect(state.characters[0].name).toBe('Вейн');
    expect(state.characters[0].origin).toBe('carbon');
    expect(state.characters[0].originBenefits).toEqual(['ИСКУССТВЕННЫЕ ЛЕГКИЕ']);
    expect(state.characters[0].holos).toBeGreaterThanOrEqual(3);
    expect(calls.replace).toHaveBeenCalledWith('Character', {
      id: state.characters[0].id,
    });

    const raw = storage.getString('characters') as string;
    expect(JSON.parse(raw).state.characters[0].name).toBe('Вейн');
  });

  it('refuses to create an unnamed character', () => {
    const { nav } = makeNav<CreateProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CreateScreen navigation={nav} route={{ key: 'k', name: 'Create' }} />,
      );
    });

    for (let i = 0; i < 5; i += 1) {
      press(tree.root, 'ДАЛЬШЕ');
    }
    press(tree.root, 'СОЗДАТЬ');

    expect(useCharacterStore.getState().characters).toHaveLength(0);
  });

  it('caps hit points at 8 without a bonus', () => {
    const { nav } = makeNav<CreateProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CreateScreen navigation={nav} route={{ key: 'k', name: 'Create' }} />,
      );
    });

    for (let i = 0; i < 4; i += 1) {
      press(tree.root, 'ДАЛЬШЕ');
    }

    const up = findByLabel(tree.root, 'Увеличить МАКСИМУМ ХИТОВ');
    for (let i = 0; i < 8; i += 1) {
      act(() => up.props.onPress());
    }

    const rendered = (value: string) =>
      tree.root.findAll(
        node => node.props?.children === value && typeof node.type === 'string',
      );
    expect(rendered('+8')).not.toHaveLength(0);
    expect(rendered('+9')).toHaveLength(0);
    expect(collectText(tree.root)).not.toContain('Стартовый бонус добавил');
  });

  it('grants +3 hit points and a highlighted hint on a negative ability sum', () => {
    const { nav } = makeNav<CreateProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CreateScreen navigation={nav} route={{ key: 'k', name: 'Create' }} />,
      );
    });

    const downBody = findByLabel(tree.root, 'Уменьшить ТЕЛ — ТЕЛО');
    for (let i = 0; i < 5; i += 1) {
      act(() => downBody.props.onPress());
    }

    for (let i = 0; i < 4; i += 1) {
      press(tree.root, 'ДАЛЬШЕ');
    }

    const up = findByLabel(tree.root, 'Увеличить МАКСИМУМ ХИТОВ');
    for (let i = 0; i < 13; i += 1) {
      act(() => up.props.onPress());
    }

    const text = collectText(tree.root);
    const rendered = (value: string) =>
      tree.root.findAll(
        node => node.props?.children === value && typeof node.type === 'string',
      );
    expect(rendered('+11')).not.toHaveLength(0);
    expect(rendered('+12')).toHaveLength(0);
    expect(text).toContain('Стартовый бонус добавил');
  });
});

describe('character sheet', () => {
  beforeEach(() => {
    storage.clearAll();
    act(() => {
      useCharacterStore.setState({
        characters: [],
        activeId: null,
        hub: null,
        undoCharacter: null,
        undoHub: null,
      });
      useCharacterStore.getState().addCharacter({
        ...emptyCharacter(),
        name: 'Вейн',
        hpMax: 6,
        hp: 3,
        abilities: { body: 2, dexterity: 1, savvy: 0, tech: -1 },
      });
    });
  });

  it('renders derived defense rating and slot count', () => {
    const id = useCharacterStore.getState().activeId as string;
    const { nav } = makeNav<CharacterProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CharacterScreen
          navigation={nav}
          route={{ key: 'k', name: 'Character', params: { id } }}
        />,
      );
    });

    const texts = JSON.stringify(tree.toJSON());
    expect(texts).toContain('13'); // 12 + ЛОВ 1
    expect(texts).toContain('14'); // 12 + ТЕЛ 2
  });

  it('applies the armor DR bonus to the defense rating', () => {
    const id = useCharacterStore.getState().activeId as string;
    act(() => {
      useCharacterStore.getState().updateCharacter(id, {
        armor: {
          type: 'Средний бронежилет (флак)',
          protectsAgainst: 'пули',
          drBonus: 2,
        },
      });
    });

    const { nav } = makeNav<CharacterProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CharacterScreen
          navigation={nav}
          route={{ key: 'k', name: 'Character', params: { id } }}
        />,
      );
    });

    expect(JSON.stringify(tree.toJSON())).toContain('15');
  });

  it('keeps the armor DR bonus when the armor type is edited', () => {
    const id = useCharacterStore.getState().activeId as string;
    act(() => {
      useCharacterStore.getState().updateCharacter(id, {
        armor: {
          type: 'Средний бронежилет (флак)',
          protectsAgainst: 'пули',
          drBonus: 2,
        },
      });
    });

    const { nav } = makeNav<CharacterProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CharacterScreen
          navigation={nav}
          route={{ key: 'k', name: 'Character', params: { id } }}
        />,
      );
    });

    press(tree.root, 'ВЕЩИ');
    const typeInput = tree.root.findAll(node => node.props?.label === 'ТИП', {
      deep: true,
    })[0];
    act(() => {
      typeInput.props.onChangeText('Свой доспех');
    });

    expect(useCharacterStore.getState().characters[0].armor).toEqual({
      type: 'Свой доспех',
      protectsAgainst: 'пули',
      drBonus: 2,
    });
  });

  it('sets an origin chosen from the picker', () => {
    const id = useCharacterStore.getState().activeId as string;
    const { nav } = makeNav<CharacterProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CharacterScreen
          navigation={nav}
          route={{ key: 'k', name: 'Character', params: { id } }}
        />,
      );
    });

    press(tree.root, 'КАРБОН');

    const character = useCharacterStore.getState().characters[0];
    expect(character.origin).toBe('carbon');
    expect(character.originBenefits).toEqual([]);
  });

  it('adds an item and grows its weight', () => {
    const id = useCharacterStore.getState().activeId as string;
    const { nav } = makeNav<CharacterProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CharacterScreen
          navigation={nav}
          route={{ key: 'k', name: 'Character', params: { id } }}
        />,
      );
    });

    press(tree.root, 'ВЕЩИ');
    press(tree.root, '+ ПРЕДМЕТ');

    const increase = tree.root.findAll(
      node => node.props?.accessibilityLabel === 'Увеличить вес',
      { deep: true },
    )[0];
    expect(increase).toBeDefined();
    act(() => {
      increase.props.onPress();
    });

    const character = useCharacterStore.getState().characters[0];
    expect(character.items).toHaveLength(1);
    expect(character.items[0].weight).toBe(2);
  });

  it('adds a void corruption picked from the list', () => {
    const id = useCharacterStore.getState().activeId as string;
    const { nav } = makeNav<CharacterProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CharacterScreen
          navigation={nav}
          route={{ key: 'k', name: 'Character', params: { id } }}
        />,
      );
    });

    press(tree.root, 'ИЗ СПИСКА');
    press(tree.root, VOID_CORRUPTIONS[0].text);

    const character = useCharacterStore.getState().characters[0];
    expect(character.voidCorruption).toContain(
      `1. ${VOID_CORRUPTIONS[0].text}`,
    );
  });

  it('shows what can be bought with experience points', () => {
    const id = useCharacterStore.getState().activeId as string;
    const { nav } = makeNav<CharacterProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CharacterScreen
          navigation={nav}
          route={{ key: 'k', name: 'Character', params: { id } }}
        />,
      );
    });

    const texts = JSON.stringify(tree.toJSON());
    expect(texts).toContain('СОВЕРШЕНСТВОВАНИЕ');
    expect(texts).toContain('3 × желаемое значение');
    expect(texts).toContain('Случайная мутация (−1 к способности)');
    expect(texts).toContain('Преимущество происхождения (макс. 2)');
    expect(texts).toContain('15 XP');
  });

  it('grows a small item count with the stepper', () => {
    const id = useCharacterStore.getState().activeId as string;
    act(() => {
      useCharacterStore.getState().updateCharacter(id, {
        smallItems: [{name: 'Шоколадный батончик', count: 3}],
      });
    });

    const { nav } = makeNav<CharacterProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CharacterScreen
          navigation={nav}
          route={{ key: 'k', name: 'Character', params: { id } }}
        />,
      );
    });

    press(tree.root, 'ВЕЩИ');
    const increase = tree.root.findAll(
      node => node.props?.accessibilityLabel === 'Больше: Шоколадный батончик',
      { deep: true },
    )[0];
    expect(increase).toBeDefined();
    act(() => {
      increase.props.onPress();
    });

    expect(useCharacterStore.getState().characters[0].smallItems).toEqual([
      {name: 'Шоколадный батончик', count: 4},
    ]);
  });

  it('opens the dice roller', () => {
    const id = useCharacterStore.getState().activeId as string;
    const { nav, calls } = makeNav<CharacterProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CharacterScreen
          navigation={nav}
          route={{ key: 'k', name: 'Character', params: { id } }}
        />,
      );
    });

    const rollButton = findByLabel(tree.root, 'Открыть броски');
    act(() => {
      rollButton.props.onPress?.();
    });
    expect(calls.navigate).toHaveBeenCalledWith('Roll', { id });
  });

  it('keeps the undo snackbar alive after deleting from the character card', () => {
    const { nav, calls } = makeNav<CharacterProps['navigation']>();
    const id = useCharacterStore.getState().addCharacter({
      ...emptyCharacter(),
      name: 'Отменённый',
    });
    const stillInRoster = (): boolean =>
      useCharacterStore.getState().characters.some(item => item.id === id);

    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CharacterScreen
          navigation={nav}
          route={{ key: 'k', name: 'Character', params: { id } }}
        />,
      );
    });

    press(tree.root, 'ЗАМЕТКИ');
    const confirmSpy = jest.spyOn(Alert, 'alert');
    press(tree.root, 'УДАЛИТЬ ПЕРСОНАЖА');
    const buttons = confirmSpy.mock.calls[0][2] ?? [];
    const destructive = buttons.find(
      button => typeof button.style === 'string' && button.style === 'destructive',
    );
    act(() => {
      destructive?.onPress?.();
    });
    expect(stillInRoster()).toBe(false);
    expect(useCharacterStore.getState().undoCharacter?.id).toBe(id);
    expect(calls.goBack).toHaveBeenCalled();

    act(() => {
      tree.unmount();
    });

    let roster!: TestRenderer.ReactTestRenderer;
    act(() => {
      roster = TestRenderer.create(
        <RosterScreen
          navigation={makeNav<RosterProps['navigation']>().nav}
          route={{ key: 'r', name: 'Roster' }}
        />,
      );
    });

    expect(collectText(roster.root)).toContain('удалён');
    const undo = findByLabel(roster.root, 'ОТМЕНИТЬ');
    act(() => {
      undo.props.onPress();
    });

    const state = useCharacterStore.getState();
    expect(stillInRoster()).toBe(true);
    expect(state.undoCharacter).toBeNull();
    expect(
      state.characters.find(item => item.id === id)?.name,
    ).toBe('Отменённый');
    confirmSpy.mockRestore();
  });

  it('adds and removes note groups on the notes tab', () => {
    const id = useCharacterStore.getState().activeId as string;
    act(() => {
      useCharacterStore.getState().updateCharacter(id, {
        noteGroups: [{id: 'n1', title: 'Цели', text: 'Отдать долг'}],
      });
    });

    const { nav } = makeNav<CharacterProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CharacterScreen
          navigation={nav}
          route={{ key: 'k', name: 'Character', params: { id } }}
        />,
      );
    });

    press(tree.root, 'ЗАМЕТКИ');
    const texts = JSON.stringify(tree.toJSON());
    expect(texts).toContain('Цели');
    expect(texts).toContain('Отдать долг');

    const titleField = tree.root.findAll(
      node =>
        typeof node.type === 'string' && node.props.placeholder === 'Цели, связи, долги…',
    )[0];
    act(() => {
      titleField.props.onChangeText('Долги');
    });
    expect(useCharacterStore.getState().characters[0].noteGroups[0]).toEqual({
      id: 'n1',
      title: 'Долги',
      text: 'Отдать долг',
    });

    const confirm = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) => {
        if (Array.isArray(buttons)) {
          buttons[1].onPress?.();
        }
      });
    pressNth(tree.root, 'УДАЛИТЬ ГРУППУ', 0);
    expect(useCharacterStore.getState().characters[0].noteGroups).toEqual([]);
    confirm.mockRestore();
  });

  it('renders a fallback when the character is missing', () => {
    const { nav } = makeNav<CharacterProps['navigation']>();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <CharacterScreen
          navigation={nav}
          route={{ key: 'k', name: 'Character', params: { id: 'нет-такого' } }}
        />,
      );
    });

    expect(JSON.stringify(tree.toJSON())).toContain('Персонаж не найден');
  });
});

describe('backup screen', () => {
  beforeEach(() => {
    storage.clearAll();
    act(() => {
      useCharacterStore.setState({
        characters: [],
        activeId: null,
        hub: null,
        undoCharacter: null,
        undoHub: null,
      });
    });
  });

  function renderData() {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <DataScreen
          navigation={makeNav<DataProps['navigation']>().nav}
          route={{ key: 'd', name: 'Data' }}
        />,
      );
    });
    return tree;
  }

  function paste(tree: TestRenderer.ReactTestRenderer, value: string) {
    const input = tree.root.findAll(
      node => typeof node.type === 'string' && node.props.multiline,
    )[0];
    act(() => {
      input.props.onChangeText(value);
    });
  }

  it('shares a copy of the roster and the hub', () => {
    useCharacterStore.getState().addCharacter({...emptyCharacter(), name: 'Вейн'});
    useCharacterStore.getState().createHub({
      ...STARTING_HUBS.starship,
      hull: 'Кольцо Рас',
    });
    const shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({action: 'sharedAction', activityType: undefined});

    const tree = renderData();
    press(tree.root, 'ПОДЕЛИТЬСЯ КОПИЕЙ');

    const parsed = JSON.parse(shareSpy.mock.calls[0][0].message as string);
    expect(parsed.app).toBe('death-in-space');
    expect(parsed.characters[0].name).toBe('Вейн');
    expect(parsed.hub.hull).toBe('Кольцо Рас');
    shareSpy.mockRestore();
  });

  it('complains about a broken paste and keeps the current data', () => {
    useCharacterStore.getState().addCharacter({...emptyCharacter(), name: 'Вейн'});
    const tree = renderData();

    paste(tree, 'привет');

    expect(collectText(tree.root)).toContain('Это не JSON');
    expect(useCharacterStore.getState().characters[0].name).toBe('Вейн');
  });

  it('previews the copy and replaces the data only after a confirmation', () => {
    useCharacterStore.getState().addCharacter({...emptyCharacter(), name: 'Лишний'});
    const backup = JSON.stringify({
      app: 'death-in-space',
      version: 1,
      characters: [{id: 'x', name: 'Вейн'}],
      hub: {type: 'station', hull: 'Тихая гавань'},
    });

    const tree = renderData();
    paste(tree, backup);
    expect(collectText(tree.root)).toContain('В копии: 1 персонаж, хаб «Тихая гавань»');

    const alertSpy = jest.spyOn(Alert, 'alert');
    press(tree.root, 'ИМПОРТИРОВАТЬ');
    expect(useCharacterStore.getState().characters[0].name).toBe('Лишний');

    const buttons = alertSpy.mock.calls[0][2] ?? [];
    act(() => {
      buttons.find(button => button.style === 'destructive')?.onPress?.();
    });

    const state = useCharacterStore.getState();
    expect(state.characters).toHaveLength(1);
    expect(state.characters[0].name).toBe('Вейн');
    expect(state.hub?.hull).toBe('Тихая гавань');
    expect(collectText(tree.root)).toContain('Импортировано: 1 персонаж');
    alertSpy.mockRestore();
  });
});
