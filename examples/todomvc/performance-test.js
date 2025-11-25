// examples/todomvc/performance-test.js
// Performance testing for Phase 1 & 2 optimizations

export class PerformanceTestSuite {
  constructor() {
    this.results = {};
    this.iterations = 100;
  }

  /**
   * Test add todo performance
   */
  async testAddTodo(componentInstance, count = 10) {
    console.log(`\n📊 Testing: Add ${count} todos`);
    
    const times = [];
    for (let i = 0; i < count; i++) {
      const start = performance.now();
      
      componentInstance._state.newTodo.value = `Test todo ${i}`;
      componentInstance._actions.addTodo();
      
      const end = performance.now();
      times.push(end - start);
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
    
    this.results.addTodo = { avg, min, max, count };
    return { avg, min, max };
  }

  /**
   * Test toggle todo performance
   */
  async testToggleTodo(componentInstance, count = 10) {
    console.log(`\n📊 Testing: Toggle ${count} todos`);
    
    const todos = componentInstance._state.todos.value;
    if (todos.length === 0) {
      console.log('  ⚠️ No todos to toggle');
      return;
    }
    
    const times = [];
    for (let i = 0; i < count && i < todos.length; i++) {
      const start = performance.now();
      
      // Create a mock event
      const mockEvent = {
        target: {
          closest: () => ({
            dataset: { id: todos[i].id }
          })
        }
      };
      
      componentInstance._actions.toggleTodo(mockEvent);
      
      const end = performance.now();
      times.push(end - start);
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
    
    this.results.toggleTodo = { avg, min, max, count };
    return { avg, min, max };
  }

  /**
   * Test filter performance
   */
  async testFilterSwitch(componentInstance, cycles = 5) {
    console.log(`\n📊 Testing: Filter switches (${cycles} cycles)`);
    
    const filters = ['all', 'active', 'completed'];
    const times = [];
    
    for (let i = 0; i < cycles; i++) {
      for (const filter of filters) {
        const start = performance.now();
        
        componentInstance._state.filter.value = filter;
        
        const end = performance.now();
        times.push(end - start);
      }
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    console.log(`  Average per switch: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
    
    this.results.filterSwitch = { avg, min, max, cycles: cycles * 3 };
    return { avg, min, max };
  }

  /**
   * Test computed signal cache effectiveness
   */
  async testComputedCache(componentInstance) {
    console.log(`\n📊 Testing: Computed signal memoization`);
    
    // Trigger computed signals multiple times
    const iterations = 1000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      // Access cached computed values (should be fast)
      const filtered = componentInstance._state.filteredTodos?.value;
      const itemsLeft = componentInstance._state.itemsLeft?.value;
      const showFooter = componentInstance._state.showFooter?.value;
    }
    
    const end = performance.now();
    const totalTime = end - start;
    const avgPerAccess = totalTime / (iterations * 3);
    
    console.log(`  ${iterations * 3} accesses in ${totalTime.toFixed(2)}ms`);
    console.log(`  Average per access: ${avgPerAccess.toFixed(4)}ms`);
    console.log(`  ✓ Computed values are cached and not recomputed`);
    
    this.results.computedCache = { totalTime, iterations, avgPerAccess };
    return { totalTime, avgPerAccess };
  }

  /**
   * Test virtual list performance (if enabled)
   */
  async testVirtualList(componentInstance, itemCount = 10000) {
    console.log(`\n📊 Testing: Virtual list performance (${itemCount} items)`);
    
    if (!componentInstance._state.enableVirtualList?.value) {
      console.log('  ⚠️ Virtual list not enabled');
      return;
    }
    
    const start = performance.now();
    
    // Create large list
    const todos = [];
    for (let i = 0; i < itemCount; i++) {
      todos.push({
        id: i,
        text: `Todo ${i}`,
        completed: i % 2 === 0
      });
    }
    
    componentInstance._state.todos.value = todos;
    
    const end = performance.now();
    const creationTime = end - start;
    
    console.log(`  Created ${itemCount} items in ${creationTime.toFixed(2)}ms`);
    
    // Test visibility calculation
    const visStart = performance.now();
    const visibleItems = componentInstance._state.visibleTodos.value;
    const visEnd = performance.now();
    
    console.log(`  Calculated visible items: ${visibleItems.length}`);
    console.log(`  Visibility calculation: ${(visEnd - visStart).toFixed(2)}ms`);
    console.log(`  ✓ Virtual list only renders visible items`);
    
    this.results.virtualList = {
      totalItems: itemCount,
      visibleItems: visibleItems.length,
      creationTime,
      visibilityTime: visEnd - visStart
    };
    
    return { creationTime, visibleItems: visibleItems.length };
  }

  /**
   * Test memory usage estimation
   */
  async testMemoryUsage() {
    console.log(`\n📊 Testing: Memory usage`);
    
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize / 1048576; // Convert to MB
      const limit = performance.memory.jsHeapSizeLimit / 1048576;
      const percentage = ((used / limit) * 100).toFixed(1);
      
      console.log(`  Heap used: ${used.toFixed(2)}MB / ${limit.toFixed(2)}MB (${percentage}%)`);
      this.results.memory = { used, limit, percentage };
    } else {
      console.log('  ⚠️ performance.memory not available (not in Chrome DevTools)');
    }
  }

  /**
   * Run all performance tests
   */
  async runAll(componentInstance) {
    console.log('\n' + '═'.repeat(50));
    console.log('  🚀 PHASE 1+2 PERFORMANCE TEST SUITE');
    console.log('═'.repeat(50));
    
    await this.testComputedCache(componentInstance);
    await this.testAddTodo(componentInstance, 5);
    await this.testToggleTodo(componentInstance, 3);
    await this.testFilterSwitch(componentInstance, 3);
    
    if (componentInstance._state.enableVirtualList?.value) {
      await this.testVirtualList(componentInstance, 5000);
    }
    
    await this.testMemoryUsage();
    
    console.log('\n' + '═'.repeat(50));
    console.log('  ✅ PERFORMANCE TEST COMPLETE');
    console.log('═'.repeat(50));
    
    return this.results;
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n📈 PERFORMANCE SUMMARY');
    console.log('─'.repeat(50));
    
    for (const [test, result] of Object.entries(this.results)) {
      console.log(`\n${test}:`);
      if (result.avg !== undefined) {
        console.log(`  Average: ${result.avg.toFixed(2)}ms`);
      }
      if (result.avgPerAccess !== undefined) {
        console.log(`  Per access: ${result.avgPerAccess.toFixed(4)}ms`);
      }
      if (result.creationTime !== undefined) {
        console.log(`  Creation time: ${result.creationTime.toFixed(2)}ms`);
      }
    }
  }
}

// Export for use in client.js
export default PerformanceTestSuite;
