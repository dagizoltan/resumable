// examples/todomvc/client.js
import { initResumableApp } from '../../resumable/core/runtime.js';
import { TodoApp } from './TodoApp.js';
import PerformanceTestSuite from './performance-test.js';

console.log('Client script loaded');

// Ensure DOM is ready before initializing
function init() {
  console.log('Initializing app...');
  try {
    initResumableApp({
      'todo-app': TodoApp
    });
    console.log('App initialized');
    
    // ✅ Phase 1+2: Expose component and test suite for console testing
    const todoApp = document.querySelector('todo-app');
    if (todoApp) {
      window.todoApp = todoApp;
      window.performanceTest = new PerformanceTestSuite();
      
      console.log('\n✅ Available in console:');
      console.log('  - window.todoApp: Component instance');
      console.log('  - window.performanceTest: Performance test suite');
      console.log('  - Run: await window.performanceTest.runAll(window.todoApp)');
      console.log('  - Or test individual: await window.performanceTest.testAddTodo(window.todoApp, 10)');
    }
  } catch (e) {
    console.error('Error initializing app:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

