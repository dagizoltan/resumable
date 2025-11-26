// examples/components/TodoApp.js
import { component } from '../../resumable/core/component.js';
import { signal, computed } from '../../resumable/core/signals.js';
import { html, css, keyed } from '../../resumable/core/template.js';

let nextTodoId = 4;

export const TodoApp = component({
  name: 'todo-app',

  props: {
    initialTodos: { type: Array, default: [] },
  },

  state: (props) => {
    // ✅ PHASE 1: Create state with memoized computed signals
    const stateObj = {
      todos: signal(props.initialTodos || []),
      newTodo: signal(''),
      filter: signal('all'),
    };
    
    // Create computed signals ONCE - memoized forever
    // These auto-update when dependencies (todos/filter) change
    stateObj.filteredTodos = computed(() => {
      const todos = stateObj.todos.value;
      const filterVal = stateObj.filter.value;
      switch (filterVal) {
        case 'active': return todos.filter(todo => !todo.completed);
        case 'completed': return todos.filter(todo => todo.completed);
        default: return todos;
      }
    });
    
    stateObj.itemsLeft = computed(() => {
      return stateObj.todos.value.filter(todo => !todo.completed).length;
    });
    
    stateObj.completedCount = computed(() => {
      return stateObj.todos.value.filter(todo => todo.completed).length;
    });
    
    stateObj.showFooter = computed(() => {
      return stateObj.todos.value.length > 0;
    });
    
    stateObj.allCompleted = computed(() => {
      return stateObj.itemsLeft.value === 0 && stateObj.todos.value.length > 0;
    });
    
    return stateObj;
  },

  actions: (componentInstance) => {
    const state = componentInstance._state;
    return {
      updateNewTodo(e) {
        state.newTodo.value = e.target.value;
      },
      addTodo() {
        const text = state.newTodo.value.trim();
        if (text) {
          state.todos.value = [...state.todos.value, { id: nextTodoId++, text, completed: false }];
          state.newTodo.value = '';
        }
      },
      addTodoOnEnter(e) {
        if (e.key === 'Enter') {
            this.addTodo();
        }
      },
      toggleTodo(e) {
        const id = parseInt(e.target.closest('li').dataset.id);
        state.todos.value = state.todos.value.map(todo =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
      },
      destroyTodo(e) {
        const id = parseInt(e.target.closest('li').dataset.id);
        state.todos.value = state.todos.value.filter(todo => todo.id !== id);
      },
      setFilter(e) {
        e.preventDefault();
        e.stopPropagation();
        state.filter.value = e.target.dataset.filter;
      },
      clearCompleted() {
        state.todos.value = state.todos.value.filter(todo => !todo.completed);
      }
    };
  },

  view: ({ state }) => {
    // ✅ PHASE 1: Use cached computed values instead of recreating them
    const filteredTodos = state.filteredTodos.value;
    const itemsLeft = state.itemsLeft.value;
    const showFooter = state.showFooter.value;
    const allCompleted = state.allCompleted.value;

    return html`
      <header class="header">
        <h1>todos</h1>
        <input
          class="new-todo"
          placeholder="What needs to be done?"
          autofocus
          value="${state.newTodo.value}"
          data-on="input:updateNewTodo,keydown:addTodoOnEnter"
        />
      </header>
      <section class="main" style="display: ${showFooter ? 'block' : 'none'};">
        <input id="toggle-all" class="toggle-all" type="checkbox" ${allCompleted ? 'checked' : ''}>
        <label for="toggle-all">Mark all as complete</label>
        <ul class="todo-list">
          ${keyed(
            filteredTodos,
            todo => todo.id,
            todo => html`
              <li class="${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="view">
                  <input
                    class="toggle"
                    type="checkbox"
                    ${todo.completed ? 'checked' : ''}
                    data-on="change:toggleTodo"
                  />
                  <label>${todo.text}</label>
                  <button class="destroy" data-on="click:destroyTodo"></button>
                </div>
              </li>
            `
          )}
        </ul>
      </section>
      <footer class="footer" style="display: ${showFooter ? 'block' : 'none'};">
        <span class="todo-count"><strong>${itemsLeft}</strong> items left</span>
        <ul class="filters">
          <li><a href="#/" class="${state.filter.value === 'all' ? 'selected' : ''}" data-on="click:setFilter" data-filter="all">All</a></li>
          <li><a href="#/active" class="${state.filter.value === 'active' ? 'selected' : ''}" data-on="click:setFilter" data-filter="active">Active</a></li>
          <li><a href="#/completed" class="${state.filter.value === 'completed' ? 'selected' : ''}" data-on="click:setFilter" data-filter="completed">Completed</a></li>
        </ul>
        <button class="clear-completed" data-on="click:clearCompleted">
          Clear completed
        </button>
      </footer>
    `;
  },

  style: css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      color: #333;
    }
    
    * { box-sizing: border-box; }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      text-align: center;
      color: white;
      border-radius: 8px 8px 0 0;
    }
    
    .header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 300;
      letter-spacing: 0.05em;
    }
    
    .new-todo {
      width: 100%;
      padding: 1.25rem;
      font-size: 1rem;
      border: none;
      border-bottom: 2px solid #f0f0f0;
      transition: border-color 0.2s;
      outline: none;
      background: #fafafa;
    }
    
    .new-todo:focus {
      border-bottom-color: #667eea;
      background: white;
    }
    
    .main {
      border-top: 1px solid #f0f0f0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .todo-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .todo-list li {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f5f5f5;
      transition: background-color 0.15s;
    }
    
    .todo-list li:hover {
      background-color: #fafafa;
    }
    
    .todo-list li.completed label {
      text-decoration: line-through;
      color: #bbb;
    }
    
    .toggle {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      margin-right: 1rem;
      cursor: pointer;
      accent-color: #667eea;
    }
    
    .todo-list li label {
      flex: 1;
      cursor: pointer;
      user-select: none;
      font-size: 1rem;
      margin: 0;
    }
    
    .destroy {
      width: 32px;
      height: 32px;
      padding: 0;
      margin: 0;
      border: none;
      background: none;
      color: #e74c3c;
      cursor: pointer;
      font-size: 1.2rem;
      opacity: 0;
      transition: opacity 0.15s, color 0.15s;
    }
    
    .todo-list li:hover .destroy {
      opacity: 1;
    }
    
    .destroy:hover {
      color: #c0392b;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #fafafa;
      border-radius: 0 0 8px 8px;
      font-size: 0.9rem;
      color: #666;
    }
    
    .todo-count {
      font-weight: 500;
    }
    
    .filters {
      display: flex;
      gap: 0.5rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .filters a {
      padding: 0.5rem 1rem;
      text-decoration: none;
      color: #666;
      border: 1px solid transparent;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
      font-size: 0.85rem;
    }
    
    .filters a:hover {
      color: #667eea;
      border-color: #667eea;
    }
    
    .filters a.selected {
      color: #667eea;
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
    }
    
    .clear-completed {
      padding: 0.5rem 1rem;
      border: none;
      background: none;
      color: #e74c3c;
      cursor: pointer;
      font-size: 0.85rem;
      transition: color 0.15s;
    }
    
    .clear-completed:hover {
      color: #c0392b;
    }
    
    .toggle-all {
      display: none;
    }
  `,
});
