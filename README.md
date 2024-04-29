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

## Alternatives

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
