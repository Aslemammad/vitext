import { untilUpdated } from '../../testUtils';

test('should render pages with ssr props', async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  const element = await page.$('#test');

  expect(await element.textContent()).toBe('IndexPage');
});

