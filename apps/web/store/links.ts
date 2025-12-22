import { create } from "zustand";

type LinkStore = {
  selectedIds: Record<number, true>;
  isSelected: (id: number) => boolean;
  toggleSelected: (id: number) => void;
  clearSelected: () => void;
  setSelected: (ids: number[]) => void;
  selectionCount: number;
};

const useLinkStore = create<LinkStore>()((set, get) => ({
  selectedIds: {},

  isSelected: (id) => !!get().selectedIds[id],

  toggleSelected: (id) =>
    set((state) => {
      const next = { ...state.selectedIds };

      if (next[id]) {
        delete next[id];
        return { selectedIds: next, selectionCount: state.selectionCount - 1 };
      } else {
        next[id] = true;
        return { selectedIds: next, selectionCount: state.selectionCount + 1 };
      }
    }),

  clearSelected: () => set({ selectedIds: {}, selectionCount: 0 }),

  setSelected: (ids) =>
    set(() => {
      const next: Record<number, true> = {};
      for (let i = 0; i < ids.length; i++) next[ids[i]] = true;
      return { selectedIds: next, selectionCount: Object.keys(next).length };
    }),

  selectionCount: 0,
}));

export default useLinkStore;
