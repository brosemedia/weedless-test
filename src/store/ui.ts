import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Verfügbare KPI-Typen
export type KpiType =
  | 'money'
  | 'grams'
  | 'joints'
  | 'time'
  | 'streak'
  | 'spent'
  | 'consumed'
  | 'pauses'
  | 'xp'
  | 'daysSinceConsumption'
  | 'avgMood'
  | 'avgSleep'
  | 'reactionChange'
  | 'currentMood';

// Standard KPIs
export const DEFAULT_KPIS: KpiType[] = ['money', 'grams', 'joints', 'time'];

type UIState = {
  quickActionsHiddenKeys: string[];
  hideQuickActions: (key: string) => void;
  showQuickActions: (key: string) => void;
  headerAtTop: boolean;
  setHeaderAtTop: (value: boolean) => void;
  headerAccessoryHeight: number;
  setHeaderAccessoryHeight: (height: number) => void;
  // KPI-Auswahl
  selectedKpis: KpiType[];
  setSelectedKpis: (kpis: KpiType[]) => void;
  // Haptik-Einstellungen
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
};

const uiStore = create<UIState>()(
  persist(
    (set) => ({
      quickActionsHiddenKeys: [],
      hideQuickActions: (key: string) =>
        set((state) => {
          if (state.quickActionsHiddenKeys.includes(key)) return state;
          return { quickActionsHiddenKeys: [...state.quickActionsHiddenKeys, key] };
        }),
      showQuickActions: (key: string) =>
        set((state) => ({
          quickActionsHiddenKeys: state.quickActionsHiddenKeys.filter((item) => item !== key),
        })),
      headerAtTop: false,
      setHeaderAtTop: (value) => set((state) => (state.headerAtTop === value ? state : { headerAtTop: value })),
      headerAccessoryHeight: 0,
      setHeaderAccessoryHeight: (height) =>
        set((state) => (state.headerAccessoryHeight === height ? state : { headerAccessoryHeight: height })),
      // KPI-Auswahl
      selectedKpis: DEFAULT_KPIS,
      setSelectedKpis: (kpis) => set({ selectedKpis: kpis }),
      // Haptik-Einstellungen
      hapticsEnabled: true, // Default: aktiviert
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
    }),
    {
      name: 'hazeless/ui',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        selectedKpis: state.selectedKpis,
        hapticsEnabled: state.hapticsEnabled,
      }),
    }
  )
);

// Export als Hook für Komponenten
export const useUiStore = uiStore;

// Export für direkten Zugriff ohne Hook (für Services)
export const getUiStoreState = () => uiStore.getState();
