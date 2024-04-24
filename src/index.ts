import { useMemo, useReducer, useRef } from "react";
import type {
  ThunkAction,
  UnknownAction,
  Selector,
  ThunkDispatch,
} from "@reduxjs/toolkit";
import { bindActionCreators } from "@reduxjs/toolkit";
import {
  BoundActions,
  BoundSelectors,
  Slice,
  SliceActions,
  SliceSelectors,
} from "./types";

const id = <T>(x: T) => x;

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
    const selectors = slice.getSelectors(id);
    const result: Record<string, Selector> = {};
    for (const [key, selector] of Object.entries<Selector>(selectors)) {
      result[key] = selector.bind(null, state);
    }
    return result as any;
  }, [slice.getSelectors, state]);

  return [state, thunkDispatch, boundSelectors];
}
