import { untilUpdated, editFile, isBuild } from '../../testUtils';

if (!isBuild) {
  test('Editing a page', async () => {
    await untilUpdated(() => page.textContent('#test'), 'IndexPage');
    editFile('pages/index.tsx', (code) =>
      code.replace(
        '<div id="test">IndexPage</div>',
        '<div id="test">IndexPage hmr</div>'
      )
    );
    await untilUpdated(
      () => page.textContent('#hmr-test-page'),
      'IndexPage hmr'
    );
  });

  test('Editing a component', async () => {
    await untilUpdated(() => page.textContent('#test'), 'IndexPage');
    editFile('components/Component.tsx', (code) =>
      code.replace('<>loaded</>', '<>loaded hmr</>')
    );
    await untilUpdated(
      () => page.textContent('#hmr-test-component'),
      'loaded hmr'
    );
  });
}
