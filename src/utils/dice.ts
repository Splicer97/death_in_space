export type ModifierMode = 'normal' | 'advantage' | 'disadvantage';

export interface RollResult {
  dice: number[];
  modifier: number;
  total: number;
  mode: ModifierMode;
  target: number | null;
  success: boolean | null;
}

export function rollDie(sides = 20): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollDice(count: number, sides = 20): number[] {
  return Array.from({ length: count }, () => rollDie(sides));
}

export function sum(dice: number[]): number {
  return dice.reduce((acc, value) => acc + value, 0);
}

/** 2d4: first roll minus second roll (ability generation, p. 12). */
export function rollAbilityValue(): {
  first: number;
  second: number;
  value: number;
} {
  const first = rollDie(4);
  const second = rollDie(4);
  return { first, second, value: first - second };
}

export function performRoll(
  modifier: number,
  mode: ModifierMode = 'normal',
  target: number | null = null,
): RollResult {
  const dice = mode === 'normal' ? [rollDie(20)] : [rollDie(20), rollDie(20)];
  const best = mode === 'advantage' ? Math.max(...dice) : Math.min(...dice);
  const total = best + modifier;
  return {
    dice,
    modifier,
    total,
    mode,
    target,
    success: target === null ? null : total >= target,
  };
}

export function formatRoll(result: RollResult): string {
  const dice = result.dice.join(' + ');
  const sign =
    result.modifier >= 0 ? `+${result.modifier}` : `${result.modifier}`;
  return `${dice} ${sign} = ${result.total}`;
}
