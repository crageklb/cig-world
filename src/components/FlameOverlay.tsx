import { Canvas } from '@react-three/fiber';
import LighterFlame from './LighterFlame';

interface FlameOverlayProps {
  active: boolean;
  position: [number, number, number];
  velocity: [number, number, number];
}

export default function FlameOverlay({ active, position, velocity }: FlameOverlayProps) {
  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[25] pointer-events-none"
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        className="w-full h-full"
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
      >
        <LighterFlame position={position} velocity={velocity} intensity={0.3} />
      </Canvas>
    </div>
  );
}
