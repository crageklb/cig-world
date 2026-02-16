import { useState, useRef } from 'react';
import { IconContext, Lightning } from '@phosphor-icons/react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Cigarette from './components/Cigarette';
import { AcceleratedZoom } from './components/AcceleratedZoom';
import TargetedSpotlight from './components/TargetedSpotlight';
import LighterFlame from './components/LighterFlame';
import * as THREE from 'three';

// Component to handle flame interaction and collision detection
function FlameInteraction({
  onCigaretteLit,
  cigarettePosition = [0, 0, 5],
}: {
  onCigaretteLit: () => void;
  cigarettePosition?: [number, number, number];
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
        position={cigarettePosition}
      />
    </>
  );
}

function App() {
  const [, setShowDare] = useState(false);

  // Cigarette position [x, y, z] - positive y moves up
  const cigarettePosition: [number, number, number] = [0, 0.6, 5];

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
    <IconContext.Provider value={{ color: 'currentColor', size: 20, weight: 'light' }}>
    <div className="w-full h-dvh relative overflow-hidden">
      {/* Noise overlay - fixed, visible at all scroll positions */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.15] z-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1200 1200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Hero section */}
      <section className="relative h-[70vh]">
      {/* CSS Animated blurry gradient smoke effect - multiple layers */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Layer 1 */}
        <div 
          className="absolute"
          style={{
            top: '20%',
            left: '15%',
            width: '50%',
            height: '60%',
            background: 'radial-gradient(ellipse 70% 55% at 40% 45%, rgba(140, 140, 150, 0.85) 0%, transparent 65%)',
            filter: 'blur(80px)',
            animation: 'smokeFloat1 25s ease-in-out infinite',
          }}
        />
        {/* Layer 2 */}
        <div 
          className="absolute"
          style={{
            top: '40%',
            left: '55%',
            width: '45%',
            height: '55%',
            background: 'radial-gradient(ellipse 60% 80% at 55% 50%, rgba(120, 125, 135, 0.8) 0%, transparent 60%)',
            filter: 'blur(100px)',
            animation: 'smokeFloat2 30s ease-in-out infinite',
          }}
        />
        {/* Layer 3 */}
        <div 
          className="absolute"
          style={{
            top: '10%',
            left: '40%',
            width: '55%',
            height: '50%',
            background: 'radial-gradient(ellipse 75% 45% at 50% 55%, rgba(130, 135, 145, 0.75) 0%, transparent 55%)',
            filter: 'blur(90px)',
            animation: 'smokeFloat3 35s ease-in-out infinite',
          }}
        />
        {/* Layer 4 */}
        <div 
          className="absolute"
          style={{
            top: '50%',
            left: '10%',
            width: '40%',
            height: '65%',
            background: 'radial-gradient(ellipse 50% 70% at 45% 40%, rgba(110, 115, 125, 0.7) 0%, transparent 65%)',
            filter: 'blur(110px)',
            animation: 'smokeFloat4 28s ease-in-out infinite',
          }}
        />
        {/* Layer 5 */}
        <div 
          className="absolute"
          style={{
            top: '5%',
            left: '65%',
            width: '48%',
            height: '52%',
            background: 'radial-gradient(ellipse 65% 50% at 50% 60%, rgba(125, 130, 140, 0.78) 0%, transparent 58%)',
            filter: 'blur(95px)',
            animation: 'smokeFloat5 32s ease-in-out infinite',
          }}
        />
        {/* Layer 6 */}
        <div 
          className="absolute"
          style={{
            top: '30%',
            left: '25%',
            width: '52%',
            height: '58%',
            background: 'radial-gradient(ellipse 55% 75% at 48% 52%, rgba(115, 120, 130, 0.72) 0%, transparent 62%)',
            filter: 'blur(105px)',
            animation: 'smokeFloat6 27s ease-in-out infinite',
          }}
        />
        {/* Layer 7 */}
        <div 
          className="absolute"
          style={{
            top: '15%',
            left: '5%',
            width: '58%',
            height: '48%',
            background: 'radial-gradient(ellipse 80% 48% at 42% 58%, rgba(135, 138, 148, 0.82) 0%, transparent 56%)',
            filter: 'blur(88px)',
            animation: 'smokeFloat7 33s ease-in-out infinite',
          }}
        />
        {/* Layer 8 */}
        <div 
          className="absolute"
          style={{
            top: '45%',
            left: '50%',
            width: '46%',
            height: '62%',
            background: 'radial-gradient(ellipse 58% 68% at 52% 46%, rgba(108, 112, 122, 0.68) 0%, transparent 64%)',
            filter: 'blur(98px)',
            animation: 'smokeFloat8 29s ease-in-out infinite',
          }}
        />
        {/* Layer 9 */}
        <div 
          className="absolute"
          style={{
            top: '25%',
            left: '70%',
            width: '42%',
            height: '56%',
            background: 'radial-gradient(ellipse 62% 52% at 55% 48%, rgba(118, 122, 132, 0.76) 0%, transparent 59%)',
            filter: 'blur(92px)',
            animation: 'smokeFloat1 31s ease-in-out infinite reverse',
          }}
        />
        {/* Layer 10 */}
        <div 
          className="absolute"
          style={{
            top: '35%',
            left: '0%',
            width: '50%',
            height: '70%',
            background: 'radial-gradient(ellipse 68% 58% at 38% 54%, rgba(128, 132, 142, 0.8) 0%, transparent 61%)',
            filter: 'blur(102px)',
            animation: 'smokeFloat2 26s ease-in-out infinite reverse',
          }}
        />
      </div>
      
      {/* Title - below cigarette */}
      <div className="title-intro absolute left-1/2 -translate-x-1/2 pointer-events-none z-5 w-full px-5" style={{ top: 'max(14rem, env(safe-area-inset-top) + 12rem)' }}>
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

      {/* Subtitle */}
      <div className="subtitle-intro absolute left-1/2 -translate-x-1/2 bottom-[20%] pointer-events-none z-5 w-full px-12">
        <p className="text-white/70 text-xl md:text-base text-center tracking-tight">
          An experience inspired by Giuseppe Corrado Calvo
        </p>
      </div>
      
      {/* 3D Canvas for cigarette */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        className="z-20 absolute inset-0"
      >
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
          cigarettePosition={cigarettePosition}
        />
        
        {/* Camera controls - zoom disabled, using custom AcceleratedZoom */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate={false}
        />
      </Canvas>
      </section>

      {/* Mobile: fixed buttons peeking from bottom */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-6 py-4 flex flex-row items-end justify-center gap-0 cards-slide-up"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom) + 0.5rem)' }}
      >
        <a
          href="#"
          className="card-dare flex-1 max-w-[48%] flex flex-col items-center justify-start gap-3 p-4 rounded-2xl bg-[#242424] border border-white/10 text-white text-lg
            hover:bg-[#2d2d2d] active:bg-[#3e3e3e] shadow-lg transition-colors min-w-0"
        >
          <span>Dare</span>
          <img
            src="/Subject%203.png"
            alt=""
            className="w-36 h-auto object-contain [filter:drop-shadow(0.5px_0_0_white)_drop-shadow(-0.5px_0_0_white)_drop-shadow(0_0.5px_0_white)_drop-shadow(0_-0.5px_0_white)_drop-shadow(0.5px_0.5px_0_white)_drop-shadow(-0.5px_-0.5px_0_white)_drop-shadow(0.5px_-0.5px_0_white)_drop-shadow(-0.5px_0.5px_0_white)]"
          />
        </a>
        <a
          href="#"
          className="card-smoke flex-1 max-w-[48%] flex flex-col items-center justify-start gap-3 p-4 rounded-2xl bg-[#242424] border border-white/10 text-white text-lg
            hover:bg-[#2d2d2d] active:bg-[#3e3e3e] shadow-lg transition-colors min-w-0 z-10"
        >
          <span>Smoke</span>
          <img
            src="/cig-subject.png"
            alt=""
            className="w-36 h-auto object-contain [filter:drop-shadow(0.375px_0_0_white)_drop-shadow(-0.375px_0_0_white)_drop-shadow(0_0.375px_0_white)_drop-shadow(0_-0.375px_0_white)_drop-shadow(0.375px_0.375px_0_white)_drop-shadow(-0.375px_-0.375px_0_white)_drop-shadow(0.375px_-0.375px_0_white)_drop-shadow(-0.375px_0.375px_0_white)]"
          />
        </a>
      </div>

      {/* Desktop: fixed nav on left */}
      <nav
        className="hidden md:flex fixed z-50 flex-col h-fit gap-4 top-1/2 -translate-y-1/2 left-0 ml-4 px-3 py-6
          bg-white/5 backdrop-blur-0 rounded-xl pointer-events-auto"
      >
        <a
          href="#"
          className="nav-item flex flex-row items-center justify-start gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-base
            hover:bg-white/20 active:bg-white/25 bg-white/10 border border-white/20 transition-colors"
        >
          <Lightning size={20} weight="light" className="shrink-0" />
          <span>Dare</span>
        </a>
      </nav>

      {/* Dare display - hidden for now */}
      {/* <DareDisplay visible={showDare} /> */}
    </div>
    </IconContext.Provider>
  );
}

export default App;
