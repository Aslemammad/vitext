import { untilUpdated, isBuild, readFile } from '../../testUtils';

const timeout = (num: number) => new Promise((res) => setTimeout(res, num));

test('paths & params should work', async () => {
  await page.goto(viteTestUrl + '/1');
  await untilUpdated(() => page.textContent('#test'), '1');

  await page.goto(viteTestUrl + '/2');
  await untilUpdated(() => page.textContent('#test'), '2');
});

if (isBuild) {
  test('route exporting should work', async () => {
    await timeout(2000);
    await untilUpdated(() => page.textContent('#test-export'), 'exporting');
    await untilUpdated(() => page.textContent('#test'), '1');
    await page.goto(viteTestUrl + '/users/2');
    await untilUpdated(() => page.textContent('#test'), '2');
    await untilUpdated(() => page.textContent('#test-export'), 'exporting');
  });

  test('route html should work', async () => {
    await timeout(2000);
    const manifest = JSON.parse(readFile('dist/out/users/[slug]/manifest.json'))

    const firstHTML = readFile('dist/out/users/[slug]/0.html')
    expect(firstHTML.includes(manifest[0].slug)).toBe(true)
    expect(firstHTML.includes('exporting')).toBe(true)

    const secondHTML = readFile('dist/out/users/[slug]/1.html')
    expect(secondHTML.includes(manifest[1].slug)).toBe(true)
    expect(secondHTML.includes('exporting')).toBe(true)
  });

  test('route pre-exporting should work', async () => {
    await page.goto(viteTestUrl + '/users/1');
    await untilUpdated(() => page.textContent('#test-export'), 'not-exporting');
  });

}
