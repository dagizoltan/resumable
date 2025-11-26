// examples/data/pages.js
// Page configuration - defines what each page renders

import { Counter } from '../components/Counter.js';
import { Toggle } from '../components/Toggle.js';
import { TodoApp } from '../components/TodoApp.js';
import { DemoPage } from '../demo.js';

export const pages = {
  '/': {
    title: 'Resumable - Component Framework',
    layoutStyles: '',
    components: [
      { tag: 'demo-page', factory: DemoPage, props: {} },
      { tag: 'demo-counter', factory: Counter, props: { initialValue: 0 } },
      { tag: 'demo-counter', factory: Counter, props: { initialValue: 5 } },
      { tag: 'demo-toggle', factory: Toggle, props: { label: 'Feature A', initialState: false } },
      { tag: 'demo-toggle', factory: Toggle, props: { label: 'Feature B', initialState: true } },
      { tag: 'todo-app', factory: TodoApp, props: { initialTodos: [
        { id: 1, text: 'Learn Resumable', completed: true },
        { id: 2, text: 'Build components', completed: false },
        { id: 3, text: 'Ship to production', completed: false },
      ]}},
    ],
    registry: { 'demo-page': DemoPage, 'demo-counter': Counter, 'demo-toggle': Toggle, 'todo-app': TodoApp },
  },
  '/counter': {
    title: 'Counter Examples',
    layoutStyles: `body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; min-height: 100vh; } #app { display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center; max-width: 900px; }`,
    components: [
      { tag: 'demo-counter', factory: Counter, props: { initialValue: 0 } },
      { tag: 'demo-counter', factory: Counter, props: { initialValue: 10 } },
    ],
    registry: { 'demo-counter': Counter },
  },
};
