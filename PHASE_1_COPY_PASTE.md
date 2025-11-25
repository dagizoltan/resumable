# Phase 1 - Copy-Paste Implementation

## Part 1: Update TodoApp.js

### Step 1.1 - Replace the state function

**Find this section (~line 15):**
```javascript
state: (props) => ({
  todos: signal(props.initialTodos || []),
  newTodo: signal(''),
  filter: signal('all'), // 'all', 'active', 'completed'
}),
```

**Replace with:**
```javascript
state: (props) => {
  // Create base state
  const stateObj = {
    todos: signal(props.initialTodos || []),
    newTodo: signal(''),
    filter: signal('all'),
  };
  
  // ✅ ADD COMPUTED VALUES HERE - memoized and cached
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
```

### Step 1.2 - Update the view function

**Find the view function (~line 56):**
```javascript
view: ({ state }) => {
    const filteredTodos = computed(() => {
        // ... all that computed stuff
    });
    
    const itemsLeft = computed(() => ...);
    // ... more computed
    
    return html`...`
}
```

**Replace with:**
```javascript
view: ({ state }) => {
    // ✅ Now just USE the cached computed values
    const filteredTodos = state.filteredTodos.value;
    const itemsLeft = state.itemsLeft.value;
    const showFooter = state.showFooter.value;
    const allCompleted = state.allCompleted.value;
    const completedCount = state.completedCount.value;
    
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
      ${
        filteredTodos.length > 0
          ? html`
              <section class="main" style="display: block">
                <input class="toggle-all" type="checkbox" ${allCompleted ? 'checked' : ''} />
                <ul class="todo-list">
                  ${filteredTodos.map(
                    (todo) => html`
                      <li data-id="${todo.id}" class="${todo.completed ? 'completed' : ''}">
                        <input class="toggle" type="checkbox" ${todo.completed ? 'checked' : ''} data-on="change:toggleTodo" />
                        <label>${todo.text}</label>
                        <button class="destroy" data-on="click:destroyTodo"></button>
                      </li>
                    `
                  ).join('')}
                </ul>
              </section>

              <footer class="footer" style="display: block">
                <span class="todo-count"><strong>${itemsLeft}</strong> item${itemsLeft !== 1 ? 's' : ''} left</span>
                <ul class="filters">
                  <li><a href="#/" class="selected" data-on="click:setFilter" data-filter="all">All</a></li>
                  <li><a href="#/active" data-on="click:setFilter" data-filter="active">Active</a></li>
                  <li><a href="#/completed" data-on="click:setFilter" data-filter="completed">Completed</a></li>
                </ul>
                ${completedCount > 0 ? html`<button class="clear-completed" data-on="click:clearCompleted">Clear completed</button>` : ''}
              </footer>
            `
          : ''
      }
      ${/* styles */ ''}
    `;
}
```

---

## Part 2: Update runtime.js

### Step 2.1 - Replace _bindDOM method

**Find _bindDOM() method (~line 143):**
```javascript
_bindDOM() {
    if (!this.shadowRoot) {
      setTimeout(() => this._bindDOM(), 10);
      return;
    }

    console.log('Setting up fine-grained reactivity');
    
    if (this._bindingsInitialized) return;
    this._bindingsInitialized = true;
    
    const elements = {
      newTodoInput: this.shadowRoot.querySelector('.new-todo'),
      mainSection: this.shadowRoot.querySelector('.main'),
      footerSection: this.shadowRoot.querySelector('.footer'),
      itemsCount: this.shadowRoot.querySelector('.todo-count strong'),
      todoList: this.shadowRoot.querySelector('.todo-list'),
      filterButtons: this.shadowRoot.querySelectorAll('.filters a')
    };
    
    // ... lots of individual effects
}
```

**Replace entire method with:**
```javascript
_bindDOM() {
    if (!this.shadowRoot) {
      setTimeout(() => this._bindDOM(), 10);
      return;
    }

    console.log('Setting up fine-grained reactivity');
    
    if (this._bindingsInitialized) return;
    this._bindingsInitialized = true;
    
    // Cache elements
    const elements = {
      newTodoInput: this.shadowRoot.querySelector('.new-todo'),
      mainSection: this.shadowRoot.querySelector('.main'),
      footerSection: this.shadowRoot.querySelector('.footer'),
      itemsCount: this.shadowRoot.querySelector('.todo-count strong'),
      todoList: this.shadowRoot.querySelector('.todo-list'),
      filterButtons: this.shadowRoot.querySelectorAll('.filters a')
    };
    
    // ✅ COMBINED EFFECT - replaces all individual effects
    effect(() => {
      // Access state to track dependencies
      const newTodoVal = this._state.newTodo.value;
      const todos = this._state.todos.value;
      const filter = this._state.filter.value;
      
      // Update input field if needed
      if (elements.newTodoInput && elements.newTodoInput.value !== newTodoVal) {
        console.log('Updating input value to:', newTodoVal);
        elements.newTodoInput.value = newTodoVal;
      }
      
      // Update visibility of main and footer
      const hasItems = todos.length > 0;
      if (elements.mainSection) {
        elements.mainSection.style.display = hasItems ? 'block' : 'none';
      }
      if (elements.footerSection) {
        elements.footerSection.style.display = hasItems ? 'block' : 'none';
      }
      
      // Update todo list (now uses pre-computed filtered todos)
      this._updateTodoList();
      
      // Update filter button states
      elements.filterButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.filter === filter) {
          btn.classList.add('selected');
        }
      });
      
      // Update item count
      if (elements.itemsCount) {
        const itemsLeft = this._state.todos.value.filter(t => !t.completed).length;
        elements.itemsCount.textContent = itemsLeft;
      }
    });
    
    this._attachEventHandlers();
}
```

### Step 2.2 - Update _updateTodoList method

**Find _updateTodoList() (~line 200):**
```javascript
_updateTodoList() {
  const todos = this._state.todos.value;
  const filtered = ...compute here...;
  // ... list rendering
}
```

**Replace with:**
```javascript
_updateTodoList() {
  // ✅ Use pre-computed filtered todos from state
  const filtered = this._state.filteredTodos.value;
  const todoList = this.shadowRoot.querySelector('.todo-list');
  
  if (!todoList) return;
  
  // Map existing items for tracking
  const existingMap = new Map();
  todoList.querySelectorAll('li').forEach(li => {
    existingMap.set(parseInt(li.dataset.id), li);
  });
  
  console.log('Updating todo list with', filtered.length, 'items');
  
  // Update or create items
  const fragment = document.createDocumentFragment();
  const processedIds = new Set();
  
  filtered.forEach(todo => {
    processedIds.add(todo.id);
    let li = existingMap.get(todo.id);
    
    if (!li) {
      // Create new item
      li = document.createElement('li');
      li.dataset.id = todo.id;
      li.className = todo.completed ? 'completed' : '';
      li.innerHTML = `
        <input class="toggle" type="checkbox" ${todo.completed ? 'checked' : ''} data-on="change:toggleTodo">
        <label>${todo.text}</label>
        <button class="destroy" data-on="click:destroyTodo"></button>
      `;
      fragment.appendChild(li);
    } else {
      // Update existing item
      li.className = todo.completed ? 'completed' : '';
      const checkbox = li.querySelector('input.toggle');
      if (checkbox) checkbox.checked = todo.completed;
      const label = li.querySelector('label');
      if (label) label.textContent = todo.text;
    }
  });
  
  // Remove items no longer in filtered list
  existingMap.forEach((li, id) => {
    if (!processedIds.has(id)) {
      li.remove();
    }
  });
  
  // Add new items
  if (fragment.childNodes.length > 0) {
    todoList.appendChild(fragment);
  }
}
```

---

## Part 3: Verification Checklist

After making changes, verify:

### Code Changes:
- [ ] TodoApp.js state() returns object with new computed properties
- [ ] TodoApp.js view() uses `state.filteredTodos.value` instead of creating computed
- [ ] runtime.js has single combined effect in _bindDOM()
- [ ] _updateTodoList() uses `this._state.filteredTodos.value`

### Testing:
- [ ] Page loads without errors
- [ ] 3 todos display
- [ ] Can add new todo
- [ ] Can toggle todo completion
- [ ] Can delete todos
- [ ] Filter buttons work (All/Active/Completed)
- [ ] Clear completed works
- [ ] Console has no errors

### Performance:
- [ ] No noticeable lag when adding items
- [ ] Filter switches feel instant
- [ ] Toggle completion is responsive

### Browser Console:
```javascript
// Test performance improvement
performance.mark('start');
document.querySelector('[data-filter="active"]').click();
performance.mark('end');
performance.measure('filter', 'start', 'end');
// Should show ~5-10ms on modern hardware
```

---

## Common Issues & Fixes

### Issue: "filteredTodos is undefined"
**Solution:** Make sure you're returning `stateObj` at the end of state() function

### Issue: "view function throws error"
**Solution:** Ensure all computed properties are accessed with `.value` (e.g., `state.filteredTodos.value`)

### Issue: "List doesn't update when filter changes"
**Solution:** Verify the combined effect is properly accessing `this._state.filter.value`

### Issue: "Styles lost after update"
**Solution:** Check that CSS is being preserved during list DOM updates

### Issue: "Events not firing"
**Solution:** Ensure _attachEventHandlers() is called after _bindDOM()

---

## Performance Measurement

Add this to browser console after Phase 1:

```javascript
// Measure add todo performance
console.time('add-todo');
document.querySelector('.new-todo').value = 'Test item';
document.querySelector('.new-todo').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
console.timeEnd('add-todo');

// Measure filter toggle
console.time('filter-toggle');
document.querySelector('[data-filter="active"]').click();
console.timeEnd('filter-toggle');

// Compare before/after Phase 1
// Expected: 5-10x improvement
```

---

## Summary

This Phase 1 implementation should:
1. ✅ Take about 10-15 minutes to implement
2. ✅ Require no new dependencies
3. ✅ Give 5-10x performance improvement
4. ✅ Not break any existing functionality
5. ✅ Set foundation for Phase 2 (virtualization)

After Phase 1 works perfectly, consider Phase 2 for 10k+ item support.
