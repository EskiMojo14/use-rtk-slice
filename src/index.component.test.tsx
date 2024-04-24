import { describe, it, expect } from "vitest";
import { useSlice } from ".";
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

  return (
    <div>
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
      <button
        onClick={() =>
          dispatch.todoAdded(`Todo ${selectors.selectTotal() + 1}`)
        }
      >
        Add a Todo
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
  it("should add a todo", async () => {
    const { getByText, getByRole } = render(<Todos />);

    await user.click(getByRole("button", { name: "Add a Todo" }));

    expect(getByText("Todo 1")).toBeInTheDocument();
  });
  it("should delete a todo", async () => {
    const { getByText, getByRole } = render(<Todos />);

    await user.click(getByRole("button", { name: "Add a Todo" }));
    expect(getByText("Todo 1")).toBeInTheDocument();

    await user.click(getByRole("button", { name: 'Delete "Todo 1"' }));
    expect(getByText("No todos")).toBeInTheDocument();
  });
});
