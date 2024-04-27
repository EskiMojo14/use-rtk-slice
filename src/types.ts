import type { UnknownAction, Selector } from "@reduxjs/toolkit";
import type { Reducer } from "react";

type Compute<T> = { [K in keyof T]: T[K] } & unknown;

export type SliceActions = Record<
  string,
  (...args: Array<any>) => UnknownAction
>;

export type SliceSelectors<State> = Record<string, Selector<State>>;

export type BoundSelectors<
  State,
  Selectors extends SliceSelectors<any>,
> = Compute<{
  [K in keyof Selectors]: Selectors[K] extends Selector<
    State,
    infer Result,
    infer Args
  >
    ? (...args: Args) => Result
    : never;
}>;

export type SliceBoundSelectors<S extends Slice<any, any, any>> =
  BoundSelectors<
    ReturnType<S["getInitialState"]>,
    ReturnType<S["getSelectors"]>
  >;

type NoInfer<T> = [T][T extends any ? 0 : never];

export interface Slice<
  State,
  Actions extends SliceActions,
  Selectors extends SliceSelectors<State>,
> {
  name: string;
  getInitialState: () => State;
  reducer: Reducer<State, UnknownAction>;
  actions: Actions;
  getSelectors(arg: (state: NoInfer<State>) => NoInfer<State>): Selectors;
}
