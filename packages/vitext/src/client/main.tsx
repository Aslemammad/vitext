import * as ReactDOM from 'react-dom';
import { HelmetProvider } from 'react-helmet-async';

import App from '/@vitext/_app';
import Component from '/@vitext/current-page';

const initialData = document.getElementById('__DATA')?.textContent;
window.__DATA = initialData ? JSON.parse(initialData) : undefined;

async function render() {
  ReactDOM.hydrate(
    <HelmetProvider>
      <App Component={Component} props={{}} />
    </HelmetProvider>,
    document.getElementById('root')
  );
}

render();
