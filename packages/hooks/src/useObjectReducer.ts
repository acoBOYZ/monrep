import { useCallback, useReducer, useRef } from "react";

type Updater<TValue> = TValue | ((prev: TValue) => TValue);
type FieldUpdaters<T extends object> = { [TKey in keyof T]?: Updater<T[TKey]> };

type SetAction<T extends object, TKey extends keyof T> = {
  type: "set";
  key: TKey;
  value: Updater<T[TKey]>;
};

type AssignAction<T extends object> = {
  type: "assign";
  value: FieldUpdaters<T>;
};

type ResetAction<T extends object> = {
  type: "reset";
  base: T;
  value?: FieldUpdaters<T>;
};

type Action<T extends object> =
  | { [TKey in keyof T]: SetAction<T, TKey> }[keyof T]
  | AssignAction<T>
  | ResetAction<T>;

type ObjectReducerSet<T extends object> = <TKey extends keyof T>(
  key: TKey,
  value: Updater<T[TKey]>,
) => void;

type ObjectReducerAssign<T extends object> = (value: FieldUpdaters<T>) => void;
type ObjectReducerReset<T extends object> = (value?: FieldUpdaters<T>) => void;

type ObjectReducerTuple<T extends object> = {
  state: T;
  set: ObjectReducerSet<T>;
  assign: ObjectReducerAssign<T>;
  reset: ObjectReducerReset<T>;
};

function isUpdaterFunction<TValue>(u: Updater<TValue>): u is (prev: TValue) => TValue {
  return typeof u === "function";
}

function resolveUpdater<TValue>(updater: Updater<TValue>, prev: TValue): TValue {
  return isUpdaterFunction(updater) ? updater(prev) : updater;
}

function objectReducer<T extends object>(state: T, action: Action<T>): T {
  switch (action.type) {
    case "set": {
      const key = action.key;
      const nextValue = resolveUpdater(action.value, state[key]);

      if (Object.is(state[key], nextValue)) return state;
      return { ...state, [key]: nextValue };
    }

    case "assign": {
      const updates = action.value;
      let changed = false;
      const nextState: T = { ...state };

      for (const key in updates) {
        const updater = updates[key];
        if (updater === undefined) continue;

        const nextValue = resolveUpdater(updater as Updater<T[typeof key]>, state[key]);

        if (!Object.is(state[key], nextValue)) {
          nextState[key] = nextValue;
          changed = true;
        }
      }

      return changed ? nextState : state;
    }

    case "reset": {
      const base = action.base;
      const updates = action.value;

      if (!updates) return base;

      let changed = false;
      const nextState: T = { ...base };

      for (const key in updates) {
        const updater = updates[key];
        if (updater === undefined) continue;

        const nextValue = resolveUpdater(updater as Updater<T[typeof key]>, state[key]);

        if (!Object.is(nextState[key], nextValue)) {
          nextState[key] = nextValue;
          changed = true;
        }
      }

      return changed ? nextState : state;
    }

    default:
      return state;
  }
}

export function useObjectReducer<T extends object>(initialState: T): ObjectReducerTuple<T> {
  const initialRef = useRef(initialState);

  const [state, dispatch] = useReducer(objectReducer<T>, initialState);

  const set = useCallback<ObjectReducerSet<T>>(
    (key, value) => dispatch({ type: "set", key, value } as Action<T>),
    [],
  );

  const assign = useCallback<ObjectReducerAssign<T>>(
    (value) => dispatch({ type: "assign", value }),
    [],
  );

  const reset = useCallback<ObjectReducerReset<T>>(
    (value) => dispatch({ type: "reset", value, base: initialRef.current }),
    [],
  );

  return { state, set, assign, reset } as const;
}
