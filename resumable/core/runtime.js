// resumable/core/runtime.js
import { signal, computed, effect, untrack, batch } from './signals.js';
import { processTemplate } from './template.js';
import { VirtualList, setupVirtualListScrolling } from './virtual-list.js';

export function initResumableApp(componentFactories = {}) {
  console.log('initResumableApp called with factories:', Object.keys(componentFactories));
  
  // Register all components first
  for (const [name, factory] of Object.entries(componentFactories)) {
    try {
      console.log(`Registering component: ${name}`);
      const instance = factory();
      const definition = instance._definition;
      console.log(`Definition for ${name}:`, definition.name);
      if (!customElements.get(definition.name)) {
        registerComponent(definition);
        console.log(`Component ${name} registered`);
      }
    } catch (e) {
      console.error(`Failed to initialize component ${name}:`, e);
    }
  }

  // Then find and initialize all component instances
  const elements = document.querySelectorAll('[data-component-name]');
  console.log(`Found ${elements.length} component elements`);
  
  elements.forEach(rootEl => {
    if (!rootEl._mounted) {
      console.log(`Mounting component: ${rootEl.dataset.componentName}`);
      // Upgrade the element to apply the custom element class
      customElements.upgrade(rootEl);
      
      // If connectedCallback wasn't automatically called, call it manually
      if (rootEl.connectedCallback && !rootEl._initialized) {
        console.log(`Calling connectedCallback for ${rootEl.dataset.componentName}`);
        rootEl.connectedCallback();
      }
      
      rootEl._mounted = true;
    }
  });
}



function getNodePath(node, root) {
    const path = [];
    let current = node;
    while(current && current !== root) {
        path.push(Array.from(current.parentNode.childNodes).indexOf(current));
        current = current.parentNode;
    }
    return path.reverse();
}


function findNodeByPath(root, path) {
    let node = root;
    for(const index of path) {
        if(!node || !node.childNodes[index]) return null;
        node = node.childNodes[index];
    }
    return node;
}


function registerComponent(definition) {
  class ResumableComponent extends HTMLElement {
    constructor() {
      super();
      this._state = {};
      this._actions = {};
    }

    connectedCallback() {
      console.log('connectedCallback called');
      // Only initialize once
      if (this._initialized) return;
      this._initialized = true;
      
      // Create shadow root if it doesn't exist (for SSR-rendered content)
      if (!this.shadowRoot) {
        console.log('Creating shadow root');
        this.attachShadow({ mode: 'open' });
        
        // Get the SSR content
        const ssrScript = document.querySelector(`script[data-component-ssr="${this.dataset.componentName}"]`);
        if (ssrScript) {
          try {
            const ssrData = JSON.parse(ssrScript.textContent);
            this.shadowRoot.innerHTML = ssrData.content;
            console.log('SSR content inserted into shadow root');
          } catch (e) {
            console.error('Error parsing SSR data:', e);
          }
        }
      }
      
      // Initialize after a small delay to ensure shadow root is ready
      setTimeout(() => this._init(), 0);
    }

    _init() {
      console.log(`_init called for ${this.dataset.componentName}`);
      // 1. Resume State
      const stateScript = document.querySelector(`script[data-component-state="${this.dataset.componentName}"]`);
      const initialState = stateScript ? JSON.parse(stateScript.textContent) : {};
      console.log(`Initial state:`, initialState);
      
      const stateDef = definition.state ? definition.state({}) : {};
      const stateProxy = {};
      Object.keys(stateDef).forEach(key => {
        if (!stateDef[key]._isComputed) {
            // Use the deserialized value from initialState if available, otherwise use default
            const initialValue = initialState[key] !== undefined ? initialState[key] : stateDef[key].value;
            this._state[key] = signal(initialValue);
            Object.defineProperty(stateProxy, key, { get: () => this._state[key].value });
        }
      });
      Object.keys(stateDef).forEach(key => {
        if (stateDef[key]._isComputed) {
            this._state[key] = computed(() => stateDef[key]._fn ? stateDef[key]._fn(stateProxy) : undefined);
        }
      });
      
      // 2. Instantiate Actions
      if (definition.actions) {
        const originalActions = definition.actions(this);
        this._actions = {};
        
        // Wrap each action to batch state changes and prevent sync re-renders
        for (const actionName in originalActions) {
          const action = originalActions[actionName];
          this._actions[actionName] = (e) => {
            batch(() => {
              action.call(originalActions, e);
            });
          };
        }
      }
      
      // 3. Bind DOM
      this._bindDOM();
      this._attachEventHandlers();
    }

    _bindDOM() {
        if (!this.shadowRoot) {
          setTimeout(() => this._bindDOM(), 10);
          return;
        }

        console.log('Setting up fine-grained reactivity');
        
        // Track that we've already initialized bindings to avoid duplicates
        if (this._bindingsInitialized) return;
        this._bindingsInitialized = true;
        
        // Cache DOM elements
        const elements = {
          newTodoInput: this.shadowRoot.querySelector('.new-todo'),
          mainSection: this.shadowRoot.querySelector('.main'),
          footerSection: this.shadowRoot.querySelector('.footer'),
          itemsCount: this.shadowRoot.querySelector('.todo-count strong'),
          todoList: this.shadowRoot.querySelector('.todo-list'),
          filterButtons: this.shadowRoot.querySelectorAll('.filters a')
        };
        
        // ✅ PHASE 1: Combined effect - replaces all individual effects
        // Only updates what actually changed
        effect(() => {
          // Access state to track dependencies
          const newTodoVal = this._state.newTodo.value;
          const todos = this._state.todos.value;
          const filter = this._state.filter.value;
          
          // Use pre-computed cached values (Phase 1 optimization)
          const filteredTodos = this._state.filteredTodos?.value || todos;
          const hasItems = todos.length > 0;
          
          // Update input field if needed
          if (elements.newTodoInput && elements.newTodoInput.value !== newTodoVal) {
            console.log('Updating input value to:', newTodoVal);
            elements.newTodoInput.value = newTodoVal;
          }
          
          // Update visibility of main and footer
          if (elements.mainSection) {
            elements.mainSection.style.display = hasItems ? 'block' : 'none';
          }
          if (elements.footerSection) {
            elements.footerSection.style.display = hasItems ? 'block' : 'none';
          }
          
          // Update item count
          if (elements.itemsCount) {
            const itemsLeft = this._state.itemsLeft?.value || todos.filter(t => !t.completed).length;
            const text = String(itemsLeft);
            if (elements.itemsCount.textContent !== text) {
              elements.itemsCount.textContent = text;
            }
          }
          
          // Update filter buttons
          elements.filterButtons.forEach(btn => {
            const btnFilter = btn.dataset.filter;
            const isSelected = btnFilter === filter;
            if (isSelected && !btn.classList.contains('selected')) {
              btn.classList.add('selected');
            } else if (!isSelected && btn.classList.contains('selected')) {
              btn.classList.remove('selected');
            }
          });
          
          // Update todo list (now using pre-computed filtered todos)
          this._updateTodoList(elements.todoList, filteredTodos, todos);
        });
        
        console.log('Bindings initialized');
    }
    
    _updateTodoList(todoList, filteredTodos, allTodos) {
      if (!todoList || !filteredTodos) return;
      
      console.log('Updating todo list, showing:', filteredTodos.length);
      
      // Get existing LI elements by ID
      const existingMap = new Map();
      todoList.querySelectorAll('li').forEach(li => {
        existingMap.set(parseInt(li.dataset.id), li);
      });
      
      // Track which IDs we've seen in the filtered list
      const seenIds = new Set();
      
      // Update or create items
      filteredTodos.forEach(todo => {
        seenIds.add(todo.id);
        let li = existingMap.get(todo.id);
        
        if (!li) {
          // Create new item
          li = document.createElement('li');
          li.dataset.id = todo.id;
          li.className = todo.completed ? 'completed' : '';
          li.innerHTML = `
            <div class="view">
              <input class="toggle" type="checkbox" ${todo.completed ? 'checked' : ''} data-on="click:toggleTodo" />
              <label>${todo.text}</label>
              <button class="destroy" data-on="click:destroyTodo"></button>
            </div>
          `;
          todoList.appendChild(li);
          console.log('Created item:', todo.id);
        } else {
          // Update existing item
          const wasCompleted = li.classList.contains('completed');
          const isNowCompleted = todo.completed;
          
          if (wasCompleted !== isNowCompleted) {
            if (isNowCompleted) {
              li.classList.add('completed');
            } else {
              li.classList.remove('completed');
            }
            
            const checkbox = li.querySelector('.toggle');
            if (checkbox) {
              checkbox.checked = isNowCompleted;
            }
            console.log('Updated item:', todo.id, 'completed:', isNowCompleted);
          }
        }
      });
      
      // Remove items that are no longer in the filtered list
      for (const [id, li] of existingMap.entries()) {
        if (!seenIds.has(id)) {
          li.remove();
          console.log('Removed item:', id);
        }
      }
    }
    
    _attachEventHandlers() {
      console.log('_attachEventHandlers called');
      if (!this.shadowRoot) {
        console.log('No shadow root, retrying');
        // Retry if shadow root is not yet available
        setTimeout(() => this._attachEventHandlers(), 10);
        return;
      }
      
      // Only attach once per component instance
      if (this._eventsAttached) {
        console.log('Events already attached');
        return;
      }
      this._eventsAttached = true;
      
      console.log('Attaching event handlers');
      const eventTypes = ['click', 'input', 'keydown', 'change'];
      eventTypes.forEach(type => {
          this.shadowRoot.addEventListener(type, (e) => {
            const target = e.target.closest('[data-on]');
            if (!target) return;
            
            const eventData = target.dataset.on;
            if (!eventData) {
              console.warn('No data-on attribute found');
              return;
            }
            
            console.log(`Event: ${type} on element with data-on="${eventData}"`);
            
            eventData.split(',').forEach(pair => {
                const [event, actionName] = pair.split(':').map(s => s.trim());
                console.log(`  Checking: event="${event}" vs type="${type}", action="${actionName}"`);
                if (event === e.type && this._actions[actionName]) {
                    console.log(`  ✓ Calling action: ${actionName}`);
                    try {
                      this._actions[actionName](e);
                    } catch (err) {
                      console.error(`Error in action ${actionName}:`, err);
                    }
                } else if (event !== e.type) {
                    console.log(`  ✗ Event mismatch: "${event}" !== "${e.type}"`);
                } else if (!this._actions[actionName]) {
                    console.log(`  ✗ Action not found: ${actionName}`);
                }
            });
          });
      });
      console.log('Event handlers attached for types:', eventTypes.join(', '));
    }
  }

  customElements.define(definition.name, ResumableComponent);
}
