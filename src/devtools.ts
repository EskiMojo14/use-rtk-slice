import type { Config } from "@redux-devtools/extension";
import type { Action } from "@reduxjs/toolkit";
import type { Reducer } from "react";
import { useReducer, useRef, useEffect } from "react";

type ConnectResponse = ReturnType<
  NonNullable<typeof window.__REDUX_DEVTOOLS_EXTENSION__>["connect"]
>;

const withActions =
  <S, A extends Action>(
    reducer: Reducer<S, A>,
  ): Reducer<{ state: S; actions: Array<[A, S]> }, A> =>
  (state, action) => {
    const nextState = reducer(state.state, action);
    return {
      state: nextState,
      actions: [...state.actions, [action, nextState]],
    };
  };

let instanceId = 5000;
function getInstanceId(configId?: number) {
  return configId ?? instanceId++;
}

export function useReducerWithDevtools<S, A extends Action>(
  reducer: Reducer<S, A>,
  initialState: S,
  config: Config & { instanceId?: number } = {},
) {
  const instanceIdRef = useRef<number>();
  if (instanceIdRef.current === undefined) {
    instanceIdRef.current = getInstanceId(config.instanceId);
  }
  const connectionRef = useRef<ConnectResponse>();
  if (!!window.__REDUX_DEVTOOLS_EXTENSION__ && !connectionRef.current) {
    connectionRef.current = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
      ...config,
      // @ts-expect-error undocumented
      instanceId: instanceIdRef.current,
    });
    connectionRef.current.init(initialState);
  }
  const [{ state, actions }, dispatch] = useReducer(withActions(reducer), {
    state: initialState,
    actions: [],
  });
  useEffect(() => {
    if (connectionRef.current) {
      let history = actions.shift();
      while (history) {
        connectionRef.current.send(history[0], history[1]);
        history = actions.shift();
      }
    }
  }, [actions]);
  return [state, dispatch] as const;
}
