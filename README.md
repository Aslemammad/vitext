# 📘 vite-plugin-react-page

[vite-plugin-react-page](https://vitejs.github.io/vite-plugin-react-pages) (vite-pages) is a React app framework powered by [vite](https://github.com/vitejs/vite). It is very suitable for:

- blog site
- documentation site for your library or product
- stories(demos) development for your React components(like [storybook](https://storybook.js.org/))

It provides many features that help developers **build a React App quickly**:

- **Fantastic development experience**. Start the local development server in a blink, even when you have many pages. Hot module replacement works with React and Mdx, so you can get instant feedback when you edit your code.
- **Filesystem based routing**. By following a [simple filesystem routing convention](https://vitejs.github.io/vite-plugin-react-pages/fs-routing), It is easy to create, locate and develop pages. You don't need to worry about routing configuration. For advanced users, [you can tell vite-pages how to find page files](https://vitejs.github.io/vite-plugin-react-pages/advanced-fs-routing), so that vite-pages can work with any project file structure.
- **Support Mdx**. You can write content with either "normal React" or [Mdx](https://mdxjs.com/). Normal Reactjs is more flexible and composable. While Mdx is more readable and easy to edit. You can choose the proper format for your task. These formats can import each other like normal esModules.
- **Powerful [theme customization](https://vitejs.github.io/vite-plugin-react-pages/theme)**. Vite-pages itself doesn't render any concrete DOM node. You can customize **anything** on the page with theme. It is easy to write a theme that is sharable and configurable. If you use typescript, the users of your theme will get type-check and intelliSense.
- **Automatic code splitting based on pages**. Visitors don't need to download the whole app, they only load page data as needed.
- **Support SSR out of the box**. By pre-rendering your app into HTML at buildtime, users can see the content before any JS is loaded.

## Getting stated

1. Initialize a vite-pages project:
   - execute `npm init vite-pages app-demo --template app` to initialize an app project, or
   - execute `npm init vite-pages library-demo --template lib` to initialize a library project, or
   - execute `npm init vite-pages library-monorepo-demo --template lib-monorepo` to initialize a library project with monorepo setup.
2. `npm install`
3. `npm run dev` and play with the local dev envirenment.
4. `npm run build`.
5. `npm run ssr`. You can [disable javascript in your browser](https://developers.google.com/web/tools/chrome-devtools/javascript/disable), to verify if it can still render.
