// examples/demo.js
import { component } from '../resumable/core/component.js';
import { html, css } from '../resumable/core/template.js';

export const DemoPage = component({
  name: 'demo-page',

  props: {},

  state: () => ({}),

  actions: () => ({}),

  view: () => html`
    <div class="demo-page">
      <header class="demo-header">
        <h1>Resumable Framework - Component Examples</h1>
        <p>Multiple independent components on a single page, powered by the same universal runtime</p>
      </header>

      <main class="demo-main">
        <section class="demo-section">
          <h2>Components Showcase</h2>
          
          <div class="components-grid">
            <div class="component-wrapper">
              <demo-counter data-component-name="demo-counter"></demo-counter>
            </div>
            
            <div class="component-wrapper">
              <demo-counter data-component-name="demo-counter"></demo-counter>
            </div>
            
            <div class="component-wrapper">
              <demo-toggle data-component-name="demo-toggle"></demo-toggle>
            </div>
            
            <div class="component-wrapper">
              <demo-toggle data-component-name="demo-toggle"></demo-toggle>
            </div>
            
            <div class="component-wrapper todo-app-wrapper">
              <todo-app data-component-name="todo-app"></todo-app>
            </div>
          </div>
        </section>

        <section class="demo-info">
          <h3>Architecture Highlights</h3>
          <ul>
            <li><strong>Universal Runtime:</strong> One runtime powers all components</li>
            <li><strong>Decoupled Components:</strong> Each component is independent</li>
            <li><strong>Reusable:</strong> Counter and Toggle rendered twice to show independence</li>
            <li><strong>SSR Ready:</strong> All components support server-side rendering</li>
            <li><strong>Lightweight:</strong> ~8KB framework, works with multiple components</li>
          </ul>
        </section>
      </main>
    </div>
  `,

  style: css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      color: #333;
    }

    .demo-page {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .demo-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .demo-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .demo-header p {
      margin: 0;
      font-size: 1.1rem;
      opacity: 0.95;
    }

    .demo-main {
      flex: 1;
      padding: 3rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .demo-section h2 {
      font-size: 1.8rem;
      margin-top: 0;
      margin-bottom: 2rem;
      color: #333;
      text-align: center;
    }

    .components-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .component-wrapper {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .component-wrapper:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .todo-app-wrapper {
      grid-column: 1 / -1;
    }

    .demo-info {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-top: 2rem;
    }

    .demo-info h3 {
      margin-top: 0;
      font-size: 1.4rem;
      color: #667eea;
    }

    .demo-info ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .demo-info li {
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }

    .demo-info li:last-child {
      border-bottom: none;
    }

    .demo-info strong {
      color: #667eea;
    }

    @media (max-width: 768px) {
      .demo-header {
        padding: 2rem 1rem;
      }

      .demo-header h1 {
        font-size: 1.5rem;
      }

      .demo-header p {
        font-size: 1rem;
      }

      .demo-main {
        padding: 1.5rem 1rem;
      }

      .components-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
});
