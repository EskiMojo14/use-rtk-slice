import type { UnknownAction, Selector, Dispatch } from "@reduxjs/toolkit";
import { bindActionCreators } from "@reduxjs/toolkit";
import { useDebugValue, useMemo } from "react";
import type {
  BoundSelectors,
  Slice,
  SliceActions,
  SliceSelectors,
} from "./types";
import { useReducerWithDevtools } from "use-reducer-devtools";

export type { SliceBoundSelectors } from "./types";

export const id = <T>(x: T) => x;

export function useSlice<
  State extends NonNullable<unknown> | null,
  Actions extends SliceActions,
  Selectors extends SliceSelectors<State>,
>(
  slice: Slice<State, Actions, Selectors>,
  initialState?: State,
  initialActions: Array<UnknownAction> = [],
): [
  selectors: BoundSelectors<State, Selectors>,
  dispatch: Dispatch & Actions,
  state: State,
] {
  const [state, reactDispatch] = useReducerWithDevtools(
    slice.reducer,
    () =>
      initialActions.reduce(
        slice.reducer,
        typeof initialState === "undefined"
          ? slice.getInitialState()
          : initialState,
      ),
    { name: `useSlice(${slice.name})`, actionCreators: slice.actions },
  );

  const dispatch = useMemo(() => {
    const dispatch: Dispatch = (action) => (reactDispatch(action), action); // dispatch the action and return it
    return Object.assign(dispatch, bindActionCreators(slice.actions, dispatch));
  }, [slice.actions]);

  const unboundSelectors = useMemo(
    () => slice.getSelectors(id),
    [slice.getSelectors],
  );

  const boundSelectors = useMemo((): BoundSelectors<State, Selectors> => {
    const result: Record<string, Selector> = {};
    for (const [key, selector] of Object.entries<Selector>(unboundSelectors)) {
      result[key] = selector.bind(null, state);
    }
    return result as any;
  }, [unboundSelectors, state]);

  useDebugValue(state);

  return [boundSelectors, dispatch, state];
}
