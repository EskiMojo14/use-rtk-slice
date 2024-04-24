import { describe, it, expect } from "vitest";
import { useSlice, type SliceBoundActions, type SliceBoundSelectors } from ".";
import { Todo, todoSlice } from "./index.test";
import { render, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

interface TodoItemProps {
  todo: Todo;
  onDelete: (id: string) => void;
}

const TodoItem = ({ todo, onDelete }: TodoItemProps) => (
  <li>
    <span>{todo.text}</span>
    <button
      onClick={() => onDelete(todo.id)}
      aria-label={`Delete "${todo.text}"`}
    >
      Delete
    </button>
  </li>
);

const Todos = () => {
  const [, dispatch, selectors] = useSlice(todoSlice);

  const loading = selectors.selectLoading();
  return (
    <div>
      {loading && <p>Loading...</p>}
      {selectors.selectTotal() ? (
        <ul>
          {selectors.selectIds().map((id) => {
            const todo = selectors.selectById(id);
            if (!todo) return null;
            return (
              <TodoItem
                key={id}
                todo={todo}
                onDelete={(id) => dispatch.todoDeleted(id)}
              />
            );
          })}
        </ul>
      ) : (
        <p>No todos</p>
      )}
      <button disabled={loading} onClick={() => dispatch.fetchTodo()}>
        Fetch a Todo
      </button>
    </div>
  );
};

describe("Todos", () => {
  const user = userEvent.setup();
  it("should render a list of todos", () => {
    const { getByText } = render(<Todos />);

    expect(getByText("No todos")).toBeInTheDocument();
  });
  it("should fetch a todo", async () => {
    const { getByText, getByRole } = render(<Todos />);

    await user.click(getByRole("button", { name: "Fetch a Todo" }));
    expect(getByText("Loading...")).toBeInTheDocument();

    await waitForElementToBeRemoved(() => getByText("Loading..."));
    expect(getByText("Todo 1")).toBeInTheDocument();
  });
  it("should delete a todo", async () => {
    const { getByText, getByRole } = render(<Todos />);

    await user.click(getByRole("button", { name: "Fetch a Todo" }));
    await waitForElementToBeRemoved(() => getByText("Loading..."));

    await user.click(getByRole("button", { name: 'Delete "Todo 1"' }));
    expect(getByText("No todos")).toBeInTheDocument();
  });
});
