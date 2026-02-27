import { useState, useEffect, lazy, Suspense } from 'react';
import { IconContext } from '@phosphor-icons/react';
import DarePage from './components/DarePage';
import SmokePage from './components/SmokePage';

const CigaretteScene = lazy(() => import('./components/CigaretteScene'));

function App() {
  const [, setShowDare] = useState(false);

  useEffect(() => {
    const prefetch = () => import('./components/CigaretteScene');
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout?: number }) => number }).requestIdleCallback(prefetch, { timeout: 2000 });
    } else {
      setTimeout(prefetch, 100);
    }
  }, []);

  const [currentPage, setCurrentPage] = useState<'home' | 'dare' | 'smoke'>('home');
  const [skipIntro, setSkipIntro] = useState(false);

  const handleDareCardClick = () => {
    setCurrentPage('dare');
  };

  const handleSmokeCardClick = () => {
    setCurrentPage('smoke');
  };

  const handleBack = () => {
    setSkipIntro(true);
    setCurrentPage('home');
  };

  // Cigarette position [x, y, z] - positive y moves up
  const cigarettePosition: [number, number, number] = [0, 0.6, 5];

  // Light positions - change these to move both light and indicator
  const mainSpotlightPos: [number, number, number] = [0, 3, 5]; // Directly above cigarette
  const rimLightPos: [number, number, number] = [6, 1, 5];
  const fillLightPos: [number, number, number] = [0, -2, 6];
  const frontFillLightPos: [number, number, number] = [-0.5, 0, 6]; // In front and to the left

  // Light intensities - change these to control light strength
  const mainSpotlightIntensity = 30;
  const rimLightIntensity = 10;
  const fillLightIntensity = 3;
  const frontFillLightIntensity = 2;

  // Show light indicators (spheres and cones) - set to true to show, false to hide
  const showLightIndicators = false;

  const handleCigaretteLit = () => {
    // Show dare after a short delay (let the smoke effect be visible first)
    setTimeout(() => {
      setShowDare(true);
    }, 1500);
  };

  if (currentPage === 'dare') {
    return (
      <IconContext.Provider value={{ color: 'currentColor', size: 20, weight: 'light' }}>
        <DarePage onBack={handleBack} />
      </IconContext.Provider>
    );
  }

  if (currentPage === 'smoke') {
    return (
      <IconContext.Provider value={{ color: 'currentColor', size: 20, weight: 'light' }}>
        <SmokePage onBack={handleBack} />
      </IconContext.Provider>
    );
  }

  return (
    <IconContext.Provider value={{ color: 'currentColor', size: 20, weight: 'light' }}>
    <div className={`w-full min-h-dvh relative overflow-y-auto overflow-x-hidden ${skipIntro ? 'intro-skipped' : ''}`}>
      {/* Top bar - stars across */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-1 top-bar-stars"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))', paddingBottom: '0.25rem' }}
      >
        {[...Array(48)].map((_, i) => (
          <span key={i} className="top-bar-star">&#9733;</span>
        ))}
      </header>

      {/* Noise overlay - fixed, visible at all scroll positions */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.15] z-[2] noise-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Halftone dot overlay - vintage print texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.35] z-[1] halftone-overlay"
      />

      {/* CSS smoke blobs - fixed full-page, behind content */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Layer 1 */}
        <div
          className="smoke-layer smoke-layer-1 absolute"
          style={{
            top: '20%',
            left: '15%',
            width: '50%',
            height: '60%',
            background: 'radial-gradient(ellipse 70% 55% at 40% 45%, rgba(139, 135, 192, 0.9) 0%, transparent 65%)',
            animation: 'smokeFloat1 25s ease-in-out infinite',
          }}
        />
        {/* Layer 2 */}
        <div
          className="smoke-layer smoke-layer-2 absolute"
          style={{
            top: '40%',
            left: '55%',
            width: '45%',
            height: '55%',
            background: 'radial-gradient(ellipse 60% 80% at 55% 50%, rgba(150, 148, 190, 0.9) 0%, transparent 60%)',
            animation: 'smokeFloat2 30s ease-in-out infinite',
          }}
        />
        {/* Layer 3 */}
        <div
          className="smoke-layer smoke-layer-3 absolute"
          style={{
            top: '10%',
            left: '40%',
            width: '55%',
            height: '50%',
            background: 'radial-gradient(ellipse 75% 45% at 50% 55%, rgba(145, 142, 195, 0.9) 0%, transparent 55%)',
            animation: 'smokeFloat3 35s ease-in-out infinite',
          }}
        />
        {/* Layer 4 */}
        <div
          className="smoke-layer smoke-layer-4 absolute"
          style={{
            top: '50%',
            left: '10%',
            width: '40%',
            height: '65%',
            background: 'radial-gradient(ellipse 50% 70% at 45% 40%, rgba(130, 128, 185, 0.9) 0%, transparent 65%)',
            animation: 'smokeFloat4 28s ease-in-out infinite',
          }}
        />
        {/* Layer 5 */}
        <div
          className="smoke-layer smoke-layer-5 absolute"
          style={{
            top: '5%',
            left: '65%',
            width: '48%',
            height: '52%',
            background: 'radial-gradient(ellipse 65% 50% at 50% 60%, rgba(148, 145, 195, 0.9) 0%, transparent 58%)',
            animation: 'smokeFloat5 32s ease-in-out infinite',
          }}
        />
        {/* Layer 6 - hidden on mobile */}
        <div
          className="smoke-layer smoke-layer-6 absolute"
          style={{
            top: '30%',
            left: '25%',
            width: '52%',
            height: '58%',
            background: 'radial-gradient(ellipse 55% 75% at 48% 52%, rgba(142, 140, 188, 0.9) 0%, transparent 62%)',
            animation: 'smokeFloat6 27s ease-in-out infinite',
          }}
        />
        {/* Layer 7 - hidden on mobile */}
        <div
          className="smoke-layer smoke-layer-7 absolute"
          style={{
            top: '15%',
            left: '5%',
            width: '58%',
            height: '48%',
            background: 'radial-gradient(ellipse 80% 48% at 42% 58%, rgba(155, 152, 200, 0.9) 0%, transparent 56%)',
            animation: 'smokeFloat7 33s ease-in-out infinite',
          }}
        />
        {/* Layer 8 - hidden on mobile */}
        <div
          className="smoke-layer smoke-layer-8 absolute"
          style={{
            top: '45%',
            left: '50%',
            width: '46%',
            height: '62%',
            background: 'radial-gradient(ellipse 58% 68% at 52% 46%, rgba(135, 132, 185, 0.9) 0%, transparent 64%)',
            animation: 'smokeFloat8 29s ease-in-out infinite',
          }}
        />
        {/* Layer 9 - hidden on mobile */}
        <div
          className="smoke-layer smoke-layer-9 absolute"
          style={{
            top: '25%',
            left: '70%',
            width: '42%',
            height: '56%',
            background: 'radial-gradient(ellipse 62% 52% at 55% 48%, rgba(148, 145, 195, 0.9) 0%, transparent 59%)',
            animation: 'smokeFloat1 31s ease-in-out infinite reverse',
          }}
        />
        {/* Layer 10 - hidden on mobile */}
        <div
          className="smoke-layer smoke-layer-10 absolute"
          style={{
            top: '35%',
            left: '0%',
            width: '50%',
            height: '70%',
            background: 'radial-gradient(ellipse 68% 58% at 38% 54%, rgba(155, 152, 200, 0.9) 0%, transparent 61%)',
            animation: 'smokeFloat2 26s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Hero section */}
      <section className="relative" style={{ paddingTop: '2.5rem' }}>
        {/* Cigarette canvas - absolutely positioned, no layout impact */}
        <div className="absolute inset-x-0 flex justify-center pointer-events-none" style={{ zIndex: 20, top: '-3rem' }}>
          <div className="relative w-full max-w-xl h-[34rem] pointer-events-auto">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center" aria-hidden aria-busy="true">
                  <div className="w-24 h-1 rounded-full bg-white/10 animate-pulse" />
                </div>
              }
            >
              <CigaretteScene
                onCigaretteLit={handleCigaretteLit}
                cigarettePosition={cigarettePosition}
                skipIntro={skipIntro}
                mainSpotlightPos={mainSpotlightPos}
                rimLightPos={rimLightPos}
                fillLightPos={fillLightPos}
                frontFillLightPos={frontFillLightPos}
                mainSpotlightIntensity={mainSpotlightIntensity}
                rimLightIntensity={rimLightIntensity}
                fillLightIntensity={fillLightIntensity}
                frontFillLightIntensity={frontFillLightIntensity}
                showLightIndicators={showLightIndicators}
              />
            </Suspense>
          </div>
        </div>

        {/* Spacer - reserves vertical space for the visible cigarette above the title */}
        <div className="h-[8rem]" aria-hidden />

        {/* Title and subtitle - normal flow, z-index above canvas so clicks pass through */}
        <div
          className="title-intro relative z-10 flex flex-col items-center gap-4 w-full px-5"
        >
          <div className="title-responsive" style={{ textAlign: 'center', lineHeight: '.7' }}>
            <div className="title-calvo mt-4 mb-6">Cig</div>
            <div className="title-crush" aria-label="World">
              {'WORLD'.split('').map((ch, i) => (
                <span key={i} className="title-crush-ch" style={{ transform: `scaleY(${[1, 0.78, 0.62, 0.78, 1][i]})` }}>{ch}</span>
              ))}
            </div>
          </div>
          <div className="subtitle-intro flex justify-center gap-2 -my-2">
            {[...Array(3)].map((_, i) => <span key={i} className="star">&#9733;</span>)}
          </div>
          <p
            className="relative z-10 text-center uppercase px-5 mt-3 mb-3"
            style={{
              color: '#262262',
              fontFamily: "'56th Street', sans-serif",
              letterSpacing: '0.06em',
              lineHeight: '1.3',
              fontSize: '1rem',
            }}
          >
            The Official App of Joey's Big Natural Italian Bachelor Bonanza 2026
          </p>
        </div>
      </section>

      {/* Game cards - inline below hero */}
      <div
        className="relative z-10 pt-6 pb-8 flex flex-row items-stretch justify-center gap-4 cards-slide-up"
        style={{ paddingLeft: '20px', paddingRight: '20px' }}
      >
        <button
          type="button"
          onClick={handleDareCardClick}
          className="card-dare card-press pack-container flex-1 basis-0 min-w-0 flex flex-col items-center justify-start p-4 min-h-[17.5rem] touch-manipulation"
        >
          <span className="card-label" style={{ color: '#262262' }}>Dare</span>
          <div className="flex-1 flex items-center justify-center">
            <img
              src="/Subject%203.png"
              alt=""
              loading="lazy"
              fetchPriority="low"
              className="w-28 h-auto object-contain [filter:drop-shadow(0.5px_0_0_#262262)_drop-shadow(-0.5px_0_0_#262262)_drop-shadow(0_0.5px_0_#262262)_drop-shadow(0_-0.5px_0_#262262)]"
            />
          </div>
        </button>
        <button
          type="button"
          onClick={handleSmokeCardClick}
          className="card-smoke card-press pack-container flex-1 basis-0 min-w-0 flex flex-col items-center justify-start p-4 min-h-[17.5rem] touch-manipulation"
        >
          <span className="card-label" style={{ color: '#262262' }}>Shoot</span>
          <div className="flex-1 flex items-center justify-center">
            <img
              src="/cig-subject.png"
              alt=""
              loading="lazy"
              fetchPriority="low"
              className="w-28 h-auto object-contain [filter:drop-shadow(0.375px_0_0_#262262)_drop-shadow(-0.375px_0_0_#262262)_drop-shadow(0_0.375px_0_#262262)_drop-shadow(0_-0.375px_0_#262262)]"
            />
          </div>
        </button>
      </div>

      {/* Footer */}
      <footer className="w-full py-3 text-center">
        {/* Curves above */}
        <svg viewBox="0 0 200 24" className="w-full" style={{ display: 'block', marginBottom: '6px', height: '20px' }}>
          <path d="M 40 6 Q 100 20 160 6" fill="none" stroke="#262262" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M 55 1 Q 100 12 145 1" fill="none" stroke="#262262" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p style={{ color: '#262262', fontFamily: "'Druk Wide', sans-serif", fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Alright, I'll Smoke One
        </p>
        {/* Curves below */}
        <svg viewBox="0 0 200 24" className="w-full" style={{ display: 'block', marginTop: '6px', height: '20px' }}>
          <path d="M 55 23 Q 100 12 145 23" fill="none" stroke="#262262" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M 40 18 Q 100 4 160 18" fill="none" stroke="#262262" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </footer>
    </div>
    </IconContext.Provider>
  );
}

export default App;
