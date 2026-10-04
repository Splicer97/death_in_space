import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './storage';
import type { RollResult } from '../utils/dice';

const MAX_HISTORY = 12;

interface RollHistoryStore {
  history: Record<string, RollResult[]>;
  push: (characterId: string, result: RollResult) => void;
  clear: (characterId: string) => void;
}

export function createRollStore() {
  return create<RollHistoryStore>()(
    persist(
      set => ({
        history: {},

        push: (characterId, result) =>
          set(state => ({
            history: {
              ...state.history,
              [characterId]: [
                result,
                ...(state.history[characterId] ?? []),
              ].slice(0, MAX_HISTORY),
            },
          })),

        clear: characterId =>
          set(state => {
            if (!state.history[characterId]) {
              return state;
            }
            const history = { ...state.history };
            delete history[characterId];
            return { history };
          }),
      }),
      {
        name: 'roll-history',
        storage: createJSONStorage(() => mmkvStorage),
        partialize: state => ({ history: state.history }),
      },
    ),
  );
}

export const useRollStore = createRollStore();

export function selectHistory(characterId: string) {
  return (state: RollHistoryStore) => state.history[characterId] ?? [];
}
