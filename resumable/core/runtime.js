// resumable/core/runtime.js
// Universal UI library runtime - works with any component definition
import { signal, computed, batch, effect } from './signals.js';

/**
 * Initialize and bootstrap all Resumable components on the page
 * @param {Object} componentFactories - Map of component name to factory function
 */
export function initResumableApp(componentFactories = {}) {
  console.log('initResumableApp: Registering', Object.keys(componentFactories).length, 'component(s)');
  
  // Register all components first
  for (const [name, factory] of Object.entries(componentFactories)) {
    try {
      console.log(`Registering component factory: ${name}`);
      const instance = factory();
      const definition = instance._definition;
      
      if (!customElements.get(definition.name)) {
        registerComponent(definition);
        console.log(`✓ Component '${definition.name}' registered`);
      }
    } catch (e) {
      console.error(`Failed to register component ${name}:`, e);
    }
  }

  // Find and initialize all component instances
  const elements = document.querySelectorAll('[data-component-name]');
  console.log(`Found ${elements.length} component instance(s)`);
  
  elements.forEach((rootEl, index) => {
    if (!rootEl._resumable_initialized) {
      console.log(`[${index + 1}/${elements.length}] Hydrating component: ${rootEl.dataset.componentName}`);
      
      try {
        // Upgrade the custom element
        customElements.upgrade(rootEl);
        
        // Call connectedCallback if not already called
        if (rootEl.connectedCallback && !rootEl._initialized) {
          rootEl.connectedCallback();
        }
        
        rootEl._resumable_initialized = true;
        console.log(`✓ Component '${rootEl.dataset.componentName}' hydrated`);
      } catch (e) {
        console.error(`Failed to hydrate component ${rootEl.dataset.componentName}:`, e);
      }
    }
  });
  
  console.log('✓ App initialization complete');
}


function registerComponent(definition) {
  class ResumableComponent extends HTMLElement {
    constructor() {
      super();
      this._state = {};
      this._actions = {};
      this._effects = [];
    }

    connectedCallback() {
      console.log(`[${definition.name}] connectedCallback`);
      if (this._initialized) return;
      this._initialized = true;
      
      // Get instance ID from data attribute
      const instanceId = this.dataset.instanceId || this.dataset.componentName;
      
      // Create shadow root if it doesn't exist (for SSR-rendered content)
      if (!this.shadowRoot) {
        console.log(`[${definition.name}] Creating shadow root`);
        this.attachShadow({ mode: 'open' });
        
        // Get the SSR content
        const ssrScript = document.querySelector(`script[data-component-ssr="${instanceId}"]`);
        if (ssrScript) {
          try {
            const ssrData = JSON.parse(ssrScript.textContent);
            if (!ssrData?.content) {
              throw new Error('Invalid SSR data: missing content property');
            }
            this.shadowRoot.innerHTML = ssrData.content;
            console.log(`[${definition.name}] SSR content loaded`);
          } catch (e) {
            console.error(`[${definition.name}] Error parsing SSR data:`, e);
            this.shadowRoot.innerHTML = '<div style="color: red; padding: 1rem;">Error loading component</div>';
          }
        }
      }
      
      // Initialize after shadow root is ready
      setTimeout(() => this._init(), 0);
    }

    disconnectedCallback() {
      console.log(`[${definition.name}] disconnectedCallback`);
      this._cleanup();
    }

    _cleanup() {
      // Clean up all effects
      if (this._effects) {
        this._effects.forEach(effect => {
          if (effect._cleanup) effect._cleanup();
        });
        this._effects = [];
      }
    }

    _init() {
      console.log(`[${definition.name}] Initializing state and actions`);
      
      // Get instance ID from data attribute (used for SSR data lookup with multiple instances)
      const instanceId = this.dataset.instanceId || this.dataset.componentName;
      
      // 1. Resume State from SSR
      const stateScript = document.querySelector(`script[data-component-state="${instanceId}"]`);
      const initialState = stateScript ? JSON.parse(stateScript.textContent) : {};
      
      const stateDef = definition.state ? definition.state({}) : {};
      const stateProxy = {};
      
      // Create signals for all non-computed state
      Object.keys(stateDef).forEach(key => {
        if (!stateDef[key]._isComputed) {
          const initialValue = initialState[key] !== undefined ? initialState[key] : stateDef[key].value;
          this._state[key] = signal(initialValue);
          // Return signal directly so reactive dependency tracking works
          Object.defineProperty(stateProxy, key, { 
            get: () => this._state[key]
          });
        }
      });
      
      // Create computed signals
      Object.keys(stateDef).forEach(key => {
        if (stateDef[key]._isComputed) {
          this._state[key] = computed(() => {
            try {
              return stateDef[key]._fn ? stateDef[key]._fn(stateProxy) : undefined;
            } catch (e) {
              console.error(`[${definition.name}] Error in computed '${key}':`, e);
              return undefined;
            }
          });
        }
      });
      
      // 2. Instantiate Actions
      if (definition.actions) {
        const originalActions = definition.actions(this);
        this._actions = {};
        
        // Wrap actions to batch state changes
        for (const actionName in originalActions) {
          const action = originalActions[actionName];
          this._actions[actionName] = (e) => {
            try {
              batch(() => {
                action.call(originalActions, e);
              });
            } catch (err) {
              console.error(`[${definition.name}] Error in action '${actionName}':`, err);
            }
          };
        }
      }
      
      // 3. Render component view and setup reactive updates
      if (definition.view) {
        console.log(`[${definition.name}] Rendering view`);
        
        // Create a reactive effect that re-renders whenever any state signal changes
        // We need to explicitly access signals inside the effect to create dependencies
        const renderEffect = effect(() => {
          // Force dependency tracking by accessing all state signals
          // This makes the effect re-run when any signal changes
          for (const key in this._state) {
            if (this._state[key] && typeof this._state[key].value !== 'undefined') {
              // Just access the signal's value to track the dependency
              void this._state[key].value;
            }
          }
          // Now render with the tracked dependencies
          this._renderView(stateProxy);
        });
        
        // Store effect for cleanup
        this._effects.push(renderEffect);
      }
      
      // 4. Setup event handlers
      this._attachEventHandlers();
      
      console.log(`[${definition.name}] ✓ Initialization complete`);
    }

    _renderView(stateProxy) {
      // Call the view function with state and actions and update shadow root
      if (!definition.view) return;
      
      try {
        // Create a state object that unwraps signals to their values for the view
        const stateForView = new Proxy(stateProxy, {
          get(target, prop) {
            const value = target[prop];
            // If it's a signal, return its value for template interpolation
            if (value && typeof value === 'object' && 'value' in value) {
              return value.value;
            }
            return value;
          }
        });
        
        // Get the rendered HTML from the view function
        const result = definition.view({ state: stateForView, actions: this._actions });
        const html = result.toString ? result.toString() : String(result);
        
        // Update the shadow root with the new HTML (preserves event listeners)
        if (this.shadowRoot) {
          // Only replace the main content, not the style tag
          const styleMatch = this.shadowRoot.innerHTML.match(/<style[^>]*>[\s\S]*?<\/style>/);
          const styleContent = styleMatch ? styleMatch[0] : '';
          
          // Extract just the view content without style
          const viewContent = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
          
          this.shadowRoot.innerHTML = styleContent + viewContent;
        }
      } catch (e) {
        console.error(`[${definition.name}] Error rendering view:`, e);
      }
    }

    _attachEventHandlers() {
      console.log(`[${definition.name}] Attaching event handlers`);
      
      if (!this.shadowRoot) {
        setTimeout(() => this._attachEventHandlers(), 10);
        return;
      }
      
      // Remove old listeners if re-attaching
      if (this._eventListeners) {
        this._eventListeners.forEach(({ target, type, listener }) => {
          target.removeEventListener(type, listener);
        });
        this._eventListeners = [];
      }
      
      // Listen for all common events
      const eventTypes = ['click', 'input', 'keydown', 'change', 'submit', 'focus', 'blur'];
      eventTypes.forEach(type => {
        const listener = (e) => {
          const target = e.target.closest('[data-on]');
          if (!target) return;
          
          const eventData = target.dataset.on;
          if (!eventData) return;
          
          // Parse event:action pairs
          eventData.split(',').forEach(pair => {
            const [event, actionName] = pair.split(':').map(s => s.trim());
            
            if (event === e.type && this._actions[actionName]) {
              try {
                this._actions[actionName](e);
              } catch (err) {
                console.error(`[${definition.name}] Error calling ${actionName}:`, err);
              }
            }
          });
        };
        
        this.shadowRoot.addEventListener(type, listener, { passive: ['input', 'scroll'].includes(type) });
        
        // Store for cleanup
        if (!this._eventListeners) this._eventListeners = [];
        this._eventListeners.push({ target: this.shadowRoot, type, listener });
      });
      
      console.log(`[${definition.name}] ✓ Event handlers ready`);
    }
  }

  // Register the custom element
  customElements.define(definition.name, ResumableComponent);
}
