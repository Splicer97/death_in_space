import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';

import { storage } from './storage';
import type { Character, CharacterDraft, Hub, HubDraft } from '../types';

const mmkvAdapter: StateStorage = {
  getItem: name => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: name => storage.remove(name),
};

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
    smallItems: '',
    weapons: [
      { name: '', damage: '', uses: 0, condition: 0 },
      { name: '', damage: '', uses: 0, condition: 0 },
    ],
    armor: null,
    holos: 0,
    debt: 0,
    startingKit: '',
    trinket: '',
    startingBonus: '',
    notes: '',
  };
}

export interface CharacterStore {
  characters: Character[];
  activeId: string | null;
  hub: Hub | null;
  addCharacter: (draft: CharacterDraft) => string;
  updateCharacter: (id: string, patch: Partial<Character>) => void;
  removeCharacter: (id: string) => void;
  setActive: (id: string | null) => void;
  createHub: (draft: HubDraft) => void;
  updateHub: (patch: Partial<Hub>) => void;
  removeHub: () => void;
}

export function createCharacterStore() {
  return create<CharacterStore>()(
    persist(
      set => ({
        characters: [],
        activeId: null,
        hub: null,

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
            const characters = state.characters.filter(item => item.id !== id);
            return {
              characters,
              activeId: state.activeId === id ? null : state.activeId,
            };
          });
        },

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

        removeHub: () => set({ hub: null }),
      }),
      {
        name: 'characters',
        version: 1,
        storage: createJSONStorage(() => mmkvAdapter),
        partialize: state => ({
          characters: state.characters,
          activeId: state.activeId,
          hub: state.hub,
        }),
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
