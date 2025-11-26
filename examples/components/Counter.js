// examples/components/Counter.js
import { component } from '../../resumable/core/component.js';
import { signal } from '../../resumable/core/signals.js';
import { html, css } from '../../resumable/core/template.js';

export const Counter = component({
  name: 'demo-counter',

  props: {
    initialValue: { type: Number, default: 0 },
  },

  state: (props) => ({
    count: signal(props.initialValue || 0),
  }),

  actions: (componentInstance) => {
    const state = componentInstance._state;
    return {
      increment() {
        state.count.value += 1;
      },
      decrement() {
        state.count.value -= 1;
      },
      reset() {
        state.count.value = 0;
      },
    };
  },

  view: ({ state, actions }) => html`
    <div class="counter-container">
      <h2>Counter Demo</h2>
      <div class="counter-display">
        <p>Count: <strong>${state.count.value}</strong></p>
      </div>
      <div class="counter-controls">
        <button data-on="click:decrement" class="btn btn-primary">-</button>
        <button data-on="click:increment" class="btn btn-primary">+</button>
        <button data-on="click:reset" class="btn btn-secondary">Reset</button>
      </div>
    </div>
  `,

  style: css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    .counter-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      color: white;
      max-width: 300px;
      margin: 1rem auto;
    }
    
    .counter-container h2 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    
    .counter-display {
      background: rgba(255, 255, 255, 0.1);
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      text-align: center;
    }
    
    .counter-display p {
      margin: 0;
      font-size: 1.1rem;
    }
    
    .counter-display strong {
      font-size: 2rem;
      display: block;
      margin-top: 0.5rem;
    }
    
    .counter-controls {
      display: flex;
      gap: 0.5rem;
    }
    
    .btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: white;
      color: #667eea;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `,
});
