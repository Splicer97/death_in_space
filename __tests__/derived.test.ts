import {
  abilitySum,
  armorSlots,
  defenseRating,
  energyOverdrawn,
  energyUsed,
  itemSlots,
  occupiedSlots,
  HUB_MAX_INTEGRITY,
  STARTING_HUBS,
  type Armor,
} from '../src/types';
import { emptyCharacter } from '../src/store/characterStore';

describe('derived character values', () => {
  it('computes item slots as 12 + body', () => {
    expect(itemSlots(0)).toBe(12);
    expect(itemSlots(2)).toBe(14);
    expect(itemSlots(-3)).toBe(9);
  });

  it('reads armor slots with a zero fallback', () => {
    expect(armorSlots(null)).toBe(0);
    expect(
      armorSlots({ type: 'Старый', protectsAgainst: 'колющее', drBonus: 1 }),
    ).toBe(0);
    expect(
      armorSlots({
        type: 'Средний',
        protectsAgainst: 'пули',
        drBonus: 2,
        slots: 3,
      }),
    ).toBe(3);
  });

  it('counts items, weapons and armor as occupied slots', () => {
    const character = emptyCharacter();
    character.items = [
      { id: 'i1', name: 'A', condition: 0, weight: 2 },
      { id: 'i2', name: 'B', condition: 0, weight: 1 },
    ];
    character.weapons = [
      { name: 'Пистолет', damage: '1d6', uses: 0, condition: 0, slots: 2 },
      { name: 'Нож', damage: '1d4', uses: 0, condition: 0, slots: 1 },
    ];
    character.armor = {
      type: 'Средний бронежилет',
      protectsAgainst: 'пули',
      drBonus: 2,
      slots: 3,
    };

    expect(occupiedSlots(character)).toBe(9);
  });

  it('computes unarmored defense rating as 12 + dexterity', () => {
    expect(defenseRating(0, null)).toBe(12);
    expect(defenseRating(3, null)).toBe(15);
    expect(defenseRating(-2, null)).toBe(10);
  });

  it('adds the armor DR bonus', () => {
    const armor: Armor = {
      type: 'Средний бронежилет (флак)',
      protectsAgainst: 'колющее, пули',
      drBonus: 2,
    };
    expect(defenseRating(1, armor)).toBe(15);
  });

  it('sums abilities', () => {
    expect(abilitySum({ body: 1, dexterity: 0, savvy: -1, tech: 1 })).toBe(1);
  });
});

describe('hub energy budget', () => {
  it('sums energy cost of installed modules', () => {
    expect(energyUsed([])).toBe(0);
    expect(
      energyUsed([
        { id: 'a', name: 'Модуль связи', energy: 2 },
        { id: 'b', name: 'Дополнительный грузовой трюм', energy: 3 },
      ]),
    ).toBe(5);
  });

  it('detects an overdraw against hub output', () => {
    const modules = [{ id: 'a', name: 'Кухня', energy: 4 }];
    expect(energyOverdrawn(modules, 4)).toBe(false);
    expect(energyOverdrawn(modules, 5)).toBe(false);
    expect(energyOverdrawn(modules, 3)).toBe(true);
    expect(energyOverdrawn([], 0)).toBe(false);
  });

  it('starts a starship with the book defaults', () => {
    const hub = STARTING_HUBS.starship;
    expect(hub.type).toBe('starship');
    expect(hub.defenseRating).toBe(11);
    expect(hub.conditionMax).toBe(5);
    expect(hub.fuelMax).toBe(6);
    expect(hub.integrity).toBe(HUB_MAX_INTEGRITY);
    expect(energyUsed(hub.modules)).toBe(0);
    expect(energyOverdrawn(hub.modules, hub.energyOutput)).toBe(false);
  });
});
