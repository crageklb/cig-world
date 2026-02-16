import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface TargetedSpotlightProps {
  position: [number, number, number];
  targetPosition: [number, number, number];
  angle: number;
  penumbra: number;
  intensity: number;
  color: string;
  castShadow?: boolean;
  shadowMapSize?: number;
}

export default function TargetedSpotlight({
  position,
  targetPosition,
  angle,
  penumbra,
  intensity,
  color,
  castShadow = false,
  shadowMapSize = 2048,
}: TargetedSpotlightProps) {
  const spotLightRef = useRef<THREE.SpotLight>(null);

  useEffect(() => {
    if (spotLightRef.current) {
      spotLightRef.current.target.position.set(...targetPosition);
      spotLightRef.current.target.updateMatrixWorld();
    }
  }, [targetPosition]);

  return (
    <spotLight
      ref={spotLightRef}
      position={position}
      angle={angle}
      penumbra={penumbra}
      intensity={intensity}
      color={color}
      castShadow={castShadow}
      shadow-mapSize-width={shadowMapSize}
      shadow-mapSize-height={shadowMapSize}
    />
  );
}
