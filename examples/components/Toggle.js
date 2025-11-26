// examples/components/Toggle.js
import { component } from '../../resumable/core/component.js';
import { signal } from '../../resumable/core/signals.js';
import { html, css } from '../../resumable/core/template.js';

export const Toggle = component({
  name: 'demo-toggle',

  props: {
    label: { type: String, default: 'Feature' },
    initialState: { type: Boolean, default: false },
  },

  state: (props) => ({
    enabled: signal(props.initialState || false),
  }),

  actions: (componentInstance) => {
    const state = componentInstance._state;
    return {
      toggle() {
        state.enabled.value = !state.enabled.value;
      },
    };
  },

  view: ({ state, actions }) => html`
    <div class="toggle-container">
      <h3>Toggle Demo</h3>
      <div class="toggle-group">
        <label class="toggle-label">
          <input
            type="checkbox"
            class="toggle-input"
            ${state.enabled.value ? 'checked' : ''}
            data-on="change:toggle"
          />
          <span class="toggle-slider"></span>
          <span class="toggle-text">${state.enabled.value ? 'ON' : 'OFF'}</span>
        </label>
      </div>
      <p class="toggle-status">
        Status: <strong>${state.enabled.value ? '✓ Enabled' : '✗ Disabled'}</strong>
      </p>
    </div>
  `,

  style: css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    .toggle-container {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      color: white;
      max-width: 300px;
      margin: 1rem auto;
    }
    
    .toggle-container h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.3rem;
    }
    
    .toggle-group {
      margin-bottom: 1rem;
    }
    
    .toggle-label {
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      transition: background 0.2s;
    }
    
    .toggle-label:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .toggle-input {
      display: none;
    }
    
    .toggle-slider {
      width: 50px;
      height: 26px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 13px;
      position: relative;
      display: inline-block;
      transition: background 0.3s;
    }
    
    .toggle-slider::before {
      content: '';
      position: absolute;
      width: 22px;
      height: 22px;
      background: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: left 0.3s;
    }
    
    .toggle-input:checked + .toggle-slider {
      background: rgba(255, 255, 255, 0.7);
    }
    
    .toggle-input:checked + .toggle-slider::before {
      left: 26px;
    }
    
    .toggle-text {
      font-weight: 600;
      min-width: 40px;
    }
    
    .toggle-status {
      margin: 0;
      text-align: center;
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.15);
      padding: 0.75rem;
      border-radius: 4px;
    }
    
    .toggle-status strong {
      font-size: 1.1rem;
    }
  `,
});
