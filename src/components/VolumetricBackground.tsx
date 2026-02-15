import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { getPerformancePreset } from '../utils/deviceDetection';

// Create custom shader material for volumetric background smoke
const VolumetricSmokeMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uOpacity: 0.6,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uMouseVelocity: new THREE.Vector2(0, 0),
    uOctaves: 7,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  /* glsl */ `
    uniform float uTime;
    uniform float uOpacity;
    uniform vec2 uMouse;
    uniform vec2 uMouseVelocity;
    uniform int uOctaves;
    
    varying vec2 vUv;
    varying vec3 vPosition;

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

    // Fractal Brownian Motion for layered detail
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      // Dynamic octaves based on device performance
      for(int i = 0; i < 7; i++) {
        if (i >= uOctaves) break;
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      
      return value;
    }

    // Turbulence function for flowing motion
    float turbulence(vec3 p) {
      float t = 0.0;
      float amplitude = 1.0;
      int turbOctaves = max(2, uOctaves - 2);
      
      for(int i = 0; i < 5; i++) {
        if (i >= turbOctaves) break;
        t += amplitude * abs(snoise(p));
        p *= 2.0;
        amplitude *= 0.5;
      }
      
      return t;
    }

    void main() {
      vec2 uv = vUv;
      
      // Calculate distance from mouse position
      vec2 mouseToUv = uv - uMouse;
      float distToMouse = length(mouseToUv);
      
      // Create very subtle displacement field around mouse
      float mouseInfluence = smoothstep(0.15, 0.0, distToMouse); // Even smaller radius
      
      // Create slowly moving 3D coordinates with more variation
      vec3 noiseCoord = vec3(
        uv.x * 3.0,
        uv.y * 3.0,
        uTime * 0.05
      );
      
      // Add very subtle mouse-based turbulence to the noise sampling
      vec3 mouseOffset = vec3(
        mouseToUv * mouseInfluence * 0.4, // Reduced from 0.8
        0.0
      );
      
      // Add gentle velocity-based flow
      vec3 velocityOffset = vec3(
        uMouseVelocity * mouseInfluence * 0.6, // Reduced from 1.2
        0.0
      );
      
      // Apply offsets to noise coordinates, not UVs
      noiseCoord += mouseOffset + velocityOffset;
      
      // Layer 1: Large-scale smoke clouds
      float smoke1 = fbm(noiseCoord * 0.5 + uTime * 0.02);
      
      // Layer 2: Medium detail
      float smoke2 = fbm(noiseCoord * 1.2 + vec3(100.0, 100.0, uTime * 0.03));
      
      // Layer 3: Fine detail
      float smoke3 = fbm(noiseCoord * 2.5 - vec3(50.0, 50.0, uTime * 0.015));
      
      // Layer 4: Very fine wispy details
      float smoke4 = snoise(noiseCoord * 5.0 + uTime * 0.01) * 0.5 + 0.5;
      
      // Combine layers with good contrast
      float combinedSmoke = smoke1 * 0.35 + smoke2 * 0.3 + smoke3 * 0.25 + smoke4 * 0.1;
      
      // Add turbulence for flow patterns
      vec3 turbCoord = noiseCoord * 0.8 + uTime * 0.025;
      float turb = turbulence(turbCoord) * 0.3;
      combinedSmoke += turb;
      
      // Extra turbulence from mouse creates localized swirling
      float mouseSwirl = snoise(vec3(noiseCoord.xy * 2.0, uTime * 0.2));
      combinedSmoke += mouseSwirl * mouseInfluence * 0.04; // Reduced from 0.08
      
      // Normalize and enhance contrast
      combinedSmoke = combinedSmoke * 0.5 + 0.5;
      
      // Softer contrast curve for more smoke coverage
      combinedSmoke = pow(combinedSmoke, 1.2);
      combinedSmoke = smoothstep(0.15, 0.8, combinedSmoke);
      
      // Create depth variation with another noise layer
      float depthNoise = snoise(noiseCoord * 0.3) * 0.5 + 0.5;
      
      // Subtle vignette (much lighter than before)
      vec2 center = uv - 0.5;
      float vignette = 1.0 - length(center) * 0.4;
      vignette = smoothstep(0.5, 1.0, vignette);
      
      // Create distinct smoke color zones - even darker for atmosphere
      vec3 smokeDark = vec3(0.25, 0.26, 0.28);      // Very dark smoke regions
      vec3 smokeMid = vec3(0.38, 0.40, 0.43);       // Medium density
      vec3 smokeLight = vec3(0.50, 0.52, 0.55);     // Light, wispy areas
      vec3 smokeBright = vec3(0.62, 0.64, 0.67);    // Brightest highlights
      
      // Multi-stage color mixing for depth
      vec3 smokeColor = mix(smokeDark, smokeMid, smoothstep(0.3, 0.5, combinedSmoke));
      smokeColor = mix(smokeColor, smokeLight, smoothstep(0.5, 0.7, combinedSmoke));
      smokeColor = mix(smokeColor, smokeBright, smoothstep(0.7, 0.9, combinedSmoke));
      
      // Add color variation based on depth
      smokeColor = mix(smokeColor, smokeColor * vec3(0.95, 0.96, 1.0), depthNoise * 0.2);
      
      // Add subtle warm tint in some areas
      float warmth = snoise(noiseCoord * 0.4 + 50.0) * 0.5 + 0.5;
      smokeColor = mix(smokeColor, smokeColor * vec3(1.0, 0.98, 0.96), warmth * 0.15);
      
      // Calculate alpha with clear variation
      float alpha = combinedSmoke;
      
      // More smoke visible - less aggressive transparency variation
      alpha = mix(alpha * 0.5, alpha * 0.95, smoothstep(0.2, 0.8, combinedSmoke));
      
      // Very subtle clearing effect near mouse
      alpha *= (1.0 - mouseInfluence * 0.06); // Reduced from 0.12
      
      // Apply vignette
      alpha *= vignette;
      
      // Overall opacity control
      alpha *= uOpacity;
      
      // Ensure we have contrast (not solid)
      alpha = clamp(alpha, 0.1, 0.85);
      
      gl_FragColor = vec4(smokeColor, alpha);
    }
  `
);

// Extend R3F to recognize our custom material
extend({ VolumetricSmokeMaterial });

// TypeScript declaration
declare global {
  namespace JSX {
    interface IntrinsicElements {
      volumetricSmokeMaterial: any;
    }
  }
}

export default function VolumetricBackground() {
  const materialRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const prevMouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const velocityRef = useRef(new THREE.Vector2(0, 0));
  const raycaster = useRef(new THREE.Raycaster());
  const mouseVector = useRef(new THREE.Vector2());
  
  // Get performance settings
  const perfPreset = useMemo(() => getPerformancePreset(), []);

  useFrame((state, delta) => {
    if (materialRef.current && meshRef.current) {
      // Update time
      materialRef.current.uniforms.uTime.value += delta;
      
      // Set octaves if not already set
      if (materialRef.current.uniforms.uOctaves.value === 7 && perfPreset.smokeOctaves !== 7) {
        materialRef.current.uniforms.uOctaves.value = perfPreset.smokeOctaves;
      }
      
      // Keep background fixed to camera position (doesn't zoom or rotate)
      meshRef.current.position.copy(state.camera.position);
      meshRef.current.position.z -= 5; // Offset behind camera view
      // DO NOT copy camera rotation - keep background always facing forward
      
      // Get mouse position from R3F state (normalized -1 to 1)
      const mouse = state.mouse;
      mouseVector.current.copy(mouse);
      
      // Setup raycaster
      raycaster.current.setFromCamera(mouseVector.current, state.camera);
      
      // Intersect with the background plane
      const intersects = raycaster.current.intersectObject(meshRef.current);
      
      let mouseUv = new THREE.Vector2(0.5, 0.5);
      
      if (intersects.length > 0 && intersects[0].uv) {
        // Use the UV coordinates from the intersection
        mouseUv = intersects[0].uv;
      }
      
      // Calculate velocity (smoothed)
      const velocity = new THREE.Vector2()
        .copy(mouseUv)
        .sub(prevMouseRef.current)
        .multiplyScalar(10); // Amplify for visible effect
      
      // Smooth velocity with lerp for natural motion
      velocityRef.current.lerp(velocity, 0.1);
      
      // Smooth mouse position for less jittery movement
      mouseRef.current.lerp(mouseUv, 0.1);
      
      // Update uniforms
      materialRef.current.uniforms.uMouse.value.copy(mouseRef.current);
      materialRef.current.uniforms.uMouseVelocity.value.copy(velocityRef.current);
      
      // Store previous position
      prevMouseRef.current.copy(mouseUv);
      
      // Decay velocity over time
      velocityRef.current.multiplyScalar(0.95);
    }
  });

  return (
    <>
      {/* Large plane behind everything - follows camera so it stays fixed during zoom */}
      <mesh ref={meshRef} scale={[25, 25, 1]}>
        <planeGeometry args={[1, 1, perfPreset.smokeGeometrySegments, perfPreset.smokeGeometrySegments]} />
        <volumetricSmokeMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          uOctaves={perfPreset.smokeOctaves}
        />
      </mesh>
    </>
  );
}
