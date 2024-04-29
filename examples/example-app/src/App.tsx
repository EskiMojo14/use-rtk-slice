import "./App.css";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useSlice } from "use-rtk-slice";

const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment(state) {
      state.value += 1;
    },
    decrementBy(state, { payload }: PayloadAction<number>) {
      state.value -= payload;
    },
  },
  selectors: {
    selectCount: (state) => state.value,
  },
});

function App() {
  const [selectors, dispatch] = useSlice(counterSlice);

  return (
    <>
      <div className="card">
        <p>
          <code>count</code> is {selectors.selectCount()}
        </p>
        <button onClick={() => dispatch.increment()}>increment</button>
        <button onClick={() => dispatch.decrementBy(1)}>decrement</button>
      </div>
    </>
  );
}

export default App;
