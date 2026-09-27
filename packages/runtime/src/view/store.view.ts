import { createStore } from "@tanstack/react-store";

type StoreView = {
  isMobile: boolean;
};

const initialState: StoreView = {
  isMobile: false,
};

export const storeView = createStore<StoreView>(initialState);
