import { untilUpdated } from '../../testUtils';

test('should render pages', async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  const element = await page.$('#test');

  expect(await element.textContent()).toBe('IndexPage');
});

test('Helmet should work', async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  const title = await page.title();
  expect(title).toBe('Hello World');
});

test('ssr should work', async () => {
  await untilUpdated(() => page.textContent('#hydration-test'), 'server-rendered');
});

test('Hydration should work', async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  await untilUpdated(() => page.textContent('#hydration-test'), 'hydrated');
});

