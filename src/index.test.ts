import type { Selector } from "@reduxjs/toolkit";
import {
  createAction,
  createEntityAdapter,
  createSlice,
  nanoid,
} from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import { useCallback, useMemo } from "react";
import { describe, expect, it } from "vitest";
import { useSlice } from ".";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const todoAdapter = createEntityAdapter<Todo>();

const initialState = todoAdapter.getInitialState();

export const todoSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    todoAdded: {
      prepare: (text: string) => ({
        payload: { id: nanoid(), text, completed: false },
      }),
      reducer: todoAdapter.addOne,
    },
    todoDeleted: todoAdapter.removeOne,
  },
  selectors: {
    ...todoAdapter.getSelectors(),
  },
});

export const { todoAdded, todoDeleted } = todoSlice.actions;

export const { selectAll, selectEntities, selectIds, selectTotal, selectById } =
  todoSlice.getSelectors();

describe("useSlice", () => {
  it("should return slice's initial state, bound actions, and selectors", () => {
    const { result } = renderHook(() => useSlice(todoSlice));
    const [selectors, dispatch, state] = result.current;

    expect(state).toEqual(todoSlice.getInitialState());

    expect(dispatch).toBeTypeOf("function");
    expect(dispatch.todoAdded).toBeTypeOf("function");
    expect(dispatch.todoDeleted).toBeTypeOf("function");

    expect(selectors.selectAll).toBeTypeOf("function");
    expect(selectors.selectEntities).toBeTypeOf("function");
    expect(selectors.selectIds).toBeTypeOf("function");
    expect(selectors.selectTotal).toBeTypeOf("function");
    expect(selectors.selectById).toBeTypeOf("function");
  });

  it("can receive an initial state separately", () => {
    const initialState = todoAdapter.getInitialState(undefined, [
      { id: nanoid(), text: "Todo", completed: false },
    ]);
    const { result } = renderHook(() => useSlice(todoSlice, initialState));

    const [, , state] = result.current;

    expect(state).toEqual(initialState);
  });

  it("can receive initializing actions, which are applied during setup", () => {
    const action = todoAdded("Todo 1");
    const { result } = renderHook(() =>
      useSlice(todoSlice, undefined, [action]),
    );

    const [, , state] = result.current;

    expect(state).toEqual(
      todoAdapter.getInitialState(undefined, [action.payload]),
    );
  });

  it("should update state when actions are called", async () => {
    const { result } = renderHook(() => useSlice(todoSlice));

    const [, dispatch] = result.current;
    const getSelectors = () => result.current[0];

    expect(getSelectors().selectAll()).toEqual([]);

    const {
      payload: { id },
    } = await act(() => dispatch.todoAdded("Todo 1"));

    expect(getSelectors().selectAll()).toEqual([
      { id, text: "Todo 1", completed: false },
    ]);

    act(() => {
      dispatch.todoDeleted(id);
    });

    expect(getSelectors().selectAll()).toEqual([]);
  });
  it("can be called with plain config", () => {
    interface State {
      count: number;
    }
    const initialState: State = { count: 0 };
    const increment = createAction("increment");
    const { result } = renderHook(() =>
      useSlice({
        name: "counter",
        // these two don't need to be stable
        getInitialState: () => initialState,
        reducer(state, action) {
          if (increment.match(action)) {
            return { count: state.count + 1 };
          }
          return state;
        },
        // these two need to be stable
        actions: useMemo(() => ({ increment }), []),
        getSelectors: useCallback(
          () =>
            ({
              selectCount: (state) => state.count,
            }) satisfies Record<string, Selector<State>>,
          [],
        ),
      }),
    );

    const [selectors, dispatch, state] = result.current;

    expect(state).toEqual(initialState);

    expect(dispatch).toBeTypeOf("function");
    expect(dispatch.increment).toBeTypeOf("function");

    expect(selectors.selectCount).toBeTypeOf("function");
    expect(selectors.selectCount()).toBe(0);
  });
});
