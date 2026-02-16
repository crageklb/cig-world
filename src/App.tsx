import { useState, lazy, Suspense } from 'react';
import { IconContext, Lightning, ArrowLeft } from '@phosphor-icons/react';

const CigaretteScene = lazy(() => import('./components/CigaretteScene'));

function App() {
  const [, setShowDare] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'dare'>('home');
  const [skipIntro, setSkipIntro] = useState(false);

  const handleDareCardClick = () => {
    setCurrentPage('dare');
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
        <div className="w-full h-dvh bg-black relative">
          <button
            onClick={handleBack}
            className="fixed top-0 left-0 z-50 p-4 flex items-center gap-2 text-white/90 hover:text-white active:opacity-80 transition-opacity"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
            aria-label="Back to home"
          >
            <ArrowLeft size={24} weight="regular" />
            <span className="text-base font-medium">Back</span>
          </button>
          <h1
            className="fixed top-0 left-0 right-0 pt-12 pb-4 text-center text-white"
            style={{
              fontFamily: "'Manufacturing Consent', sans-serif",
              fontSize: 'clamp(2rem, 8vw, 4rem)',
              paddingTop: 'max(3rem, env(safe-area-inset-top) + 2rem)',
            }}
          >
            Dare
          </h1>
        </div>
      </IconContext.Provider>
    );
  }

  return (
    <IconContext.Provider value={{ color: 'currentColor', size: 20, weight: 'light' }}>
    <div className={`w-full h-dvh relative overflow-hidden ${skipIntro ? 'intro-skipped' : ''}`}>
      {/* Noise overlay - fixed, visible at all scroll positions */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.15] z-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1200 1200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* CSS smoke blobs - fixed full-page, behind content */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Layer 1 */}
        <div 
          className="absolute"
          style={{
            top: '20%',
            left: '15%',
            width: '50%',
            height: '60%',
            background: 'radial-gradient(ellipse 70% 55% at 40% 45%, rgba(160, 160, 170, 0.9) 0%, transparent 65%)',
            filter: 'blur(80px)',
            animation: 'smokeFloat1 25s ease-in-out infinite',
          }}
        />
        {/* Layer 2 */}
        <div 
          className="absolute"
          style={{
            top: '40%',
            left: '55%',
            width: '45%',
            height: '55%',
            background: 'radial-gradient(ellipse 60% 80% at 55% 50%, rgba(150, 155, 165, 0.9) 0%, transparent 60%)',
            filter: 'blur(100px)',
            animation: 'smokeFloat2 30s ease-in-out infinite',
          }}
        />
        {/* Layer 3 */}
        <div 
          className="absolute"
          style={{
            top: '10%',
            left: '40%',
            width: '55%',
            height: '50%',
            background: 'radial-gradient(ellipse 75% 45% at 50% 55%, rgba(155, 160, 170, 0.9) 0%, transparent 55%)',
            filter: 'blur(90px)',
            animation: 'smokeFloat3 35s ease-in-out infinite',
          }}
        />
        {/* Layer 4 */}
        <div 
          className="absolute"
          style={{
            top: '50%',
            left: '10%',
            width: '40%',
            height: '65%',
            background: 'radial-gradient(ellipse 50% 70% at 45% 40%, rgba(145, 150, 160, 0.9) 0%, transparent 65%)',
            filter: 'blur(110px)',
            animation: 'smokeFloat4 28s ease-in-out infinite',
          }}
        />
        {/* Layer 5 */}
        <div 
          className="absolute"
          style={{
            top: '5%',
            left: '65%',
            width: '48%',
            height: '52%',
            background: 'radial-gradient(ellipse 65% 50% at 50% 60%, rgba(155, 160, 170, 0.9) 0%, transparent 58%)',
            filter: 'blur(95px)',
            animation: 'smokeFloat5 32s ease-in-out infinite',
          }}
        />
        {/* Layer 6 */}
        <div 
          className="absolute"
          style={{
            top: '30%',
            left: '25%',
            width: '52%',
            height: '58%',
            background: 'radial-gradient(ellipse 55% 75% at 48% 52%, rgba(150, 155, 165, 0.9) 0%, transparent 62%)',
            filter: 'blur(105px)',
            animation: 'smokeFloat6 27s ease-in-out infinite',
          }}
        />
        {/* Layer 7 */}
        <div 
          className="absolute"
          style={{
            top: '15%',
            left: '5%',
            width: '58%',
            height: '48%',
            background: 'radial-gradient(ellipse 80% 48% at 42% 58%, rgba(160, 165, 175, 0.9) 0%, transparent 56%)',
            filter: 'blur(88px)',
            animation: 'smokeFloat7 33s ease-in-out infinite',
          }}
        />
        {/* Layer 8 */}
        <div 
          className="absolute"
          style={{
            top: '45%',
            left: '50%',
            width: '46%',
            height: '62%',
            background: 'radial-gradient(ellipse 58% 68% at 52% 46%, rgba(145, 150, 160, 0.9) 0%, transparent 64%)',
            filter: 'blur(98px)',
            animation: 'smokeFloat8 29s ease-in-out infinite',
          }}
        />
        {/* Layer 9 */}
        <div 
          className="absolute"
          style={{
            top: '25%',
            left: '70%',
            width: '42%',
            height: '56%',
            background: 'radial-gradient(ellipse 62% 52% at 55% 48%, rgba(155, 160, 170, 0.9) 0%, transparent 59%)',
            filter: 'blur(92px)',
            animation: 'smokeFloat1 31s ease-in-out infinite reverse',
          }}
        />
        {/* Layer 10 */}
        <div 
          className="absolute"
          style={{
            top: '35%',
            left: '0%',
            width: '50%',
            height: '70%',
            background: 'radial-gradient(ellipse 68% 58% at 38% 54%, rgba(160, 165, 175, 0.9) 0%, transparent 61%)',
            filter: 'blur(102px)',
            animation: 'smokeFloat2 26s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Hero section */}
      <section className="relative h-[70vh] min-h-[32rem] -mt-12">
      {/* Cigarette, title and subtitle - grouped with fixed heights so position is viewport-stable */}
      <div
        className="absolute inset-x-0 flex flex-col items-center pointer-events-none z-5"
        style={{ top: 'max(0.2rem, env(safe-area-inset-top))' }}
      >
        {/* Fixed-height cigarette canvas - lazy-loaded, does not block initial render */}
        <div className="relative w-full max-w-xl h-[40rem] shrink-0 pointer-events-auto">
          <Suspense fallback={<div className="w-full h-full bg-transparent" aria-hidden />}>
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
        {/* Title and subtitle - flow below cigarette */}
        <div
          className="title-intro flex flex-col items-center gap-4 w-full px-5"
          style={{ marginTop: '-24rem' }}
        >
          <div
            className="title-responsive"
            style={{
              fontFamily: "'Manufacturing Consent', sans-serif",
              color: 'white',
              textAlign: 'center',
              letterSpacing: '0em',
              lineHeight: '.7',
            }}
          >
            <div>Cig</div>
            <div>World</div>
          </div>
          <div className="subtitle-intro w-full px-4 mt-2">
            <p className="text-white/50 text-lg md:text-base text-center tracking-tight">
              An experience inspired by Giuseppe Corrado Calvo
            </p>
          </div>
        </div>
      </div>
      </section>

      {/* Mobile: fixed buttons peeking from bottom */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-6 py-4 flex flex-row items-end justify-center gap-0 cards-slide-up"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom) + 0.5rem)' }}
      >
        <button
          type="button"
          onClick={handleDareCardClick}
          className="card-dare card-press card-bg flex-1 max-w-[48%] flex flex-col items-center justify-start gap-3 p-4 rounded-2xl border border-white/10 text-white text-lg
            bg-[#242424] shadow-xl transition-colors min-w-0 bg-cover bg-center"
        >
          <span>Dare</span>
          <img
            src="/Subject%203.png"
            alt=""
            className="w-28 h-auto object-contain [filter:drop-shadow(0.5px_0_0_white)_drop-shadow(-0.5px_0_0_white)_drop-shadow(0_0.5px_0_white)_drop-shadow(0_-0.5px_0_white)_drop-shadow(0.5px_0.5px_0_white)_drop-shadow(-0.5px_-0.5px_0_white)_drop-shadow(0.5px_-0.5px_0_white)_drop-shadow(-0.5px_0.5px_0_white)]"
          />
        </button>
        <a
          href="#"
          className="card-smoke card-press card-bg flex-1 max-w-[48%] flex flex-col items-center justify-start gap-3 p-4 rounded-2xl border border-white/10 text-white text-lg
            bg-[#242424] shadow-xl transition-colors min-w-0 z-10 bg-cover bg-center"
        >
          <span>Smoke</span>
          <img
            src="/cig-subject.png"
            alt=""
            className="w-28 h-auto object-contain [filter:drop-shadow(0.375px_0_0_white)_drop-shadow(-0.375px_0_0_white)_drop-shadow(0_0.375px_0_white)_drop-shadow(0_-0.375px_0_white)_drop-shadow(0.375px_0.375px_0_white)_drop-shadow(-0.375px_-0.375px_0_white)_drop-shadow(0.375px_-0.375px_0_white)_drop-shadow(-0.375px_0.375px_0_white)]"
          />
        </a>
      </div>

      {/* Desktop: fixed nav on left */}
      <nav
        className="hidden md:flex fixed z-50 flex-col h-fit gap-4 top-1/2 -translate-y-1/2 left-0 ml-4 px-3 py-6
          bg-white/5 backdrop-blur-0 rounded-xl pointer-events-auto"
      >
        <a
          href="#"
          className="nav-item flex flex-row items-center justify-start gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-base
            hover:bg-white/20 active:bg-white/25 bg-white/10 border border-white/20 transition-colors"
        >
          <Lightning size={20} weight="light" className="shrink-0" />
          <span>Dare</span>
        </a>
      </nav>

      {/* Dare display - hidden for now */}
      {/* <DareDisplay visible={showDare} /> */}
    </div>
    </IconContext.Provider>
  );
}

export default App;
