# use-rtk-slice

A wrapper around `useReducer` which accepts a slice created with `createSlice` from `@reduxjs/toolkit`, and returns bound selectors and actions.

```tsx
import { createSlice } from "@reduxjs/toolkit";

const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment(state) {
      state.value += 1;
    },
    decrement(state) {
      state.value -= 1;
    },
  },
  selectors: {
    selectCount: (state) => state.value,
  },
});

const Counter = () => {
  const [selectors, dispatch] = useSlice(counterSlice);
  return (
    <div>
      <button onClick={() => dispatch.increment()}>+</button>
      <span>{selectors.selectCount()}</span>
      <button onClick={() => dispatch.decrement()}>-</button>
    </div>
  );
};
```

The actions are bound to the original `dispatch` function, so non-bound actions can be dispatched as well.

```ts
dispatch(anExternalAction());
```

Also includes Redux DevTools integration, using [`use-reducer-devtools`](https://github.com/EskiMojo14/use-reducer-devtools). This allows you to inspect the state and actions in the Redux DevTools extension, and even use time-travel debugging.

## Initialising state

Slices already have an initial state set (made available with `getInitialState`), so you don't need to provide an initial state to `useSlice`.

However, if you want to provide an initial state, you can do so by passing it as the second argument to `useSlice`.

```tsx
const [selectors, dispatch] = useSlice(counterSlice, { value: 10 });
```

The third argument is a list of actions to reduce the initial state provided with, to get a "final" initial state.

```tsx
const [selectors, dispatch] = useSlice(counterSlice, { value: 10 }, [
  increment(),
  increment(),
]);

console.log(selectors.selectCount()); // 12
```

Note that these actions won't show up in the Redux DevTools extension.

## Alternatives

### `use-local-slice`

If you're not already using `@reduxjs/toolkit`, you may want to consider [`use-local-slice`](https://github.com/phryneas/use-local-slice) instead, which includes a similar API but without being specific to `@reduxjs/toolkit`.

```tsx
import { useLocalSlice } from "use-local-slice";

function Counter() {
  const [state, dispatch] = useLocalSlice({
    slice: "counter",
    initialState: { value: 0 },
    reducers: {
      increment(state) {
        state.value += 1;
      },
      decrement(state) {
        state.value -= 1;
      },
    },
  });

  return (
    <div>
      <button onClick={() => dispatch.increment()}>+</button>
      <span>{state.value}</span>
      <button onClick={() => dispatch.decrement()}>-</button>
    </div>
  );
}
```

Note that `use-local-slice` does not include Redux DevTools integration, or selectors.

### Usage without `createSlice`

While not recommended, you can also use `use-rtk-slice` without `createSlice`:

```tsx
import { useSlice } from "use-rtk-slice";

const Counter = () => {
  const [selectors, dispatch] = useSlice({
    name: "counter",
    getInitialState() {
      return { value: 0 };
    },
    reducer(state, action) {
      switch (action.type) {
        case "increment":
          return { ...state, value: state.value + 1 };
        case "decrement":
          return { ...state, value: state.value - 1 };
        default:
          return state;
      }
    },
    actions: useMemo(
      () => ({
        increment() {
          return { type: "increment" };
        },
        decrement() {
          return { type: "decrement" };
        },
      }),
      [],
    ),
    getSelectors: useCallback(
      () => ({
        selectCount: (state: { value: number }) => state.value,
      }),
      [],
    ),
  });
  return (
    <div>
      <button onClick={() => dispatch.increment()}>+</button>
      <span>{selectors.selectCount()}</span>
      <button onClick={() => dispatch.decrement()}>-</button>
    </div>
  );
};
```

Note that both `actions` and `getSelectors` must be stable, hence the use of `useMemo` and `useCallback`. `getInitialState` and `reducer` are not required to be stable.
