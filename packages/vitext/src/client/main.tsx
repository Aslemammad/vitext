import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HelmetProvider } from 'react-helmet-async';

// eslint-disable-next-line
import App from '/@vitext/_app';

const root = document.getElementById('root');
const initialData = document.getElementById('__DATA')?.textContent;
window.__DATA = JSON.parse(initialData!);

const ComponentPromise = import(
  `./@vitext/hack-import${window.__DATA.pageClientPath}.js`
);

async function render() {
  const props = window.__DATA.props[window.__DATA.pageClientPath];

  const Component = (await ComponentPromise).default;

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
