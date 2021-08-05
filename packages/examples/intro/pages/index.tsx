import { OrbitControls, Stage } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { lazy, Suspense, useRef, useState } from 'react';

const Model = lazy(() => import('../components/Model'));

const Loading = () => <p>Loading the Ruby 💎</p>;

const IndexPage = () => {
  const ref = useRef();
  const [number, setNumber] = useState(0);
  return (
    <div>
      <p className="text-4xl">⚡🚀</p>
      <p>
        <a
          className="text-2xl font-bold text-red-600 font-display"
          rel="noreferrer"
          href="https://github.com/aslemammad/vitext"
          target="_blank"
        >
          Vitext
        </a>
      </p>

      <p>The Next.js like React framework for Speed</p>

      <ul className="m-4">
        <li>💡 Instant Server Start</li>
        <li>💥 Suspense support</li>
        <li>⚫ Next.js like API</li>
        <li>📦 Optimized Build</li>
        <li>💎 Build & Export on fly</li>
        <li>🚀 Lightning SSG/SSR</li>
        <li>🔑 Vite & Rollup Compatible</li>
      </ul>

      <p
        id="input"
        className="w-full sm:w-2/4 px-4 py-2 text-center bg-transparent rounded-sm border-white m-auto text-gray-500"
      >
        How many rubies do you want?
      </p>
      <span className="text-3xl block">{number}</span>
      <div className="flex flex-row justify-center align-middle">
        <button
          className="w-24 bg-gray-600 p-1 mr-4 rounded-sm"
          onClick={() => setNumber((prevNum) => prevNum + 1)}
        >
          increase
        </button>
        <a className="w-24 bg-red-600 p-1 cursor-pointer rounded-sm outline-none" href={`/ruby/${number}`}>return</a>
        <button
          className="w-24 ml-4 bg-gray-600 p-1 rounded-sm"
          onClick={() => setNumber((prevNum) => prevNum - 1)}
        >
          decrease
        </button>
      </div>

      <div className="mt-8">
        <Suspense fallback={<Loading />}>
          <Canvas shadows dpr={[1, 2]} camera={{ fov: 30 }}>
            <Suspense fallback={null}>
              <Stage
                controls={ref}
                preset="rembrandt"
                intensity={1}
                environment="city"
              >
                <Model />
              </Stage>
            </Suspense>
            <OrbitControls ref={ref} autoRotate />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
};

export default IndexPage;
