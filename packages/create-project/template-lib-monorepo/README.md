## vite-pages library-monorepo starter

This is a demo project for [vitext](https://github.com/vitejs/vitext).
This project demonstrate how to develop libraries **in monorepo** using vite as your local develop envirenment.

# How to use

`yarn` (require yarn 1.x)

`cd packages/demos`

`yarn dev` You can play with demos of your packages in local develop envirenment.

Edit `packages/button/src/index.tsx` or other souce files, the demos will inflect your change instantly.
Edit `packages/button/demos/demo1.tsx` or other demo files, the demos will inflect your change instantly.

`yarn build` The demos are built and served.

`npm run ssr` The app are built into a static site (Static-Site Generation) and served.

---

Checkout [vitext](https://github.com/vitejs/vitext) for more info.
