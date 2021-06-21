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

test('Hydration should work', async () => {
  await untilUpdated(() => page.textContent('#test'), 'IndexPage');
  const element = await page.$('#hydration-test');
  expect(await element.textContent()).toBe('hydrated');
});

// if (!isBuild) {
// test('hmr', async () => {
//   await page.goto(viteTestUrl);
//   await untilUpdated(() => page.textContent('#root'), 'IndexPage');
//   // js hmr
//   editFile('pages/index$.tsx', (code) =>
//     code.replace(`<div>IndexPage</div>`, `<div>hmr works!</div>`)
//   );
//   await untilUpdated(() => page.textContent('#root'), 'hmr works!');
//
//   // css hmr
//   await page.goto(viteTestUrl + '/page1');
//   await untilUpdated(() => page.textContent('.page'), 'Page1');
//   const el = await page.$('.page');
//   await untilUpdated(() => getColor(el), 'blue');
//   editFile('pages/style.scss', (code) =>
//     code.replace(`color: blue`, `color: red`)
//   );
//   await untilUpdated(() => getColor(el), 'red');
//
//   // markdown hmr
//   await page.goto(viteTestUrl + '/dir/page3');
//   await page.waitForSelector('h2:first-of-type');
//   const headingEl = await page.$('h2:first-of-type');
//   expect(await headingEl.textContent()).toBe('Overview');
//   editFile('pages/dir/page3$.md', (code) =>
//     code.replace(`## Overview`, `## HMR works!`)
//   );
//   await untilUpdated(() => headingEl.textContent(), 'HMR works!');
// });
// }
