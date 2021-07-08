import { untilUpdated } from '../../testUtils';

test('should navigate correctly index', async () => {
  await page.goto(viteTestUrl + '/page1')
  await untilUpdated(() => page.textContent('#test'), 'Page1');
});

test('should navigate correctly [[...slug]]', async () => {
  await page.goto(viteTestUrl + '/all')
  await untilUpdated(() => page.textContent('#test'), 'all');
});

test('should navigate correctly [[...slug]] 2', async () => {
  await page.goto(viteTestUrl + '/all/test')
  await untilUpdated(() => page.textContent('#test'), 'all');
});

test('should navigate correctly [...slug]', async () => {
  await page.goto(viteTestUrl + '/developer/test')
  await untilUpdated(() => page.textContent('#test'), 'developerId');
});

test('should navigate correctly index 2', async () => {
  await page.goto(viteTestUrl + '/users')
  await untilUpdated(() => page.textContent('#test'), 'usersIndex');
});

test('should navigate correctly [slug]', async () => {
  await page.goto(viteTestUrl + '/users/test')
  await untilUpdated(() => page.textContent('#test'), 'userId');
});
