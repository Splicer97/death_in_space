import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './storage';
import {
  normalizeItems,
  normalizeNoteGroups,
  normalizeSmallItems,
  normalizeWeapons,
} from '../utils/migrate';
import type { Character, CharacterDraft, Hub, HubDraft } from '../types';

let counter = 0;

export function newId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function emptyCharacter(): CharacterDraft {
  return {
    playerName: '',
    name: '',
    nickname: '',
    origin: null,
    originBenefits: [],
    xp: 0,
    background: '',
    pastAllegiance: '',
    trait: '',
    drive: '',
    looks: '',
    portrait: '🛸',
    abilities: { body: 0, dexterity: 0, savvy: 0, tech: 0 },
    hp: 0,
    hpMax: 0,
    voidPoints: 0,
    mutations: [],
    voidCorruption: [],
    lifeSupport: 7,
    items: [],
    smallItems: [],
    weapons: [
      { name: '', damage: '', uses: 0, maxUses: 0, condition: 0, ammo: '' },
      { name: '', damage: '', uses: 0, maxUses: 0, condition: 0, ammo: '' },
    ],
    armor: null,
    holos: 0,
    debt: 0,
    startingKit: '',
    trinket: '',
    startingBonus: '',
    noteGroups: [],
  };
}

export interface CharacterStore {
  characters: Character[];
  activeId: string | null;
  hub: Hub | null;
  undoCharacter: Character | null;
  undoHub: Hub | null;
  undoRemove: () => void;
  clearUndo: () => void;
  addCharacter: (draft: CharacterDraft) => string;
  updateCharacter: (id: string, patch: Partial<Character>) => void;
  removeCharacter: (id: string) => void;
  restoreCharacter: (character: Character) => void;
  setActive: (id: string | null) => void;
  createHub: (draft: HubDraft) => void;
  updateHub: (patch: Partial<Hub>) => void;
  removeHub: () => void;
  importBackup: (payload: {
    characters: Character[];
    activeId: string | null;
    hub: Hub | null;
  }) => void;
}

export function createCharacterStore() {
  return create<CharacterStore>()(
    persist(
      set => ({
        characters: [],
        activeId: null,
        hub: null,
        undoCharacter: null,
        undoHub: null,

        addCharacter: draft => {
          const now = Date.now();
          const character: Character = {
            ...draft,
            id: newId(),
            createdAt: now,
            updatedAt: now,
          };
          set(state => ({
            characters: [character, ...state.characters],
            activeId: character.id,
          }));
          return character.id;
        },

        updateCharacter: (id, patch) => {
          set(state => ({
            characters: state.characters.map(character =>
              character.id === id
                ? { ...character, ...patch, updatedAt: Date.now() }
                : character,
            ),
          }));
        },

        removeCharacter: id => {
          set(state => {
            const removed = state.characters.find(item => item.id === id);
            const characters = state.characters.filter(item => item.id !== id);
            return {
              characters,
              activeId: state.activeId === id ? null : state.activeId,
              undoCharacter: removed ?? null,
            };
          });
        },

        restoreCharacter: character => {
          set(state => {
            if (state.characters.some(item => item.id === character.id)) {
              return state;
            }
            return {
              characters: [character, ...state.characters],
              activeId: character.id,
            };
          });
        },

        undoRemove: () =>
          set(state => {
            if (state.undoCharacter) {
              const character = state.undoCharacter;
              const characters = state.characters.some(
                item => item.id === character.id,
              )
                ? state.characters
                : [character, ...state.characters];
              return {
                characters,
                activeId: character.id,
                undoCharacter: null,
                undoHub: null,
              };
            }
            if (state.undoHub) {
              return { hub: state.undoHub, undoHub: null, undoCharacter: null };
            }
            return state;
          }),

        clearUndo: () => set({ undoCharacter: null, undoHub: null }),

        setActive: id => set({ activeId: id }),

        createHub: draft => {
          const now = Date.now();
          set({ hub: { ...draft, createdAt: now, updatedAt: now } });
        },

        updateHub: patch => {
          set(state =>
            state.hub
              ? { hub: { ...state.hub, ...patch, updatedAt: Date.now() } }
              : state,
          );
        },

        removeHub: () =>
          set(state => ({
            hub: null,
            undoHub: state.hub,
            undoCharacter: null,
          })),

        importBackup: payload =>
          set({
            characters: payload.characters,
            activeId: payload.activeId,
            hub: payload.hub,
            undoCharacter: null,
            undoHub: null,
          }),
      }),
      {
        name: 'characters',
        version: 5,
        storage: createJSONStorage(() => mmkvStorage),
        partialize: state => ({
          characters: state.characters,
          activeId: state.activeId,
          hub: state.hub,
        }),
        migrate: persisted => {
          const saved = persisted as {
            characters?: unknown[];
          } | null;
          if (!Array.isArray(saved?.characters)) {
            return persisted as object;
          }
          const blankWeapons = emptyCharacter().weapons;
          return {
            ...saved,
            characters: saved.characters.map(raw => {
              const character = (raw ?? {}) as Record<string, unknown>;
              return {
                ...character,
                items: normalizeItems(character.items),
                smallItems: normalizeSmallItems(character.smallItems),
                weapons: normalizeWeapons(character.weapons, blankWeapons),
                noteGroups: normalizeNoteGroups(
                  character.noteGroups ?? character.notes,
                ),
              };
            }),
          };
        },
        merge: (persisted, current) => {
          const saved = (persisted ?? {}) as Partial<CharacterStore>;
          return {
            ...current,
            characters: saved.characters ?? current.characters,
            activeId: saved.activeId ?? null,
            hub: saved.hub ?? null,
          };
        },
      },
    ),
  );
}

export const useCharacterStore = createCharacterStore();

export function selectCharacter(id: string | null) {
  return (state: CharacterStore) =>
    id ? state.characters.find(character => character.id === id) : undefined;
}
