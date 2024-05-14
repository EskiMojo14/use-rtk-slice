import type { UnknownAction, Selector, Dispatch } from "@reduxjs/toolkit";
import { bindActionCreators } from "@reduxjs/toolkit";
import { useDebugValue, useMemo } from "react";
import type { DevtoolsConfig } from "use-reducer-devtools";
import {
  useReducerWithDevtools,
  useReducerWithLazyState,
} from "use-reducer-devtools";
import type {
  BoundSelectors,
  Slice,
  SliceActions,
  SliceSelectors,
} from "./types";

export type { SliceBoundSelectors } from "./types";

export const id = <T>(x: T) => x;

interface UseSliceConfig<State> {
  initialActions?: Array<UnknownAction>;
  devTools?: DevtoolsConfig<State, UnknownAction>;
}

function makeUseSlice(useReducer: typeof useReducerWithDevtools) {
  return function useSlice<
    State extends NonNullable<unknown> | null,
    Actions extends SliceActions,
    Selectors extends SliceSelectors<State>,
  >(
    slice: Slice<State, Actions, Selectors>,
    initialState?: State,
    { initialActions = [], devTools }: UseSliceConfig<State> = {},
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

export const useSliceWithoutDevtools = makeUseSlice(useReducerWithLazyState);
