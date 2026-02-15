import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LighterFlameProps {
  position: [number, number, number];
  velocity: [number, number, number];
  intensity?: number;
}

export default function LighterFlame({ position, velocity, intensity = 1.0 }: LighterFlameProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const fadeInProgress = useRef(0);
  
  // Calculate wind direction and strength from velocity
  const windStrength = useMemo(() => {
    const speed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);
    return Math.min(speed * 0.8, 1.0); // Increased multiplier for more visible effect
  }, [velocity]);
  
  const windDirection = useMemo(() => {
    if (windStrength < 0.01) return new THREE.Vector2(0, 0);
    const len = Math.sqrt(velocity[0] ** 2 + velocity[2] ** 2);
    if (len < 0.001) return new THREE.Vector2(0, 0);
    return new THREE.Vector2(velocity[0] / len, velocity[2] / len);
  }, [velocity, windStrength]);

  // Create particle system
  const particles = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lifetimes = new Float32Array(count);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Start particles at base with slight spread
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.025; // Reduced from 0.04 to 0.025 for thinner flame
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.random() * 0.05; // Small vertical spread
      positions[i3 + 2] = Math.sin(angle) * radius;
      
      // Random lifetime for staggered animation
      lifetimes[i] = Math.random();
      
      // Upward velocity with some randomness
      velocities[i3] = (Math.random() - 0.5) * 0.4;
      velocities[i3 + 1] = 1.0 + Math.random() * 0.6; // Rise speed
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.4;
      
      // Initial color (will be updated in shader)
      colors[i3] = 1.0;
      colors[i3 + 1] = 0.8;
      colors[i3 + 2] = 0.2;
      
      // Particle size
      sizes[i] = 0.7 + Math.random() * 0.03; // Reduced for thinner flame
    }
    
    return { positions, colors, sizes, lifetimes, velocities, count };
  }, []);

  // Create custom particle shader
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 },
        uFadeIn: { value: 0.0 },
        uWindStrength: { value: 0.0 },
        uWindDirection: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWindStrength;
        uniform vec2 uWindDirection;
        attribute float size;
        attribute float lifetime;
        attribute vec3 velocity;
        varying vec3 vColor;
        varying float vAlpha;
        
        // Simple noise function
        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        }
        
        void main() {
          // Animate lifetime
          float life = mod(lifetime + uTime * 0.6, 1.0);
          
          vec3 pos = position;
          
          // Rise and spread over time
          pos.y += life * 0.5;
          pos.x += velocity.x * life * 0.2 + sin(uTime * 4.0 + lifetime * 10.0) * 0.08 * life; // Reduced spread
          pos.z += velocity.z * life * 0.2 + cos(uTime * 4.0 + lifetime * 10.0) * 0.08 * life; // Reduced spread
          
          // Add turbulence
          float turbulence = noise(pos * 3.0 + uTime);
          pos.x += (turbulence - 0.5) * 0.12 * life; // Reduced turbulence spread
          pos.z += (turbulence - 0.5) * 0.12 * life; // Reduced turbulence spread
          
          // Wind effect - bend flame opposite to movement direction
          // The higher the particle, the more it bends
          float windEffect = uWindStrength * life * life * 8.0;
          pos.x -= uWindDirection.x * windEffect;
          pos.z -= uWindDirection.y * windEffect;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size increases then decreases over lifetime
          float sizeOverLife = sin(life * 3.14159);
          gl_PointSize = size * (350.0 / -mvPosition.z) * sizeOverLife;
          
          // Color gradient based on height/lifetime
          if (life < 0.15) {
            // Base: blue-white (hottest)
            vColor = mix(vec3(0.4, 0.6, 1.0), vec3(1.0, 1.0, 0.95), life / 0.15);
          } else if (life < 0.45) {
            // Middle: yellow to orange
            vColor = mix(vec3(1.0, 1.0, 0.95), vec3(1.0, 0.6, 0.15), (life - 0.15) / 0.3);
          } else if (life < 0.75) {
            // Upper: orange to red
            vColor = mix(vec3(1.0, 0.6, 0.15), vec3(0.9, 0.25, 0.05), (life - 0.45) / 0.3);
          } else {
            // Top: red fading out
            vColor = mix(vec3(0.9, 0.25, 0.05), vec3(0.6, 0.1, 0.0), (life - 0.75) / 0.25);
          }
          
          // Alpha fades out at top
          vAlpha = 1.0 - pow(life, 1.8);
        }
      `,
      fragmentShader: `
        uniform float uIntensity;
        uniform float uFadeIn;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          // Circular particle shape with soft falloff
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // Soft edges with glow
          float radialFalloff = 1.0 - (dist * 2.0);
          radialFalloff = pow(radialFalloff, 1.5);
          
          float alpha = radialFalloff * vAlpha * uIntensity * uFadeIn;
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    // Fade in effect
    if (fadeInProgress.current < 1.0) {
      fadeInProgress.current = Math.min(fadeInProgress.current + delta * 3, 1.0);
    }
    
    // Update particle material uniforms
    if (particleMaterial) {
      particleMaterial.uniforms.uTime.value = time;
      particleMaterial.uniforms.uIntensity.value = intensity;
      particleMaterial.uniforms.uFadeIn.value = fadeInProgress.current;
      particleMaterial.uniforms.uWindStrength.value = windStrength;
      particleMaterial.uniforms.uWindDirection.value = windDirection;
    }
    
    // Animate light intensity for flickering with sin wave
    if (lightRef.current) {
      const flicker = Math.sin(time * 15) * 0.15 + Math.sin(time * 8) * 0.1 + Math.sin(time * 25) * 0.05;
      lightRef.current.intensity = (12 + flicker) * intensity * fadeInProgress.current;
    }
  });

  return (
    <group position={position}>
      {/* GPU Particle System */}
      <points ref={particlesRef} material={particleMaterial}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.count}
            array={particles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particles.count}
            array={particles.colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particles.count}
            array={particles.sizes}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-lifetime"
            count={particles.count}
            array={particles.lifetimes}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-velocity"
            count={particles.count}
            array={particles.velocities}
            itemSize={3}
          />
        </bufferGeometry>
      </points>
      
      {/* Flickering point light with orange glow */}
      <pointLight
        ref={lightRef}
        position={[0, 0.5, 0]}
        color="#ff7733"
        intensity={8}
        distance={3}
        decay={2}
      />
    </group>
  );
}
