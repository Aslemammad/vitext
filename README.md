* fix some stuff in Suspense 
* start the building part + serve
* Suspense support: new => always fallback in server 
* Dynamic: dynamic like nextjs
* Suspense support (failed)
  * progressive=false => no Hydrator component
  * server=false => no server side part
  * I'll use loadable and dynamic from nextjs, and inject those in the React package, so folks can use Suspense / React.lazy easily, I'll test react async ssr and stuff like that to render Suspense & ... easily
* Add getPaths implementation in DEV
* single distributed bundled executable file
* add hydration for ssg ( using saving ssr generated paths )





TODO after release: 
* progressive rendering
