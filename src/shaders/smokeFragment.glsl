uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
varying float vAlpha;
varying vec3 vPosition;

// Modern 3D Simplex-like noise for organic smoke patterns
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

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
  
  for(int i = 0; i < 5; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

// Curl noise for turbulent flow patterns
vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  
  float n1 = snoise(vec3(p.x, p.y + e, p.z));
  float n2 = snoise(vec3(p.x, p.y - e, p.z));
  float n3 = snoise(vec3(p.x, p.y, p.z + e));
  float n4 = snoise(vec3(p.x, p.y, p.z - e));
  float n5 = snoise(vec3(p.x + e, p.y, p.z));
  float n6 = snoise(vec3(p.x - e, p.y, p.z));
  
  float x = n1 - n2;
  float y = n3 - n4;
  float z = n5 - n6;
  
  return normalize(vec3(x, y, z));
}

void main() {
  vec2 uv = vUv;
  
  // Create animated 3D position for noise sampling
  vec3 noiseCoord = vec3(uv * 2.0, uTime * 0.15);
  
  // Add curl noise for realistic turbulent flow
  vec3 curl = curlNoise(noiseCoord * 0.8);
  noiseCoord += curl * 0.3;
  
  // Multi-octave fractal noise for organic volume
  float noise1 = fbm(noiseCoord * 1.5);
  float noise2 = fbm(noiseCoord * 3.0 + vec3(100.0, 100.0, 0.0));
  float noise3 = fbm(noiseCoord * 6.0 - vec3(50.0, 50.0, 0.0));
  
  // Combine noise layers with different characteristics
  float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
  combinedNoise = combinedNoise * 0.5 + 0.5; // Remap to 0-1
  
  // Create soft, organic edges with distance from center
  vec2 centerDist = abs(uv - 0.5) * 2.0;
  float edgeFade = 1.0 - smoothstep(0.3, 1.0, length(centerDist));
  
  // Add wispy tendrils using high-frequency noise
  float tendrils = snoise(vec3(uv * 8.0, uTime * 0.2)) * 0.5 + 0.5;
  tendrils = pow(tendrils, 2.0);
  
  // Combine all alpha components
  float alpha = combinedNoise;
  alpha *= edgeFade;
  alpha = smoothstep(0.2, 0.8, alpha);
  alpha *= vAlpha;
  alpha *= uOpacity;
  
  // Add tendrils to alpha for wispy effect
  alpha *= mix(0.7, 1.0, tendrils);
  
  // Realistic smoke color gradient from dark to light
  vec3 darkSmoke = vec3(0.45, 0.45, 0.48);
  vec3 lightSmoke = vec3(0.85, 0.87, 0.9);
  vec3 brightSmoke = vec3(0.95, 0.96, 0.98);
  
  // Mix colors based on noise and height
  vec3 smokeColor = mix(darkSmoke, lightSmoke, combinedNoise);
  smokeColor = mix(smokeColor, brightSmoke, pow(vAlpha, 2.0));
  
  // Add subtle color variation from curl noise
  smokeColor += curl * 0.03;
  
  // Add slight blue tint to cooler areas
  smokeColor = mix(smokeColor, vec3(0.7, 0.75, 0.85), (1.0 - combinedNoise) * 0.2);
  
  gl_FragColor = vec4(smokeColor, alpha);
}
