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
  // Conservative check for low-end devices (few CPU cores or low memory)
  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
  const isLowEnd =
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (deviceMemory !== undefined && deviceMemory <= 4);
  const useLowEndPreset = isMobile && isLowEnd;

  return {
    isMobile,
    dpr: useLowEndPreset ? 1 : undefined,
    smokeOctaves: useLowEndPreset ? 2 : isMobile ? 3 : 7,
    smokeGeometrySegments: isMobile ? 64 : 128,
    particleCount: useLowEndPreset ? 50 : isMobile ? 100 : 500,
    enableShadows: !isMobile,
  };
};
