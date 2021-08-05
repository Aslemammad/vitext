import { OrbitControls, Stage } from '@react-three/drei';
import { Canvas, PrimitiveProps } from '@react-three/fiber';
import { ComponentType, lazy, Suspense, useRef } from 'react';

const Model: ComponentType<PrimitiveProps> = lazy(
  () => import('../../components/Model')
);

const Loading = () => <p>Loading the Ruby 💎</p>;

const Ruby = ({ id }) => {
  const ref = useRef();

  return (
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
  );
};

export default function ({ slug }) {
  // const
  const Rubies = [];

  for (let i = 0; i < (Math.abs(Number(slug)) || 1); i++) {
    Rubies.push(<Ruby id={i} key={i} />);
  }
  return (
    <>
      <p>Dynamicly loaded using React.lazy & Suspense</p>

      <div>{...Rubies}</div>
    </>
  );
}

export function getProps({ params }) {
  return { props: params };
}
