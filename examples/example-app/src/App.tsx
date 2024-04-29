import "./App.css";
import { createSlice } from "@reduxjs/toolkit";
import { useSlice } from "use-rtk-slice";

const counterSlice = createSlice({
  name: "counter",
  initialState: 0,
  reducers: {
    increment: (state) => state + 1,
    decrement: (state) => state - 1,
  },
  selectors: {
    selectCount: (state) => state,
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
        <button onClick={() => dispatch.decrement()}>decrement</button>
      </div>
    </>
  );
}

export default App;
