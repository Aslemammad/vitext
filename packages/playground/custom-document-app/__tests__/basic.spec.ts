import { untilUpdated } from '../../testUtils';

test('Document should inject meta element', async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  const element = await page.$('meta[name="description"');
  expect(await element.textContent()).toBe('This is written in Document');
});
