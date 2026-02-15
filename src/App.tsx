import { useState, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Cigarette from './components/Cigarette';
import VolumetricBackground from './components/VolumetricBackground';
import { AcceleratedZoom } from './components/AcceleratedZoom';
import TargetedSpotlight from './components/TargetedSpotlight';
import LighterFlame from './components/LighterFlame';
import * as THREE from 'three';

// Component to handle flame interaction and collision detection
function FlameInteraction({ 
  onCigaretteLit
}: { 
  onCigaretteLit: () => void;
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
  
  // Update flame position from mouse
  const updateFlamePosition = (clientX: number, clientY: number) => {
    // Convert screen coordinates to normalized device coordinates
    const x = (clientX / gl.domElement.clientWidth) * 2 - 1;
    const y = -(clientY / gl.domElement.clientHeight) * 2 + 1;
    
    pointer.set(x, y);
    raycaster.setFromCamera(pointer, camera);
    
    // Get a point at a fixed distance from camera (closer to camera)
    const direction = raycaster.ray.direction.clone();
    const distance = 2.5; // Reduced from 3 to 2.5 to bring flame closer
    const point = camera.position.clone().add(direction.multiplyScalar(distance));
    
    // Calculate velocity
    const velocity: [number, number, number] = [
      point.x - previousPosition.current.x,
      point.y - previousPosition.current.y,
      point.z - previousPosition.current.z,
    ];
    
    setFlamePosition([point.x, point.y, point.z]);
    setFlameVelocity(velocity);
    previousPosition.current.copy(point);
  };
  
  // Handle pointer down on interaction plane
  const handlePointerDown = (e: any) => {
    if (e.intersections.length > 0) {
      // Calculate position at fixed distance from camera
      const x = (e.clientX / gl.domElement.clientWidth) * 2 - 1;
      const y = -(e.clientY / gl.domElement.clientHeight) * 2 + 1;
      
      pointer.set(x, y);
      raycaster.setFromCamera(pointer, camera);
      
      const direction = raycaster.ray.direction.clone();
      const distance = 2.5; // Reduced from 3 to 2.5
      const point = camera.position.clone().add(direction.multiplyScalar(distance));
      
      setFlameActive(true);
      setFlamePosition([point.x, point.y, point.z]);
      previousPosition.current.copy(point);
      isDraggingFlame.current = true;
      
      // Add global listeners
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
  
  // Check collision between flame and cigarette tip
  useFrame((_state, delta) => {
    if (flameActive && tipPos && !cigLit) {
      const flamePosVec = new THREE.Vector3(...flamePosition);
      const distance = flamePosVec.distanceTo(tipPos);
      
      // If flame is close enough to tip
      if (distance < 0.4) {
        collisionTimer.current += delta;
        
        // Light cigarette after sustained contact
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
      {/* Invisible interaction plane for click detection */}
      <mesh
        ref={interactionPlaneRef}
        position={[0, 0, 5]}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Render flame when active */}
      {flameActive && (
        <LighterFlame
          position={flamePosition}
          velocity={flameVelocity}
          intensity={0.3}
        />
      )}
      
      {/* Pass lighting state to Cigarette */}
      <Cigarette
        onLit={onCigaretteLit}
        flameActive={flameActive}
        shouldLight={shouldLightCig}
        onTipPositionChange={setTipPos}
      />
    </>
  );
}

function App() {
  const [showDare, setShowDare] = useState(false);

  // Light positions - change these to move both light and indicator
  const mainSpotlightPos: [number, number, number] = [0, 3, 5]; // Directly above cigarette
  const rimLightPos: [number, number, number] = [6, 1, 5];
  const fillLightPos: [number, number, number] = [0, -2, 6];
  const frontFillLightPos: [number, number, number] = [-0.5, 0, 6]; // In front and to the left

  // Light intensities - change these to control light strength
  const mainSpotlightIntensity = 30;
  const rimLightIntensity = 10;
  const fillLightIntensity = 3;
  const frontFillLightIntensity = 2;

  // Show light indicators (spheres and cones) - set to true to show, false to hide
  const showLightIndicators = false;

  const handleCigaretteLit = () => {
    // Show dare after a short delay (let the smoke effect be visible first)
    setTimeout(() => {
      setShowDare(true);
    }, 1500);
  };

  return (
    <div 
      className="w-full h-screen relative overflow-hidden" 
      style={{
        background: `
          radial-gradient(ellipse 80% 40% at 50% 0%, rgba(139, 90, 43, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse 70% 35% at 50% 100%, rgba(160, 100, 40, 0.4) 0%, transparent 60%),
          radial-gradient(circle at center, #2a2a2a 20%, #000000 60%)
        `,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Noise overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Title */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-20 w-full px-5">
        <div 
          className="title-responsive"
          style={{
            fontFamily: "'Manufacturing Consent', sans-serif",
            color: 'white',
            textAlign: 'center',
            letterSpacing: '0em',
            lineHeight: '.7',
          }}
        >
          <div>Cig</div>
          <div>World</div>
        </div>
      </div>
      
      {/* 3D Canvas for cigarette */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        className="z-10 absolute inset-0"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        {/* Volumetric smoke background - fixed position, doesn't zoom */}
        <VolumetricBackground />
        
        {/* Custom accelerated zoom control */}
        <AcceleratedZoom />
        
        {/* Lighting */}
        <ambientLight intensity={0.05} />
        
        {/* Main softbox-style spotlight from above */}
        <TargetedSpotlight
          position={mainSpotlightPos}
          targetPosition={[0, 0, 5]}
          angle={0.5}
          penumbra={0.8}
          intensity={mainSpotlightIntensity}
          color="#fff3e3"
          castShadow
        />
        {/* Main spotlight indicator and cone */}
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
        
        {/* Rim light from side for definition */}
        <TargetedSpotlight
          position={rimLightPos}
          targetPosition={[0, 0, 5]}
          angle={0.3}
          penumbra={0.9}
          intensity={rimLightIntensity}
          color="#ffeedd"
        />
        {/* Rim light indicator and cone */}
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
        
        {/* Subtle fill light from below */}
        <pointLight position={fillLightPos} intensity={fillLightIntensity} color="#ffebd1" />
        {/* Fill light indicator - point light shows as sphere with glow lines */}
        {showLightIndicators && (
          <group position={fillLightPos}>
            <mesh>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshBasicMaterial color="#ffebd1" />
            </mesh>
            {/* Wireframe sphere to show omnidirectional light */}
            <mesh>
              <sphereGeometry args={[0.8, 16, 16]} />
              <meshBasicMaterial color="#ffebd1" wireframe opacity={0.2} transparent />
            </mesh>
          </group>
        )}
        
        {/* Front fill light - illuminates the front/top of cigarette */}
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
        
        {/* Flame interaction and cigarette */}
        <FlameInteraction
          onCigaretteLit={handleCigaretteLit}
        />
        
        {/* Camera controls - zoom disabled, using custom AcceleratedZoom */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate={false}
        />
      </Canvas>

      {/* Main content container */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 pointer-events-none z-10">
        <div className="w-full max-w-[700px] px-5 pointer-events-auto">
          {/* Buttons below cigarette */}
          <div className="flex flex-row sm:flex-row max-sm:flex-col gap-4">
            <button className="flex-1 px-16 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-colors">
              Dare
            </button>
            <button className="flex-1 px-16 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-colors">
              Piss
            </button>
            <button className="flex-1 px-16 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-colors">
              Smoke
            </button>
          </div>
        </div>
      </div>

      {/* Dare display - hidden for now */}
      {/* <DareDisplay visible={showDare} /> */}
    </div>
  );
}

export default App;
