// examples/todomvc/client.js
import { initResumableApp } from '../../resumable/core/runtime.js';
import { TodoApp } from './TodoApp.js';

console.log('Client script loaded');

// Ensure DOM is ready before initializing
function init() {
  console.log('Initializing app...');
  try {
    initResumableApp({
      'todo-app': TodoApp
    });
    console.log('App initialized');
  } catch (e) {
    console.error('Error initializing app:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
