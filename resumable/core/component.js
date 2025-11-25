// resumable/core/component.js
import { signal, computed } from './signals.js';

/**
 * Defines a component's structure and behavior in a declarative, isomorphic way.
 * This function returns a factory that produces a plain JavaScript object containing
 * the component's definition, which is used by both SSR and the client runtime.
 */
export function component(definition) {
  return function componentFactory(props = {}) {
    // 1. Validate and apply default props
    const finalProps = {};
    if (definition.props) {
      for (const key in definition.props) {
        const propDef = definition.props[key];
        const value = props[key];
        if (value === undefined) {
          if (propDef.required) console.warn(`Component property "${key}" is required.`);
          finalProps[key] = propDef.default;
        } else {
          finalProps[key] = value;
        }
      }
    }

    // 2. Initialize state for SSR.
    let initialState = {};
    let stateProxy = {};
    if (definition.state) {
      const stateDef = definition.state(finalProps);
      const tempState = {}; // Will hold all resolved state values.
      const computeds = {};
      const signals = {};

      // First pass: resolve all signals and store computed objects.
      for (const key in stateDef) {
        const s = stateDef[key];
        if (s && s._isComputed) {
          computeds[key] = s;
        } else if (s && (typeof s.value !== 'undefined' || s._value !== undefined)) {
          // It's a signal, so store its initial value.
          tempState[key] = s.value !== undefined ? s.value : s._value;
          signals[key] = s; // Keep reference to signal for proxy
        }
      }

      // Create a proxy that provides access to signal values
      stateProxy = new Proxy(tempState, {
        get(target, prop) {
          if (prop in target) {
            return target[prop];
          }
          if (prop in signals) {
            return signals[prop];
          }
          if (prop in computeds) {
            return computeds[prop];
          }
          return undefined;
        }
      });

      // Second pass: resolve all computeds. Accessing .value will
      // trigger the lazy getter, resolving dependencies in order.
      for (const key in computeds) {
        tempState[key] = computeds[key].value;
      }
      initialState = tempState;
    }

    // 3. The component instance description is a plain object.
    // Create a state object that mimics signal access for the view function
    const stateForView = new Proxy(initialState, {
      get(target, prop) {
        const value = target[prop];
        // If it looks like a signal (has a .value property), return it as-is
        // Otherwise wrap it as a simple signal-like object
        if (value && typeof value === 'object' && 'value' in value) {
          return value;
        }
        // For plain values, wrap them to provide consistent .value access
        return { value };
      }
    });

    return {
      name: definition.name,
      props: finalProps,
      state: stateForView,
      _serializedState: initialState, // Keep unwrapped state for serialization
      actions: definition.actions || {},
      view: definition.view,
      style: definition.style,
      _definition: definition, // Pass raw definition for client runtime
    };
  };
}
