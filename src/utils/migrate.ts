import type { Item, NoteGroup, SmallItem, Weapon } from '../types';

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function count(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function normalizeItems(raw: unknown): Item[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(item => {
    const recordItem = record(item);
    return {
      id: text(recordItem?.id),
      name: text(recordItem?.name),
      condition: count(recordItem?.condition),
      weight: count(recordItem?.weight, 1),
    };
  });
}

export function normalizeWeapons(
  raw: unknown,
  fallback: [Weapon, Weapon],
): [Weapon, Weapon] {
  const list = Array.isArray(raw) ? raw : [];
  return [0, 1].map(index => {
    const recordItem = record(list[index]);
    const uses = count(recordItem?.uses);
    return {
      ...fallback[index],
      name: text(recordItem?.name),
      damage: text(recordItem?.damage),
      uses,
      maxUses: count(recordItem?.maxUses, uses),
      condition: count(recordItem?.condition),
      ammo: text(recordItem?.ammo),
    };
  }) as [Weapon, Weapon];
}

export function normalizeSmallItems(raw: unknown): SmallItem[] {
  const collect = (
    name: string,
    amount: number,
    state?: unknown,
  ): SmallItem | null => {
    const trimmed = name.trim();
    const total = Math.max(1, Math.round(amount) || 1);
    if (!trimmed) {
      return null;
    }
    const condition = count(state);
    return condition > 0
      ? { name: trimmed, count: total, condition }
      : { name: trimmed, count: total };
  };
  if (Array.isArray(raw)) {
    return raw
      .map(item => {
        if (typeof item === 'string') {
          return collect(item, 1);
        }
        const entry = record(item);
        if (!entry) {
          return null;
        }
        return collect(
          text(entry.name),
          count(entry.count, 1),
          entry.condition,
        );
      })
      .filter((item): item is SmallItem => item !== null);
  }
  if (typeof raw === 'string') {
    return raw
      .split(/\r?\n+/)
      .map(item => collect(item, 1))
      .filter((item): item is SmallItem => item !== null);
  }
  return [];
}

export function normalizeNoteGroups(raw: unknown): NoteGroup[] {
  if (Array.isArray(raw)) {
    return raw
      .map((group, index) => {
        const entry = record(group);
        if (!entry) {
          return null;
        }
        const title = text(entry.title).trim();
        const body = text(entry.text);
        return {
          id: text(entry.id) || `g${index}`,
          title: title || 'Без названия',
          text: body,
        };
      })
      .filter((group): group is NoteGroup => group !== null);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return [{ id: 'g0', title: 'Общие', text: raw }];
  }
  return [];
}
