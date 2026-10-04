import {
  abilitySum,
  availableSlots,
  defenseRating,
  energyOverdrawn,
  energyUsed,
  itemSlots,
  HUB_MAX_INTEGRITY,
  STARTING_HUBS,
  type Armor,
} from '../src/types';

describe('derived character values', () => {
  it('computes item slots as 12 + body', () => {
    expect(itemSlots(0)).toBe(12);
    expect(itemSlots(2)).toBe(14);
    expect(itemSlots(-3)).toBe(9);
  });

  it('subtracts armor slots from the free item slots', () => {
    const armor: Armor = {
      type: 'Средний бронежилет (флак)',
      protectsAgainst: 'колющее, пули',
      drBonus: 2,
      slots: 3,
    };
    expect(availableSlots(0, null)).toBe(12);
    expect(availableSlots(2, null)).toBe(14);
    expect(availableSlots(0, armor)).toBe(9);
    expect(availableSlots(2, armor)).toBe(11);
  });

  it('never reports negative free slots', () => {
    const heavy: Armor = {
      type: 'Бронекостюм',
      protectsAgainst: 'всё',
      drBonus: 4,
      slots: 40,
    };
    expect(availableSlots(-3, heavy)).toBe(0);
  });

  it('treats missing armor slots as zero', () => {
    const legacy: Armor = {
      type: 'Старый бронежилет',
      protectsAgainst: 'колющее',
      drBonus: 1,
    };
    expect(availableSlots(0, legacy)).toBe(12);
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
