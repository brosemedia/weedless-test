import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GameResult = {
  id: string;
  game: string; // e.g., 'craving-tap'
  score: number;
  at: string; // ISO date
};

type GameStore = {
  results: GameResult[];
  addGameResult: (score: number, game: string) => void;
  clearGameResults: () => void;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      results: [],
      addGameResult: (score, game) =>
        set((s) => ({
          results: [
            ...s.results,
            {
              id: Math.random().toString(36).slice(2),
              game,
              score,
              at: new Date().toISOString(),
            },
          ],
        })),
      clearGameResults: () => set({ results: [] }),
    }),
    {
      name: 'weedless-game-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({ results: state.results }),
    }
  )
);

export type { GameStore };

