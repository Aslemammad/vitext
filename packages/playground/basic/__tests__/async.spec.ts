import { untilUpdated } from '../../testUtils';

test('dynamic component with server rendering', async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  await untilUpdated(() => page.textContent('#dynamic-server-test'), 'loaded');
  await untilUpdated(() => page.textContent('#dynamic-server-test'), 'loading');
  await untilUpdated(() => page.textContent('#dynamic-server-test'), 'loaded');
});

test('dynamic component with no server rendering', async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  await untilUpdated(
    () => page.textContent('#dynamic-no-server-test'),
    'loading'
  );
  await untilUpdated(
    () => page.textContent('#dynamic-no-server-test'),
    'loaded'
  );
});

test('suspense support', async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  await untilUpdated(() => page.textContent('#suspense-test'), 'loading');
  await untilUpdated(() => page.textContent('#suspense-test'), 'loaded');
});
