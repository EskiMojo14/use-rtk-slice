import { Reducer, useMemo, useReducer, useRef } from "react";
import type {
  ThunkAction,
  UnknownAction,
  Selector,
  ThunkDispatch,
} from "@reduxjs/toolkit";
import { bindActionCreators } from "@reduxjs/toolkit";
import type {
  BoundActions,
  BoundSelectors,
  Slice,
  SliceActions,
  SliceSelectors,
} from "./types";

export type { SliceBoundActions, SliceBoundSelectors } from "./types";

const id = <T>(x: T) => x;

/**
 * A wrapper over `useReducer` that keeps an up to date reference to the state.
 *
 * This allows thunks to receive the newest state when they call `getState()`.
 */
function useRefReducer<State>(
  reducer: Reducer<State, UnknownAction>,
  initialState: State,
  initialActions: Array<UnknownAction> = [],
) {
  const ref = useRef(initialState);
  const refReducer: typeof reducer = (state, action) =>
    (ref.current = reducer(state, action));
  const [state, dispatch] = useReducer(
    refReducer,
    ref.current,
    (initialState) => initialActions.reduce(refReducer, initialState),
  );
  return [state, dispatch, ref] as const;
}

export function useSlice<
  State,
  Actions extends SliceActions<State>,
  Selectors extends SliceSelectors<State>,
>(
  slice: Slice<State, Actions, Selectors>,
  initialState?: State,
  initialActions?: Array<UnknownAction>,
): [
  state: State,
  dispatch: ThunkDispatch<State, void, UnknownAction> &
    BoundActions<State, Actions>,
  selectors: BoundSelectors<State, Selectors>,
] {
  const [state, reactDispatch, stateRef] = useRefReducer(
    slice.reducer,
    typeof initialState === "undefined"
      ? slice.getInitialState()
      : initialState,
    initialActions,
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
