import { Reducer, useMemo, useReducer, useRef } from "react";
import type { UnknownAction, Selector, Dispatch } from "@reduxjs/toolkit";
import { bindActionCreators } from "@reduxjs/toolkit";
import type {
  BoundSelectors,
  Slice,
  SliceActions,
  SliceSelectors,
} from "./types";

export type { SliceBoundSelectors } from "./types";

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
  Actions extends SliceActions,
  Selectors extends SliceSelectors<State>,
>(
  slice: Slice<State, Actions, Selectors>,
  initialState?: State,
  initialActions?: Array<UnknownAction>,
): [
  state: State,
  dispatch: Dispatch & Actions,
  selectors: BoundSelectors<State, Selectors>,
] {
  const [state, reactDispatch, stateRef] = useRefReducer(
    slice.reducer,
    typeof initialState === "undefined"
      ? slice.getInitialState()
      : initialState,
    initialActions,
  );

  const dispatch = useMemo(() => {
    const dispatch: Dispatch = (action) => (reactDispatch(action), action); // dispatch the action and return it
    return Object.assign(dispatch, bindActionCreators(slice.actions, dispatch));
  }, [slice.actions]);

  const boundSelectors = useMemo((): BoundSelectors<State, Selectors> => {
    const selectors = slice.getSelectors(id);
    const result: Record<string, Selector> = {};
    for (const [key, selector] of Object.entries<Selector>(selectors)) {
      result[key] = selector.bind(null, state);
    }
    return result as any;
  }, [slice.getSelectors, state]);

  return [state, dispatch, boundSelectors];
}
