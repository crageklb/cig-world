import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import SmokeEffect from './SmokeEffect';

interface CigaretteProps {
  onLit: () => void;
  onTipPositionChange?: (position: THREE.Vector3 | null) => void;
  flameActive?: boolean;
  shouldLight?: boolean;
  /** 3D position [x, y, z] - decrease y to move down on screen */
  position?: [number, number, number];
}

export default function Cigarette({ onLit, onTipPositionChange, flameActive = false, shouldLight = false, position = [0, 0, 5] }: CigaretteProps) {
  const [isLit, setIsLit] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const cigaretteRef = useRef<THREE.Group>(null);
  const tipLightRef = useRef<THREE.PointLight>(null);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: Math.PI / 6, y: Math.PI / 4 });
  const spinStartTime = useRef<number | null>(null);
  const { gl } = useThree();
  
  // Light cigarette from external trigger (flame collision)
  useEffect(() => {
    if (shouldLight && !isLit) {
      setIsLit(true);
      onLit();
    }
  }, [shouldLight, isLit, onLit]);
  
  // Helper function to get tip world position
  const getTipWorldPosition = (): THREE.Vector3 | null => {
    if (!cigaretteRef.current) return null;
    const tipLocalPos = new THREE.Vector3(0, 0.49, 0);
    const worldPos = tipLocalPos.applyMatrix4(cigaretteRef.current.matrixWorld);
    return worldPos;
  };
  
  // Create procedural noise texture for filter
  const filterTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Base orange color
    ctx.fillStyle = '#8b6f45';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add random orange dots for filter texture
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 10 + 1;
      const opacity = Math.random() * 0.4 + 0.1;
      
      // Vary between lighter and darker orange
      const shade = Math.random() > 0.5 ? '#d4a574' : '#e8c39e';
      ctx.fillStyle = shade;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    
    return texture;
  }, []);

  // Create tobacco texture with dark brown noise
  const tobaccoTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Base medium brown color
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add darker brown spots for tobacco texture
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 20 + 5;
      const opacity = Math.random() * 0.7 + 0.3;
      
      // Darker brown shades
      const shades = ['#3d2817', '#4a2f1f', '#2f1810', '#3a2318'];
      ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add some lighter brown highlights for variety
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 4 + 1;
      
      ctx.fillStyle = '#6b4a3a';
      ctx.globalAlpha = Math.random() * 0.5 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add fine granular texture
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 2;
      
      ctx.fillStyle = Math.random() > 0.5 ? '#2a1a10' : '#4d3729';
      ctx.fillRect(x, y, size, size);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    
    return texture;
  }, []);
  
  // Create subtle paper texture for cigarette body
  const paperTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Base white/cream color
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add very visible dark spots
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 4 + 1;
      
      ctx.fillStyle = '#f7f7f7';
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add fine paper grain
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 1.5 + 0.5;
      const brightness = Math.random() > 0.5 ? '#ffffff' : '#b0b0b0';
      
      ctx.fillStyle = brightness;
      ctx.globalAlpha = Math.random() * 0.6 + 0.2;
      ctx.fillRect(x, y, size, size);
    }
    
    // Add very visible horizontal fibers
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 300; i++) {
      const y = Math.random() * 512;
      const length = Math.random() * 60 + 20;
      const x = Math.random() * 512;
      
      ctx.strokeStyle = Math.random() > 0.5 ? '#888888' : '#aaaaaa';
      ctx.lineWidth = Math.random() * 2 + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + length, y + (Math.random() - 0.5) * 3);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    
    return texture;
  }, []);

  useFrame((state) => {
    // Subtle light flicker when lit
    if (isLit && tipLightRef.current) {
      const time = state.clock.elapsedTime;
      const flicker = Math.sin(time * 10) * 0.3 + Math.sin(time * 23) * 0.15;
      tipLightRef.current.intensity = 2 + flicker;
    }

    // Apply rotation with smooth interpolation
    if (cigaretteRef.current) {
      const elapsed = state.clock.elapsedTime;
      if (spinStartTime.current === null) spinStartTime.current = elapsed;

      // Intro spin: 360° over 1.5s with exaggerated ease-out
      const spinDuration = 1.5;
      const spinProgress = Math.min(1, (elapsed - spinStartTime.current) / spinDuration);
      const spinEaseOut = 1 - Math.pow(1 - spinProgress, 5); // exaggerated ease-out
      const spinOffset = spinProgress < 1 ? (1 - spinEaseOut) * Math.PI * 2 : 0;

      if (!isDragging) {
        // Add momentum/inertia when not dragging
        rotationVelocity.current.x *= 0.95;
        rotationVelocity.current.y *= 0.95;
        targetRotation.current.x += rotationVelocity.current.x;
        targetRotation.current.y += rotationVelocity.current.y;
      }

      // Smooth interpolation to target rotation, plus intro spin on Y axis
      const targetY = targetRotation.current.y + spinOffset;
      cigaretteRef.current.rotation.x += (targetRotation.current.x - cigaretteRef.current.rotation.x) * 0.1;
      cigaretteRef.current.rotation.y += (targetY - cigaretteRef.current.rotation.y) * 0.15;
      
      // Update tip position for collision detection
      if (onTipPositionChange) {
        const tipPos = getTipWorldPosition();
        onTipPositionChange(tipPos);
      }
    }
  });

  const handlePointerMove = (e: PointerEvent) => {
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;
    
    // Update target rotation based on mouse movement
    targetRotation.current.y += deltaX * 0.01;
    targetRotation.current.x += deltaY * 0.01;
    
    // Store velocity for momentum
    rotationVelocity.current.x = deltaY * 0.01;
    rotationVelocity.current.y = deltaX * 0.01;
    
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    gl.domElement.style.cursor = 'grab';
    
    // Reset to default rotation
    targetRotation.current = { x: Math.PI / 6, y: Math.PI / 4 };
    rotationVelocity.current = { x: 0, y: 0 };
    
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
    gl.domElement.style.cursor = 'grabbing';
    
    // Add global listeners so dragging works even when cursor leaves the cigarette
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleClick = () => {
    // Only trigger light if not dragging and flame is not active
    if (!isLit && !isDragging && !flameActive) {
      setIsLit(true);
      onLit();
    }
  };

  return (
    <group 
      ref={cigaretteRef} 
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerOver={() => gl.domElement.style.cursor = 'grab'}
      onPointerOut={() => !isDragging && (gl.domElement.style.cursor = 'default')}
      position={position} 
      rotation={[Math.PI / 6, Math.PI / 4, Math.PI / 2]}
    >
      {/* Cigarette body (white paper) - 20% shorter than previous */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.02, 16]} />
        <meshStandardMaterial 
          map={paperTexture}
          roughness={0.8}
          metalness={0}
        />
      </mesh>

      {/* Filter (tan/orange) with dotted texture */}
      <mesh position={[0, -0.442, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.041, 0.041, 0.3, 16]} />
        <meshStandardMaterial 
          map={filterTexture}
          roughness={2}
          metalness={0}
        />
      </mesh>

      {/* Filter end cap (off-white) */}
      <mesh position={[0, -0.588, 0]} receiveShadow>
        <cylinderGeometry args={[0.038, 0.038, 0.01, 16]} />
        <meshStandardMaterial 
          color="#f5f5dc"
          roughness={0.8}
          metalness={0}
        />
      </mesh>

      {/* Filter band */}
      <mesh position={[0, -0.29, 0]} receiveShadow>
        <cylinderGeometry args={[0.042, 0.042, 0.02, 16]} />
        <meshStandardMaterial 
          color="#d4af37" 
          roughness={0}
          metalness={.5}
        />
      </mesh>

      {/* Tobacco end (brown) - recessed inside white paper */}
      <mesh position={[0, 0.49, 0]} receiveShadow>
        <cylinderGeometry args={[0.04, 0.038, 0.05, 16]} />
        <meshStandardMaterial 
          map={tobaccoTexture}
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* Lit tip (glowing ember) - only visible when lit */}
      {isLit && (
        <>
          <mesh position={[0, 0.49, 0]}>
            <cylinderGeometry args={[0.038, 0.035, 0.04, 16]} />
            <meshStandardMaterial 
              color="#ff4500" 
              emissive="#ff4500"
              emissiveIntensity={2}
            />
          </mesh>
          
          {/* Point light for glow */}
          <pointLight
            ref={tipLightRef}
            position={[0, 0.544, 0]}
            color="#ff4500"
            intensity={2}
            distance={2}
          />
          
          {/* Volumetric smoke effect - rotated to rise straight up */}
          <group rotation={[-Math.PI / 6, -Math.PI / 6, -Math.PI / 2]}>
            <SmokeEffect isLit={isLit} position={[-0.45, 1.2, 0.2]} />
          </group>
        </>
      )}
    </group>
  );
}
