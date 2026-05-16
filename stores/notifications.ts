import { create } from 'zustand';

type State = {
  newOrderIds: string[];
  newPurchaseIds: string[];
  push: (id: string) => void;
  pushPurchase: (id: string) => void;
  clear: () => void;
  clearPurchases: () => void;
};

export const useNotificationsStore = create<State>((set) => ({
  newOrderIds: [],
  newPurchaseIds: [],
  push: (id) =>
    set((s) =>
      s.newOrderIds.includes(id) ? s : { newOrderIds: [...s.newOrderIds, id] },
    ),
  pushPurchase: (id) =>
    set((s) =>
      s.newPurchaseIds.includes(id) ? s : { newPurchaseIds: [...s.newPurchaseIds, id] },
    ),
  clear: () => set({ newOrderIds: [] }),
  clearPurchases: () => set({ newPurchaseIds: [] }),
}));
