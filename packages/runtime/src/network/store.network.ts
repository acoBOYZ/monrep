import { createStore } from "@tanstack/react-store";

type StoreNetwork = {
  isOnline: boolean;
};

const initialState: StoreNetwork = {
  isOnline: true,
};

export const storeNetwork = createStore<StoreNetwork>(initialState);
