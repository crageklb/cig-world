import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';

export function AcceleratedZoom() {
  const { camera } = useThree();
  const targetZoom = useRef(8); // Start at default position
  const currentZoom = useRef(8);
  const scrollVelocity = useRef(0);
  const lastScrollTime = useRef(Date.now());
  
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const now = Date.now();
      const timeDelta = (now - lastScrollTime.current) / 1000;
      lastScrollTime.current = now;
      
      // Calculate scroll velocity (pixels per second)
      const instantVelocity = Math.abs(e.deltaY) / timeDelta;
      
      // Smooth velocity
      scrollVelocity.current = scrollVelocity.current * 0.8 + instantVelocity * 0.2;
      
      // Base zoom amount
      const baseZoom = e.deltaY * 0.001;
      
      // Acceleration curve - faster scrolling = exponentially more zoom
      const velocityFactor = Math.min(scrollVelocity.current / 1000, 3);
      const acceleration = 1 + Math.pow(velocityFactor, 1.5);
      
      // Apply accelerated zoom
      const zoomAmount = baseZoom * acceleration;
      targetZoom.current = Math.max(7.5, Math.min(8.5, targetZoom.current + zoomAmount));
    };
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);
  
  useFrame(() => {
    // Smoothly interpolate to target zoom
    currentZoom.current += (targetZoom.current - currentZoom.current) * 0.1;
    camera.position.z = currentZoom.current;
    
    // Decay velocity over time
    scrollVelocity.current *= 0.95;
  });
  
  return null;
}
