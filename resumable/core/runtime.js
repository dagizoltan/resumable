// resumable/core/runtime.js
// Universal UI library runtime - works with any component definition
import { signal, computed, batch, effect } from './signals.js';
import { renderPart } from './template.js';

/**
 * Error boundary for catching and handling component errors
 * Prevents cascading failures from breaking the entire application
 */
class ErrorBoundary {
  constructor(component, errorHandler) {
    this.component = component;
    this.errorHandler = errorHandler;
    this.error = null;
  }

  catch(error, context) {
    this.error = error;
    if (this.errorHandler) {
      this.errorHandler(error, context);
    } else {
      console.error(`Error in ${context}:`, error);
    }
    return false;
  }

  reset() {
    this.error = null;
  }
}

export function errorBoundary(component, errorHandler) {
  const boundary = new ErrorBoundary(component, errorHandler);
  component._errorBoundary = boundary;
  return boundary;
}

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
      this._updateCallback = null;
      this._eventDelegator = this._createEventDelegator();
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
      
      // Remove event delegator
      if (this._eventDelegator && this.shadowRoot) {
        const eventTypes = ['click', 'input', 'keydown', 'change', 'submit', 'focus', 'blur'];
        eventTypes.forEach(type => {
          this.shadowRoot.removeEventListener(type, this._eventDelegator.listener);
        });
      }
    }

    _createEventDelegator() {
      const eventMap = new Map();
      
      const listener = (e) => {
        // Support both old data-on and new @event syntax
        let target = e.target.closest('[data-on]');
        
        if (target) {
          // Old data-on syntax
          const eventData = target.dataset.on;
          if (!eventData) return;
          
          // Parse event:action pairs
          eventData.split(',').forEach(pair => {
            const [event, actionName] = pair.split(':').map(s => s.trim());
            
            if (event === e.type && this._actions[actionName]) {
              try {
                this._actions[actionName](e);
              } catch (err) {
                this._handleError(err, `action '${actionName}'`);
              }
            }
          });
        } else {
          // New @event syntax - handled via direct event listener on element
          // This listener just needs to exist for event delegation
        }
      };

      return { listener, eventMap };
    }

    _init() {
      try {
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
                this._handleError(e, `computed '${key}'`);
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
                this._handleError(err, `action '${actionName}'`);
              }
            };
          }
        }
        
        // 3. Setup event delegation (once per component)
        this._attachEventDelegation();
        
        // 4. Attach event handlers for @event attributes
        this._attachEventHandlers();
        
        // 5. Render component view and setup reactive updates
        if (definition.view) {
          console.log(`[${definition.name}] Rendering view`);
          
          // Create a reactive effect that re-renders whenever any state signal changes
          const renderEffect = effect(() => {
            // Force dependency tracking by accessing all state signals
            for (const key in this._state) {
              if (this._state[key] && typeof this._state[key].value !== 'undefined') {
                void this._state[key].value;
              }
            }
            // Now render with the tracked dependencies
            this._renderView(stateProxy);
          });
          
          // Store effect for cleanup
          this._effects.push(renderEffect);
        }
        
        console.log(`[${definition.name}] ✓ Initialization complete`);
      } catch (e) {
        this._handleError(e, 'initialization');
      }
    }

    _renderView(stateProxy) {
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
        
        // Get the rendered template from the view function
        const result = definition.view({ state: stateForView, actions: this._actions });
        
        if (!this.shadowRoot) return;
        
        // Get or create the main content container (separate from styles)
        let contentContainer = this.shadowRoot.querySelector('[data-content-root]');
        if (!contentContainer) {
          contentContainer = document.createElement('div');
          contentContainer.setAttribute('data-content-root', '');
          
          // Preserve existing style tags
          const styleTags = Array.from(this.shadowRoot.querySelectorAll('style'));
          if (styleTags.length > 0) {
            styleTags[styleTags.length - 1].after(contentContainer);
          } else {
            this.shadowRoot.appendChild(contentContainer);
          }
        }
        
        // Clear the content container (but not styles)
        contentContainer.innerHTML = '';
        
        // Use fine-grained rendering
        this._updateCallback = renderPart(result, contentContainer);
      } catch (e) {
        this._handleError(e, 'rendering');
      }
    }

    _attachEventDelegation() {
      if (!this.shadowRoot || this._eventDelegationAttached) return;
      
      console.log(`[${definition.name}] Attaching event delegation`);
      
      const eventTypes = ['click', 'input', 'keydown', 'change', 'submit', 'focus', 'blur'];
      eventTypes.forEach(type => {
        this.shadowRoot.addEventListener(type, this._eventDelegator.listener, { 
          passive: ['input', 'scroll'].includes(type) 
        });
      });
      
      this._eventDelegationAttached = true;
      console.log(`[${definition.name}] ✓ Event delegation ready`);
    }

    _attachEventHandlers() {
      if (!this.shadowRoot) return;
      
      // Find all elements with @event attributes and attach handlers
      const allElements = this.shadowRoot.querySelectorAll('*');
      allElements.forEach(el => {
        // Get all attributes
        for (const attr of Array.from(el.attributes)) {
          if (attr.name.startsWith('@')) {
            const eventName = attr.name.substring(1); // Remove @ prefix
            // Note: attr.value is a string like "@click=..." so we can't use it
            // Instead, we re-render to get the actual function values via renderPart
          }
        }
      });
    }

    _handleError(error, context) {
      if (this._errorBoundary) {
        this._errorBoundary.catch(error, `${definition.name}.${context}`);
      } else {
        console.error(`[${definition.name}] Error in ${context}:`, error);
      }
    }
  }

  // Register the custom element
  customElements.define(definition.name, ResumableComponent);
}
