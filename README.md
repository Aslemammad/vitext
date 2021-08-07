# Vitext ⚡🚀

> The Next.js like React framework for better User & Developer experience

-  💡 Instant Server Start
-   💥 Suspense support
-   ⚫ Next.js like API
-  📦 Optimized Build
-   💎 Build & Export on fly
-   🚀 Lightning SSG/SSR
-  ⚡  Fast HMR
-   🔑 Vite & Rollup Compatible

https://user-images.githubusercontent.com/37929992/128530290-41165a31-29a5-4108-825b-843a09059deb.mp4
```
npm install vitext
```

Vitext (Vite + Next) is a lightning fast SSG/SSR tool that lets you develop better and quicker front-end apps. It consists of these major parts:
 
### 💡 Instant Server Start
The development server uses native ES modules, So you're going to have your React app server-rendered and client rendered very fast, under a half a second for me.

###  💥 Suspense support
Vitext supports React Suspense & Lazy out of the box.  
```ts
import { lazy, Suspense } from 'react';

const Component = lazy(() => import('../components/Component'));
const Loading = () => <p>Loading the Component</p>;

const App = () => {
  return (
    <Suspense fallback={<Loading />}>
	  <Component />
    </Suspense>
  );
};
```

###   ⚫ Next.js like API
If you're coming from a Next.js background, everything will work the same way for you. Vitext has a similar API design to Next.js.
```ts
// pages/Page/[id].jsx
const Page = ({ id }) => {
  return <div>{id}</div>;
};

// build time + request time (SSG/SSR/ISR)
export function getProps({ req, res, query, params }) {
  // props for `Page` component
  return { props: { id: params.id } };
}

// build time (SSG)
export async function getPaths() {
  // an array of { params: ... }, which every `params` goes to `getProps`  
  return {
    paths: [{ id: 1 }],
  };
}

export default IndexPage;

```
> `getPaths` & `getProps` are optional. If `getPaths`' running got done, then every `paths` item is going to be passed to a `getProps` function, And when the user requests for the specific page, they're going to receive the exported html (SSG). But if `getPaths` wasn't done or there's no exported html page for the user's request, then the `getProps` is going to get called with the request url's params (SSR). 
###  📦 Optimized Build
Vitext uses Vite's building and bundling approach, So it bundles your code in a fast and optimized way.

###   💎 Build & Export on fly
You don't need to wait for HTML exports of your app because Vitext exports pages to HTML simultaneously while serving your app, So no `next export`.
 
###   🚀 Lightning SSR/SSG
ES modules, Fast compiles and Web workers empower the Vitext SSR/SSG strategy, so you'll have an astonishingly fast SSR/SSG.

###  ⚡ Fast HMR
Vitext uses [@vitejs/plugin-react-refresh](https://github.com/vitejs/vite/tree/main/packages/plugin-react-refresh) under the hood, So you have a fast HMR right here.

###   🔑 Vite & Rollup Compatible
We can call Vitext a superset of Vite; It means that Vitext supports everything Vite supports with `vitext.config.js`.
```ts
// exact Vite's config API 
export default {
  plugins: [...],
  optimizeDeps: {...},
  ...
};
```
## Examples
You can checkout [packages/examples](https://github.com/Aslemammad/vitext/tree/master/packages/examples) directory to see examples that have been implemented using vitext.

## Contribution

We're in the early stages now, So we need your help on Vitext; please try things out, recommend new features, and issue stuff. You can also check out the issues to see if you can work on some.

## License

MIT
