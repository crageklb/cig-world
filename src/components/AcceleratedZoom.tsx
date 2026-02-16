import { useThree, useFrame } from '@react-three/fiber';

export function AcceleratedZoom() {
  const { camera } = useThree();
  const targetZ = 8;

  useFrame(() => {
    camera.position.z = targetZ;
  });

  return null;
}
