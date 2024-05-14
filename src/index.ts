import type { UnknownAction, Selector, Dispatch } from "@reduxjs/toolkit";
import { bindActionCreators } from "@reduxjs/toolkit";
import { useDebugValue, useMemo } from "react";
import type { DevtoolsConfig } from "use-reducer-devtools";
import {
  useReducerWithDevtools,
  useReducerWithLazyState,
  useReducerWithProdDevtools,
} from "use-reducer-devtools";
import type {
  BoundSelectors,
  NotUndefined,
  Slice,
  SliceActions,
  SliceSelectors,
} from "./types";

export type { SliceBoundSelectors } from "./types";

export const id = <T>(x: T) => x;

interface UseSliceConfig<State extends NotUndefined> {
  /**
   * Initial state for the reducer.
   * If not provided, the slice's initial state will be used.
   */
  initialState?: State;
  /**
   * Actions to be applied when calculating an initial state.
   * Will not be recorded in the devtools.
   */
  initialActions?: Array<UnknownAction>;
  /**
   * Configuration for the devtools integration.
   */
  devTools?: DevtoolsConfig<State, UnknownAction>;
}

function makeUseSlice(useReducer: typeof useReducerWithDevtools) {
  return function useSlice<
    State extends NotUndefined,
    Actions extends SliceActions,
    Selectors extends SliceSelectors<State>,
  >(
    slice: Slice<State, Actions, Selectors>,
    { initialState, initialActions = [], devTools }: UseSliceConfig<State> = {},
  ): [
    selectors: BoundSelectors<State, Selectors>,
    dispatch: Dispatch & Actions,
    state: State,
  ] {
    const [state, reactDispatch] = useReducer(
      slice.reducer,
      () =>
        initialActions.reduce<State>(
          slice.reducer,
          typeof initialState === "undefined"
            ? slice.getInitialState()
            : initialState,
        ),
      {
        name: `useSlice(${slice.name})`,
        ...devTools,
        actionCreators: { ...slice.actions, ...devTools?.actionCreators },
      },
    );

    const dispatch = useMemo(() => {
      const dispatch: Dispatch = (action) => (reactDispatch(action), action); // dispatch the action and return it
      return Object.assign(
        dispatch,
        bindActionCreators(slice.actions, dispatch),
      );
    }, [slice.actions]);

    const unboundSelectors = useMemo(
      () => slice.getSelectors(id),
      [slice.getSelectors],
    );

    const boundSelectors = useMemo((): BoundSelectors<State, Selectors> => {
      const result: Record<string, Selector> = {};
      for (const [key, selector] of Object.entries<Selector>(
        unboundSelectors,
      )) {
        result[key] = selector.bind(null, state);
      }
      return result as never;
    }, [unboundSelectors, state]);

    useDebugValue(state);

    return [boundSelectors, dispatch, state];
  };
}

export const useSlice = makeUseSlice(useReducerWithDevtools);

export const useSliceWithProdDevtools = makeUseSlice(
  useReducerWithProdDevtools,
);

export const useSliceWithoutDevtools = makeUseSlice(useReducerWithLazyState);
