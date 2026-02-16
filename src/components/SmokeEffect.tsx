import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { getPerformancePreset } from '../utils/deviceDetection';

// Create custom shader material using drei's shaderMaterial helper
const SmokeMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uOpacity: 1.0,
    uFadeIn: 0.0,
    uOctaves: 6,
  },
  // Vertex Shader
  /* glsl */ `
    uniform float uTime;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vDistanceFromCenter;

    // 3D Simplex noise implementation
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      
      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Calculate distance from center axis for later use
      vDistanceFromCenter = length(vec2(pos.x, pos.z));
      
      // Create wobbling effect using Simplex noise
      // Higher frequency as smoke rises for more chaotic motion
      float heightFactor = (pos.y + 1.0) * 0.5; // Normalize height
      
      // Multiple noise layers for complex wobbling
      float noise1 = snoise(vec3(pos.x * 2.0, pos.y * 1.5 - uTime * 0.3, pos.z * 2.0));
      float noise2 = snoise(vec3(pos.x * 4.0, pos.y * 3.0 - uTime * 0.5, pos.z * 4.0));
      float noise3 = snoise(vec3(pos.x * 8.0, pos.y * 6.0 - uTime * 0.7, pos.z * 8.0));
      
      // Apply wobble with increasing intensity as smoke rises
      float wobbleIntensity = heightFactor * 0.15;
      pos.x += (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2) * wobbleIntensity;
      pos.z += (noise2 * 0.5 + noise3 * 0.3 + noise1 * 0.2) * wobbleIntensity;
      
      // Add swirling motion
      float angle = uTime * 0.5 + heightFactor * 2.0;
      float swirl = sin(angle) * heightFactor * 0.1;
      pos.x += cos(angle) * swirl;
      pos.z += sin(angle) * swirl;
      
      // Expand smoke as it rises
      float expansion = pow(heightFactor, 1.2) * 0.8;
      pos.x *= 1.0 + expansion;
      pos.z *= 1.0 + expansion;
      
      vPosition = pos;
      vNormal = normalize(normalMatrix * normal);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  /* glsl */ `
    uniform float uTime;
    uniform float uOpacity;
    uniform float uFadeIn;
    uniform int uOctaves;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vDistanceFromCenter;

    // 3D Simplex noise (same as vertex shader)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      
      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    // Layered Perlin/Simplex noise for wispy textures
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      // Dynamic octaves based on device performance
      for(int i = 0; i < 6; i++) {
        if (i >= uOctaves) break;
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      
      return value;
    }

    void main() {
      // Normalize height from bottom to top (0 to 1)
      float height = (vPosition.y + 1.0) / 2.0;
      
      // Create animated noise coordinates that move upward
      vec3 noiseCoord = vec3(
        vPosition.x * 2.0,
        vPosition.y * 1.5 - uTime * 0.4, // Animate upward
        vPosition.z * 2.0
      );
      
      // Layered noise for wispy texture
      float noise1 = fbm(noiseCoord * 1.0);
      float noise2 = fbm(noiseCoord * 2.0 + vec3(100.0, 100.0, 100.0));
      float noise3 = snoise(noiseCoord * 4.0 - vec3(50.0, 50.0, 50.0));
      
      // Combine noise layers
      float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
      combinedNoise = combinedNoise * 0.5 + 0.5; // Remap to 0-1
      
      // Fresnel effect - more transparent in the middle, visible at edges
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);
      
      // Reduce fresnel effect for more solid appearance
      fresnel = smoothstep(0.0, 1.0, fresnel) * 0.3;
      
      // Vertical gradient mask - dense at base, fades at top
      float verticalGradient = 1.0 - smoothstep(0.0, 1.0, height);
      verticalGradient = pow(verticalGradient, 1.5); // More density at bottom
      
      // Fade in smoothly at the base
      float baseFadeIn = smoothstep(0.0, 0.15, height);
      
      // Calculate final alpha - solid throughout, not hollow
      float alpha = combinedNoise;
      alpha *= (1.0 + fresnel); // Subtle edge enhancement instead of transparency
      alpha *= verticalGradient; // Fade to top
      alpha *= baseFadeIn; // Fade in at bottom
      alpha *= uOpacity;
      alpha *= uFadeIn; // Controlled fade in when lit
      
      // Remove the hollow center effect - make it solid
      // alpha *= mix(0.5, 1.0, vDistanceFromCenter * 2.0); // REMOVED
      
      // Create wispy holes using high-frequency noise
      float detail = snoise(noiseCoord * 8.0);
      alpha *= smoothstep(-0.3, 0.7, detail);
      
      // Realistic smoke color gradient
      vec3 darkSmoke = vec3(0.4, 0.4, 0.45);
      vec3 lightSmoke = vec3(0.75, 0.77, 0.8);
      vec3 brightSmoke = vec3(0.88, 0.9, 0.92);
      
      // Color varies with noise and height
      vec3 smokeColor = mix(darkSmoke, lightSmoke, combinedNoise);
      smokeColor = mix(smokeColor, brightSmoke, pow(height, 2.0));
      
      // Add subtle blue tint to edges (Fresnel areas)
      smokeColor = mix(smokeColor, vec3(0.7, 0.75, 0.85), fresnel * 0.2);
      
      gl_FragColor = vec4(smokeColor, alpha * 0.85); // Balanced opacity for visible but thick smoke
    }
  `
);

// Extend R3F to recognize our custom material
extend({ SmokeMaterial });

// TypeScript declaration for the custom material
declare global {
  namespace JSX {
    interface IntrinsicElements {
      smokeMaterial: any;
    }
  }
}

interface SmokeEffectProps {
  isLit: boolean;
  position?: [number, number, number];
}

export default function SmokeEffect({ isLit, position = [0, 0.8, 0] }: SmokeEffectProps) {
  const materialRef = useRef<any>(null);
  const fadeInRef = useRef(0);
  
  // Get performance settings
  const perfPreset = useMemo(() => getPerformancePreset(), []);

  // Create geometry - using a solid cone for tight, volumetric smoke
  const geometry = useMemo(() => {
    // ConeGeometry: radius, height, radialSegments, heightSegments
    // Reduce segments on mobile for performance
    const radialSegments = perfPreset.isMobile ? 8 : 32;
    const heightSegments = perfPreset.isMobile ? 16 : 64;
    return new THREE.ConeGeometry(0.02, 2, radialSegments, heightSegments, false);
  }, [perfPreset]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Set octaves if not already set
      if (materialRef.current.uniforms.uOctaves.value === 6 && perfPreset.smokeOctaves !== 6) {
        materialRef.current.uniforms.uOctaves.value = Math.min(perfPreset.smokeOctaves, 3); // Cap at 3 on mobile
      }
      
      if (isLit) {
        // Update time for animation
        materialRef.current.uniforms.uTime.value += delta;
        
        // Fade in smoothly when lit
        fadeInRef.current = Math.min(fadeInRef.current + delta * 1.5, 1.0);
        materialRef.current.uniforms.uFadeIn.value = fadeInRef.current;
        
        // Subtle opacity pulsing
        const opacity = Math.sin(state.clock.elapsedTime * 0.3) * 0.2 + 0.8;
        materialRef.current.uniforms.uOpacity.value = opacity;
      } else {
        // Fade out when not lit
        fadeInRef.current = Math.max(fadeInRef.current - delta * 2.0, 0.0);
        materialRef.current.uniforms.uFadeIn.value = fadeInRef.current;
      }
    }
  });

  return (
    <mesh geometry={geometry} position={position}>
      <smokeMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
        blending={THREE.NormalBlending}
        uOctaves={Math.min(perfPreset.smokeOctaves, 3)}
      />
    </mesh>
  );
}
