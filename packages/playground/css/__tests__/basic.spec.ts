import { untilUpdated, getBgc } from "../../testUtils";

test('should return color', async () => {
  await page.goto(viteTestUrl)
  untilUpdated(() => page.textContent('p'), 'hello');

  expect(await getBgc('#bg-red')).toBe('rgb(248, 113, 113)');
});
