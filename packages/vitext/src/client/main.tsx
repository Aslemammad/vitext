import React from 'react';
import * as ReactDOM from 'react-dom';
// @ts-ignore
import { HelmetProvider } from 'react-helmet-async/lib/index.modern.js';

const root = document.getElementById('root');
const initialData = document.getElementById('__DATA')?.textContent;
window.__DATA = initialData ? JSON.parse(initialData!) : undefined;

(async function () {
  if (!window.__DATA) {
    return;
  }

  // @ts-ignore
  const App = (await import('./@vitext/_app')).default;

  async function render() {
    const props = window.__DATA.props[window.__DATA.pageClientPath];

    const Component = (
      await import(`./@vitext/hack-import${window.__DATA.pageClientPath}.js`)
    ).default;

    const element = (
      <HelmetProvider>
        <App Component={Component} props={props} />
      </HelmetProvider>
    );

    if (import.meta.env.DEV) {
      ReactDOM.render(element, root);
    } else {
      ReactDOM.hydrate(element, root);
    }
  }

  render();
})();
