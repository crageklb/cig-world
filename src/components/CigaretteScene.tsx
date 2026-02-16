import { useState, useRef, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Cigarette from './Cigarette';
import { AcceleratedZoom } from './AcceleratedZoom';
import TargetedSpotlight from './TargetedSpotlight';
import LighterFlame from './LighterFlame';
import * as THREE from 'three';
import { getPerformancePreset } from '../utils/deviceDetection';

function FlameInteraction({
  onCigaretteLit,
  cigarettePosition = [0, 0, 5],
  skipIntro = false,
}: {
  onCigaretteLit: () => void;
  cigarettePosition?: [number, number, number];
  skipIntro?: boolean;
}) {
  const { camera, gl, raycaster, pointer } = useThree();
  const [flameActive, setFlameActive] = useState(false);
  const [flamePosition, setFlamePosition] = useState<[number, number, number]>([0, 0, 5]);
  const [flameVelocity, setFlameVelocity] = useState<[number, number, number]>([0, 0, 0]);
  const [shouldLightCig, setShouldLightCig] = useState(false);
  const [cigLit, setCigLit] = useState(false);
  const [tipPos, setTipPos] = useState<THREE.Vector3 | null>(null);

  const previousPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const isDraggingFlame = useRef(false);
  const interactionPlaneRef = useRef<THREE.Mesh>(null);
  const collisionTimer = useRef(0);

  const updateFlamePosition = (clientX: number, clientY: number) => {
    const x = (clientX / gl.domElement.clientWidth) * 2 - 1;
    const y = -(clientY / gl.domElement.clientHeight) * 2 + 1;

    pointer.set(x, y);
    raycaster.setFromCamera(pointer, camera);

    const direction = raycaster.ray.direction.clone();
    const distance = 2.5;
    const point = camera.position.clone().add(direction.multiplyScalar(distance));

    const velocity: [number, number, number] = [
      point.x - previousPosition.current.x,
      point.y - previousPosition.current.y,
      point.z - previousPosition.current.z,
    ];

    setFlamePosition([point.x, point.y, point.z]);
    setFlameVelocity(velocity);
    previousPosition.current.copy(point);
  };

  const handlePointerDown = (e: { clientX: number; clientY: number; intersections: unknown[] }) => {
    if (e.intersections.length > 0) {
      const x = (e.clientX / gl.domElement.clientWidth) * 2 - 1;
      const y = -(e.clientY / gl.domElement.clientHeight) * 2 + 1;

      pointer.set(x, y);
      raycaster.setFromCamera(pointer, camera);

      const direction = raycaster.ray.direction.clone();
      const distance = 2.5;
      const point = camera.position.clone().add(direction.multiplyScalar(distance));

      setFlameActive(true);
      setFlamePosition([point.x, point.y, point.z]);
      previousPosition.current.copy(point);
      isDraggingFlame.current = true;

      const handleMove = (moveEvent: PointerEvent) => {
        if (isDraggingFlame.current) {
          updateFlamePosition(moveEvent.clientX, moveEvent.clientY);
        }
      };

      const handleUp = () => {
        isDraggingFlame.current = false;
        setFlameActive(false);
        setFlameVelocity([0, 0, 0]);
        collisionTimer.current = 0;
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    }
  };

  useFrame((_state, delta) => {
    if (flameActive && tipPos && !cigLit) {
      const flamePosVec = new THREE.Vector3(...flamePosition);
      const distance = flamePosVec.distanceTo(tipPos);

      if (distance < 0.4) {
        collisionTimer.current += delta;

        if (collisionTimer.current > 0.5) {
          setShouldLightCig(true);
          setCigLit(true);
          setFlameActive(false);
          onCigaretteLit();
        }
      } else {
        collisionTimer.current = 0;
      }
    }
  });

  return (
    <>
      <mesh
        ref={interactionPlaneRef}
        position={[0, 0, 5]}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {flameActive && (
        <LighterFlame
          position={flamePosition}
          velocity={flameVelocity}
          intensity={0.3}
        />
      )}

      <Cigarette
        onLit={onCigaretteLit}
        flameActive={flameActive}
        shouldLight={shouldLightCig}
        onTipPositionChange={setTipPos}
        position={cigarettePosition}
        skipIntro={skipIntro}
      />
    </>
  );
}

export interface CigaretteSceneProps {
  onCigaretteLit: () => void;
  cigarettePosition: [number, number, number];
  mainSpotlightPos: [number, number, number];
  rimLightPos: [number, number, number];
  fillLightPos: [number, number, number];
  frontFillLightPos: [number, number, number];
  mainSpotlightIntensity: number;
  rimLightIntensity: number;
  fillLightIntensity: number;
  frontFillLightIntensity: number;
  showLightIndicators: boolean;
  skipIntro?: boolean;
}

export default function CigaretteScene({
  onCigaretteLit,
  cigarettePosition,
  mainSpotlightPos,
  rimLightPos,
  fillLightPos,
  frontFillLightPos,
  mainSpotlightIntensity,
  rimLightIntensity,
  fillLightIntensity,
  frontFillLightIntensity,
  showLightIndicators,
  skipIntro = false,
}: CigaretteSceneProps) {
  const perfPreset = useMemo(() => getPerformancePreset(), []);

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      className="z-20 w-full h-full"
      dpr={perfPreset.isMobile ? [1, 1.5] : [1, 2]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <AcceleratedZoom />
      <ambientLight intensity={0.05} />
      <TargetedSpotlight
        position={mainSpotlightPos}
        targetPosition={[0, 0, 5]}
        angle={0.5}
        penumbra={0.8}
        intensity={mainSpotlightIntensity}
        color="#fff3e3"
        castShadow={perfPreset.enableShadows}
        shadowMapSize={1024}
      />
      {showLightIndicators && (
        <group position={mainSpotlightPos}>
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color="#fff3e3" />
          </mesh>
          <mesh rotation={[Math.PI, 0, 0]} position={[0, -2, 0]}>
            <coneGeometry args={[2, 4, 16, 1, true]} />
            <meshBasicMaterial color="#fff3e3" transparent opacity={0.1} side={2} />
          </mesh>
        </group>
      )}
      {!perfPreset.isMobile && (
        <>
          <TargetedSpotlight
            position={rimLightPos}
            targetPosition={[0, 0, 5]}
            angle={0.3}
            penumbra={0.9}
            intensity={rimLightIntensity}
            color="#ffeedd"
          />
          {showLightIndicators && (
            <group position={rimLightPos}>
              <mesh>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#ffeedd" />
              </mesh>
              <mesh rotation={[0, 0, -Math.PI / 2]} position={[-2, 0, 0]}>
                <coneGeometry args={[1.2, 4, 16, 1, true]} />
                <meshBasicMaterial color="#ffeedd" transparent opacity={0.1} side={2} />
              </mesh>
            </group>
          )}
          <pointLight position={fillLightPos} intensity={fillLightIntensity} color="#ffebd1" />
          {showLightIndicators && (
            <group position={fillLightPos}>
              <mesh>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#ffebd1" />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.8, 16, 16]} />
                <meshBasicMaterial color="#ffebd1" wireframe opacity={0.2} transparent />
              </mesh>
            </group>
          )}
          <pointLight position={frontFillLightPos} intensity={frontFillLightIntensity} color="#ffffff" />
          {showLightIndicators && (
            <group position={frontFillLightPos}>
              <mesh>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.8, 16, 16]} />
                <meshBasicMaterial color="#ffffff" wireframe opacity={0.2} transparent />
              </mesh>
            </group>
          )}
        </>
      )}
      <FlameInteraction
        onCigaretteLit={onCigaretteLit}
        cigarettePosition={cigarettePosition}
        skipIntro={skipIntro}
      />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        autoRotate={false}
      />
    </Canvas>
  );
}
