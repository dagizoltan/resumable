// examples/client.js
import { initResumableApp } from '../resumable/core/runtime.js';
import { TodoApp } from './components/TodoApp.js';
import { Counter } from './components/Counter.js';
import { Toggle } from './components/Toggle.js';
import { DemoPage } from './demo.js';

console.log('Client script loaded');

function init() {
  console.log('Initializing Resumable app with all components...');
  try {
    initResumableApp({
      'demo-page': DemoPage,
      'demo-counter': Counter,
      'demo-toggle': Toggle,
      'todo-app': TodoApp,
    });
    console.log('✓ All components initialized');
  } catch (e) {
    console.error('Error initializing app:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
