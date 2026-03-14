import { useState, useEffect, useCallback, useRef } from "react";

type Filter = "all" | "active" | "done";

interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("focus-tasks") ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("focus-tasks", JSON.stringify(tasks));
  }, [tasks]);

  const add = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      { id: crypto.randomUUID(), text: trimmed, done: false, createdAt: Date.now() },
      ...prev,
    ]);
  }, []);

  const toggle = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  const remove = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.done));
  }, []);

  return { tasks, add, toggle, remove, clearDone };
}

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("focus-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("focus-theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

export function App() {
  const { tasks, add, toggle, remove, clearDone } = useTasks();
  const { dark, toggle: toggleTheme } = useTheme();
  const [filter, setFilter] = useState<Filter>("all");
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = tasks.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );
  const doneCount = tasks.filter((t) => t.done).length;
  const activeCount = tasks.length - doneCount;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    add(input);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Fo<span>cus</span></h1>
        <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
          {dark ? "☀️" : "🌙"}
        </button>
      </header>

      <form className="add-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task… (Enter to save)"
          autoFocus
        />
        <button type="submit">Add</button>
      </form>

      <div className="filters">
        {(["all", "active", "done"] as Filter[]).map((f) => (
          <button
            key={f}
            className={`filter-btn${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "active" && activeCount > 0 && ` (${activeCount})`}
            {f === "done" && doneCount > 0 && ` (${doneCount})`}
          </button>
        ))}
      </div>

      <div className="stats">
        <span>
          {activeCount === 0
            ? "All caught up! 🎉"
            : `${activeCount} task${activeCount !== 1 ? "s" : ""} remaining`}
        </span>
        {doneCount > 0 && (
          <button className="clear-btn" onClick={clearDone}>
            Clear completed
          </button>
        )}
      </div>

      <div className="task-list">
        {visible.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              {filter === "done" ? "🎯" : filter === "active" ? "✨" : "📋"}
            </div>
            <p>
              {filter === "all"
                ? "No tasks yet. Add one above!"
                : filter === "active"
                ? "No active tasks."
                : "Nothing completed yet."}
            </p>
          </div>
        ) : (
          visible.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggle}
              onDelete={remove}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <div className={`task-item${task.done ? " done" : ""}`}>
      <div
        className={`task-checkbox${task.done ? " checked" : ""}`}
        role="checkbox"
        aria-checked={task.done}
        tabIndex={0}
        onClick={() => onToggle(task.id)}
        onKeyDown={(e) => e.key === " " || e.key === "Enter" ? onToggle(task.id) : null}
      />
      <span className="task-text">{task.text}</span>
      <button
        className="delete-btn"
        onClick={() => onDelete(task.id)}
        title="Delete task"
        aria-label="Delete task"
      >
        ✕
      </button>
    </div>
  );
}
