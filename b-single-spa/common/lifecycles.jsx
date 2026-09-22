// Default imports on purpose: single-spa-react needs the complete React / ReactDOM objects.
// With `import * as`, webpack's production build trims the namespace to only the hooks used,
// dropping createElement/createRoot ("e.React.createElement is not a function").
import React from 'react';
import ReactDOMClient from 'react-dom/client';
import singleSpaReact from 'single-spa-react';

/**
 * Wraps a React component in Single-SPA lifecycles (bootstrap / mount / unmount).
 * Each app renders into its own <div> inside a slot of the root-config layout.
 */
export function createLifecycles(name, rootComponent, slotId = 'mfe-main') {
  return singleSpaReact({
    React,
    ReactDOMClient,
    rootComponent,
    domElementGetter: () => {
      const id = `single-spa-application:${name}`;
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        document.getElementById(slotId).appendChild(el);
      }
      return el;
    },
    // Render-time errors stay inside this app (load failures are handled by root-config).
    errorBoundary: () => (
      <div className="container page mfe-error" role="alert">
        <h2>This section is temporarily unavailable.</h2>
        <p className="muted">The “{name}” micro frontend crashed. The rest of the site still works.</p>
      </div>
    ),
  });
}
