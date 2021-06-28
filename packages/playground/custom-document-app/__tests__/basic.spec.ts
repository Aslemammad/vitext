import { untilUpdated } from '../../testUtils';

test("Page shouldn't have window.__DATA", async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  expect(await page.evaluate('window.__DATA')).toBe(undefined);
});

test('App should inject meta element', async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  const element = await page.$('meta[name="description"]');
  expect(await element.getAttribute('content')).toBe('Test');
});
