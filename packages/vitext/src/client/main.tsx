import * as ReactDOM from 'react-dom';
import { HelmetProvider } from 'react-helmet-async';

import App from '/@vitext/_app';

const initialData = document.getElementById('__DATA')?.textContent;
window.__DATA = JSON.parse(initialData!);

const ComponentPromise = import(
  `./@vitext/hack-import${window.__DATA.pageClientPath}.js`
);

async function render() {

  const props = window.__DATA.props[window.__DATA.pageClientPath];

  const Component = (await ComponentPromise).default;

  ReactDOM.hydrate(
    <HelmetProvider>
      <App Component={Component} props={props} />
    </HelmetProvider>,
    document.getElementById('root')
  );
}

render();
