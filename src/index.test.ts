import { describe, expect, it } from "vitest";
import {
  Selector,
  asyncThunkCreator,
  buildCreateSlice,
  createAction,
  createEntityAdapter,
  nanoid,
} from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import { useSlice } from ".";
import { useCallback, useMemo } from "react";

const createAppSlice = buildCreateSlice({
  creators: { asyncThunk: asyncThunkCreator },
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const todoAdapter = createEntityAdapter<Todo>();

const todoSlice = createAppSlice({
  name: "todos",
  initialState: todoAdapter.getInitialState({ loading: false }),
  reducers: (create) => ({
    todoAdded: create.preparedReducer(
      (text: string) => ({ payload: { id: nanoid(), text, completed: false } }),
      todoAdapter.addOne,
    ),
    todoDeleted: create.reducer(todoAdapter.removeOne),
    fetchTodo: create.asyncThunk<Todo, void>(
      async (_, { requestId }) => {
        await wait(250);
        return { id: requestId, text: "Todo", completed: false };
      },
      {
        pending(state) {
          state.loading = true;
        },
        fulfilled: todoAdapter.addOne,
        settled(state) {
          state.loading = false;
        },
      },
    ),
  }),
  selectors: {
    selectLoading: (state) => state.loading,
    ...todoAdapter.getSelectors(),
  },
});

export const { todoAdded, todoDeleted, fetchTodo } = todoSlice.actions;

export const {
  selectLoading,
  selectAll,
  selectEntities,
  selectIds,
  selectTotal,
  selectById,
} = todoSlice.getSelectors();

describe("useSlice", () => {
  it("should return slice's initial state, bound actions, and selectors", () => {
    const { result } = renderHook(() => useSlice(todoSlice));
    const [state, dispatch, selectors] = result.current;

    expect(state).toEqual(todoSlice.getInitialState());

    expect(dispatch).toBeTypeOf("function");
    expect(dispatch.todoAdded).toBeTypeOf("function");
    expect(dispatch.todoDeleted).toBeTypeOf("function");
    expect(dispatch.fetchTodo).toBeTypeOf("function");

    expect(selectors.selectLoading).toBeTypeOf("function");
    expect(selectors.selectAll).toBeTypeOf("function");
    expect(selectors.selectEntities).toBeTypeOf("function");
    expect(selectors.selectIds).toBeTypeOf("function");
    expect(selectors.selectTotal).toBeTypeOf("function");
    expect(selectors.selectById).toBeTypeOf("function");
  });

  it("should update state when actions are called", async () => {
    const { result } = renderHook(() => useSlice(todoSlice));

    const [, dispatch] = result.current;
    const getSelectors = () => result.current[2];

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
  it("should support bound thunks", async () => {
    const { result } = renderHook(() => useSlice(todoSlice));

    const [, dispatch] = result.current;
    const getSelectors = () => result.current[2];

    expect(getSelectors().selectLoading()).toBe(false);
    expect(getSelectors().selectAll()).toEqual([]);

    let promise = undefined as
      | ReturnType<typeof dispatch.fetchTodo>
      | undefined;

    act(() => {
      promise = dispatch.fetchTodo();
    });

    expect(getSelectors().selectLoading()).toBe(true);

    await act(async () => {
      await promise;
    });

    expect(getSelectors().selectLoading()).toBe(false);
    expect(getSelectors().selectAll()).toEqual([
      { id: promise!.requestId, text: "Todo", completed: false },
    ]);
  });
  it("should support dispatching arbitrary thunks, which can retrieve updated state", async () => {
    const { result } = renderHook(() => useSlice(todoSlice));

    const [, dispatch] = result.current;

    const thunkRan = await dispatch(async (dispatch, getState) => {
      expect(selectTotal(getState())).toBe(0);

      const {
        payload: { id },
      } = await act(() => dispatch(todoAdded("Todo 1")));

      expect(selectTotal(getState())).toBe(1);

      act(() => {
        dispatch(todoDeleted(id));
      });

      expect(selectTotal(getState())).toBe(0);

      return true;
    });

    expect(thunkRan).toBe(true);
  });
  it("can be called with plain config", () => {
    interface State {
      count: number;
    }
    const initialState: State = { count: 0 };
    const increment = createAction("increment");
    const { result } = renderHook(() =>
      useSlice({
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

    const [state, dispatch, selectors] = result.current;

    expect(state).toEqual(initialState);

    expect(dispatch).toBeTypeOf("function");
    expect(dispatch.increment).toBeTypeOf("function");

    expect(selectors.selectCount).toBeTypeOf("function");
    expect(selectors.selectCount()).toBe(0);
  });
});
