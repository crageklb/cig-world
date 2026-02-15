// Simple mobile device detection
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Also check for touch support and screen size
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  
  return mobileRegex.test(userAgent) || (isTouchDevice && isSmallScreen);
};

// Performance preset based on device
export const getPerformancePreset = () => {
  const isMobile = isMobileDevice();
  
  return {
    isMobile,
    smokeOctaves: isMobile ? 3 : 7,
    smokeGeometrySegments: isMobile ? 64 : 128,
    particleCount: isMobile ? 200 : 500,
    enableShadows: !isMobile,
  };
};
