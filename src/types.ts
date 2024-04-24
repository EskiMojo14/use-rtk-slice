import { Reducer } from "react";
import type { ThunkAction, UnknownAction, Selector } from "@reduxjs/toolkit";

type Compute<T> = { [K in keyof T]: T[K] } & unknown;

export type SliceActions<State> = Record<
  string,
  (
    ...args: any[]
  ) => ThunkAction<any, State, void, UnknownAction> | UnknownAction
>;

export type BoundActions<State, Actions extends SliceActions<State>> = Compute<{
  [K in keyof Actions]: Actions[K] extends (...args: infer A) => infer R
    ? R extends ThunkAction<infer T, State, void, UnknownAction>
      ? (...args: A) => T
      : (...args: A) => R
    : never;
}>;

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

type NoInfer<T> = [T][T extends any ? 0 : never];

export interface Slice<
  State,
  Actions extends SliceActions<State>,
  Selectors extends SliceSelectors<State>,
> {
  getInitialState: () => State;
  reducer: Reducer<State, UnknownAction>;
  actions: Actions;
  getSelectors(arg: (state: NoInfer<State>) => NoInfer<State>): Selectors;
}
