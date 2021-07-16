import { untilUpdated } from '../../testUtils';

test('dynamic component with server rendering', async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  untilUpdated(() => page.textContent('#dynamic-server-test'), 'loaded');
  untilUpdated(() => page.textContent('#dynamic-server-test'), 'loading');
  untilUpdated(() => page.textContent('#dynamic-server-test'), 'loaded');
});

test('dynamic component with no server rendering', async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  untilUpdated(
    () => page.textContent('#dynamic-no-server-test'),
    'loading'
  );
  untilUpdated(
    () => page.textContent('#dynamic-no-server-test'),
    'loaded'
  );
});

test('suspense support', async () => {
  untilUpdated(() => page.textContent('#test'), 'IndexPage');
  untilUpdated(() => page.textContent('#suspense-test'), 'loading');
  untilUpdated(() => page.textContent('#suspense-test'), 'loaded');
});
