import { describe, expect, it } from "vitest";
import {
  asyncThunkCreator,
  buildCreateSlice,
  createEntityAdapter,
  nanoid,
} from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import { useSlice } from ".";

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

  it("should update state when actions are called", () => {
    const { result } = renderHook(() => useSlice(todoSlice));

    const [, dispatch, selectors] = result.current;

    expect(selectors.selectAll()).toEqual([]);

    let id = "";
    act(() => {
      ({
        payload: { id },
      } = dispatch.todoAdded("Todo 1"));
    });

    expect(selectors.selectAll()).toEqual([
      { id, text: "Todo 1", completed: false },
    ]);

    act(() => {
      dispatch.todoDeleted(id);
    });

    expect(selectors.selectAll()).toEqual([]);
  });
  it("should support bound thunks", async () => {
    const { result } = renderHook(() => useSlice(todoSlice));

    const [, dispatch, selectors] = result.current;

    expect(selectors.selectLoading()).toBe(false);
    expect(selectors.selectAll()).toEqual([]);

    let promise = undefined as
      | ReturnType<typeof dispatch.fetchTodo>
      | undefined;

    act(() => {
      promise = dispatch.fetchTodo();
    });

    expect(selectors.selectLoading()).toBe(true);

    await act(async () => {
      await promise;
    });

    expect(selectors.selectLoading()).toBe(false);
    expect(selectors.selectAll()).toEqual([
      { id: promise!.requestId, text: "Todo", completed: false },
    ]);
  });
  it("should support dispatching arbitrary thunks, which can retrieve updated state", () => {
    const { result } = renderHook(() => useSlice(todoSlice));

    const [, dispatch] = result.current;

    const thunkRan = dispatch((dispatch, getState) => {
      expect(selectTotal(getState())).toBe(0);

      let id = "";
      act(() => {
        ({
          payload: { id },
        } = dispatch(todoAdded("Todo 1")));
      });

      expect(selectTotal(getState())).toBe(1);

      act(() => {
        dispatch(todoDeleted(id));
      });

      expect(selectTotal(getState())).toBe(0);

      return true;
    });

    expect(thunkRan).toBe(true);
  });
});
