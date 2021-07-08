import { untilUpdated } from '../../testUtils';

test('paths & params should work', async () => {
  await page.goto(viteTestUrl + '/1')
  await untilUpdated(() => page.textContent('#test'), '1');

  await page.goto(viteTestUrl + '/2')
  await untilUpdated(() => page.textContent('#test'), '2');
});

