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

type BoundActions<State, Actions extends SliceActions<State>> = Compute<{
  [K in keyof Actions]: Actions[K] extends (...args: infer A) => infer R
    ? R extends ThunkAction<infer T, State, void, UnknownAction>
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

interface Slice<
  State,
  Actions extends SliceActions<State>,
  Selectors extends SliceSelectors<State>,
> {
  getInitialState: () => State;
  reducer: (state: State, action: UnknownAction) => State; // unlike the Redux version of Reducer, this one will never be called with undefined
  actions: Actions;
  getSelectors(arg: never): Selectors;
}

export function useSlice<
  State,
  Actions extends SliceActions<State>,
  Selectors extends SliceSelectors<State>,
>(
  slice: Slice<State, Actions, Selectors>,
): [
  state: State,
  dispatch: ThunkDispatch<State, void, UnknownAction> &
    BoundActions<State, Actions>,
  selectors: BoundSelectors<State, Selectors>,
] {
  const stateRef = useRef(slice.getInitialState());

  const [state, reactDispatch] = useReducer<typeof slice.reducer>(
    (state, action) => (stateRef.current = slice.reducer(state, action)),
    stateRef.current,
  );

  const thunkDispatch = useMemo((): ThunkDispatch<State, void, UnknownAction> &
    BoundActions<State, Actions> => {
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
    const selectors = slice.getSelectors(undefined as never);
    const result: Record<string, Selector> = {};
    for (const [key, selector] of Object.entries<Selector>(selectors)) {
      result[key] = selector.bind(null, state);
    }
    return result as any;
  }, [slice.getSelectors, state]);

  return [state, thunkDispatch, boundSelectors];
}
