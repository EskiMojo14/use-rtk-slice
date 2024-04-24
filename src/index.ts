import { useMemo, useReducer, useRef } from "react";
import type {
  ThunkAction,
  UnknownAction,
  Selector,
  Reducer,
  ThunkDispatch,
} from "@reduxjs/toolkit";
import { bindActionCreators } from "@reduxjs/toolkit";

type Compute<T> = { [K in keyof T]: T[K] } & unknown;

type SliceActions<State> = Record<
  string,
  (
    ...args: any[]
  ) => ThunkAction<any, State, void, UnknownAction> | UnknownAction
>;

type BoundActions<Actions extends SliceActions<any>> = Compute<{
  [K in keyof Actions]: Actions[K] extends (...args: infer A) => infer R
    ? R extends ThunkAction<infer T, any, any, any>
      ? (...args: A) => T
      : (...args: A) => R
    : never;
}>;

type SliceSelectors<State> = Record<string, Selector<State>>;

type BoundSelectors<State, Selectors extends SliceSelectors<any>> = Compute<{
  [K in keyof Selectors]: Selectors[K] extends Selector<
    State,
    infer Result,
    infer Args
  >
    ? (...args: Args) => Result
    : never;
}>;

type BivariantSelector<S extends Selector> =
  S extends Selector<infer State, infer Result, infer Args>
    ? {
        bivarianceHack(state: State, ...args: Args): Result;
      }["bivarianceHack"]
    : never;

interface Slice<
  State,
  Actions extends SliceActions<State>,
  Selectors extends SliceSelectors<State>,
> {
  getInitialState: () => State;
  reducer: Reducer<State, UnknownAction>;
  actions: Actions;
  getSelectors(): {
    [K in keyof Selectors]: BivariantSelector<Selectors[K]> & {
      unwrapped: Selectors[K];
    };
  };
}

export function useSlice<
  State,
  Actions extends SliceActions<State>,
  Selectors extends SliceSelectors<State>,
>(
  slice: Slice<State, Actions, Selectors>,
): [
  state: State,
  dispatch: ThunkDispatch<State, void, UnknownAction> & BoundActions<Actions>,
  selectors: BoundSelectors<State, Selectors>,
] {
  const stateRef = useRef(slice.getInitialState());

  const [state, reactDispatch] = useReducer<Reducer<State, UnknownAction>>(
    (state, action) => (stateRef.current = slice.reducer(state, action)),
    stateRef.current,
  );

  const thunkDispatch = useMemo((): ThunkDispatch<State, void, UnknownAction> &
    BoundActions<Actions> => {
    const thunkDispatch = (
      action: UnknownAction | ThunkAction<any, State, void, UnknownAction>,
    ) =>
      typeof action === "function"
        ? action(thunkDispatch, () => stateRef.current)
        : (reactDispatch(action), action); // dispatch the action and return it
    return Object.assign(
      thunkDispatch,
      bindActionCreators(slice.actions, thunkDispatch),
    ) as any;
  }, [slice.actions]);

  const boundSelectors = useMemo((): BoundSelectors<State, Selectors> => {
    const selectors = slice.getSelectors();
    const result: Record<string, Selector> = {};
    for (const [key, selector] of Object.entries(selectors)) {
      result[key] = (...args) => selector(stateRef.current, ...args);
    }
    return result as any;
  }, [slice.getSelectors]);

  return [state, thunkDispatch, boundSelectors];
}
