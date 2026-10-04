import { STARTING_HUBS, type Character, type Hub } from '../src/types';
import { emptyCharacter } from '../src/store/characterStore';
import { characterToText, hubToText } from '../src/utils/sheetText';

function sampleCharacter(): Character {
  return {
    ...emptyCharacter(),
    id: 'c1',
    createdAt: 1,
    updatedAt: 1,
    name: 'Вейн',
    nickname: 'Искра',
    playerName: 'Аня',
    origin: 'carbon',
    abilities: { body: 1, dexterity: 0, savvy: -1, tech: 2 },
    hp: 4,
    hpMax: 6,
    holos: 350,
    debt: 500,
    background: 'Лунный преступник',
    trait: 'Неудержимый',
    drive: 'Месть',
    noteGroups: [{ id: 'g1', title: 'Цели', text: 'Ищет брата' }],
    items: [
      { id: 'i1', name: 'Дробовик', condition: 3 },
      { id: 'i2', name: 'Плазменный нож', condition: 2 },
    ],
    smallItems: [
      { name: 'Кружка', count: 1 },
      { name: 'Шоколадный батончик', count: 3 },
    ],
    weapons: [
      {
        name: 'Импульсный пистолет',
        damage: '1d6',
        uses: 3,
        maxUses: 12,
        condition: 2,
        ammo: '1d4×10 · 40/40',
      },
      { name: '', damage: '', uses: 0, maxUses: 0, condition: 0, ammo: '' },
    ],
  };
}

describe('character sheet export', () => {
  it('includes the name, origin and player', () => {
    const text = characterToText(sampleCharacter());

    expect(text).toContain('Вейн');
    expect(text).toContain('Прозвище: Искра');
    expect(text).toContain('Аня');
  });

  it('lists small items with their counts', () => {
    const text = characterToText(sampleCharacter());

    expect(text).toContain('Мелочи: Кружка, Шоколадный батончик ×3');
  });

  it('signs abilities and shows health and defense', () => {
    const text = characterToText(sampleCharacter());

    expect(text).toContain('Тел: +1');
    expect(text).toContain('Рас: -1');
    expect(text).toContain('Тех: +2');
    expect(text).toContain('ОЗ: 4/6');
    expect(text).toContain('УЗ: 12');
  });

  it('lists items with their condition', () => {
    const text = characterToText(sampleCharacter());

    expect(text).toContain('Дробовик — состояние 3');
    expect(text).toContain('Плазменный нож — состояние 2');
    expect(text).toContain('Слоты предметов: 13/13');
  });

  it('lists weapon charges as current/maximum', () => {
    const text = characterToText(sampleCharacter());

    expect(text).toContain('Импульсный пистолет (1d6)');
    expect(text).toContain('заряды 3/12');
    expect(text).toContain('патроны: 1d4×10 · 40/40');
  });

  it('omits condition for items without tracking', () => {
    const text = characterToText({
      ...sampleCharacter(),
      items: [{ id: 'i1', name: 'Скафандр', condition: 0 }],
    });

    expect(text).toContain('• Скафандр');
    expect(text).not.toContain('состояние 0');
  });

  it('keeps currency and note groups', () => {
    const text = characterToText(sampleCharacter());

    expect(text).toContain('Гало: 350');
    expect(text).toContain('Долг: 500');
    expect(text).toContain('ЗАМЕТКИ — Цели');
    expect(text).toContain('Ищет брата');
  });

  it('skips empty sections', () => {
    const text = characterToText({
      ...sampleCharacter(),
      name: 'Пустой',
      noteGroups: [],
      background: '',
      items: [],
    });

    expect(text).toContain('Пустой');
    expect(text).not.toContain('ЗАМЕТКИ');
    expect(text).not.toContain('undefined');
  });
});

function sampleHub(overrides: Partial<Hub> = {}): Hub {
  return {
    ...STARTING_HUBS.starship,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('hub sheet export', () => {
  it('includes type, energy budget and modules', () => {
    const text = hubToText(
      sampleHub({
        hull: 'Кольцо Рас',
        energySource: 'Реактор диамагнитного синтеза',
        energyOutput: 6,
        modules: [
          { id: 'm1', name: 'Бар', energy: 1 },
          { id: 'm2', name: 'Сейф', energy: 2 },
        ],
      }),
    );
    expect(text).toContain('Кольцо Рас');
    expect(text).toContain('Тип: звездолёт');
    expect(text).toContain('Выходная мощность: 3/6 ВМ');
    expect(text).toContain('• Бар — 1 ВМ');
    expect(text).toContain('• Сейф — 2 ВМ');
  });

  it('marks a station and starts with no modules', () => {
    const text = hubToText(sampleHub({ ...STARTING_HUBS.station }));

    expect(text).toContain('Станция');
    expect(text).toContain('Тип: станция');
    expect(text).toContain('Выходная мощность: 0/3 ВМ');
    expect(text).not.toContain('• ');
  });
});
