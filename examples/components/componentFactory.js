// examples/components/componentFactory.js
// Universal component factory for both SSR and client

import { Counter } from './Counter.js';
import { Toggle } from './Toggle.js';
import { TodoApp } from './TodoApp.js';
import { DemoPage } from '../demo.js';

// Map component names to their factories
const components = {
  'demo-counter': Counter,
  'demo-toggle': Toggle,
  'todo-app': TodoApp,
  'demo-page': DemoPage,
};

export function componentFactory(name) {
  return components[name] || null;
}
