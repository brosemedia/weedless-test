import { create } from 'zustand';

type UIState = {
  quickActionsHiddenKeys: string[];
  hideQuickActions: (key: string) => void;
  showQuickActions: (key: string) => void;
  headerAtTop: boolean;
  setHeaderAtTop: (value: boolean) => void;
  headerAccessoryHeight: number;
  setHeaderAccessoryHeight: (height: number) => void;
};

export const useUiStore = create<UIState>((set) => ({
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
}));
