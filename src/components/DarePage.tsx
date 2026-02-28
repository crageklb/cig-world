import { useEffect, useState } from 'react';
import { ArrowArcRight, ArrowLeft, CircleNotch, Cigarette } from '@phosphor-icons/react';

const DARES = [
  "Do 20 push-ups while someone holds a beer on your back!",
  "Sing 'I Will Always Love You' at the top of your lungs to a stranger",
  "Take a shot with your hands behind your back",
  "Wear your shirt inside out and backwards for the next hour",
  "Do your best salsa dance with a palm tree for 30 seconds",
  "Challenge someone to a plank contest - loser buys next round!",
  "Speak in a British accent for the next 15 minutes",
  "Take a selfie with 5 strangers and post it to the group chat",
  "Do the worm on the dance floor",
  "Chug a beer while standing on one leg",
  "Compliment 3 people in the most dramatic way possible",
  "Create and perform a 30-second rap about the bachelor",
  "Do 10 burpees right now, right here",
  "Piggyback ride another groomsman to the bar and back",
  "Tell the bartender your most embarrassing story",
  "Dance with a mop or broom like it's your prom date",
  "Attempt to limbo under an imaginary bar",
  "Order your next drink in a made-up language",
  "Do your best impression of the bachelor",
  "Call your mom and tell her you love her (bonus points for tears)",
];

function pickRandomDare() {
  return DARES[Math.floor(Math.random() * DARES.length)];
}

const PUNISHMENTS = [
  'You all have to do a shot',
  'You all have to shotgun a beer',
];

function pickRandomPunishment() {
  return PUNISHMENTS[Math.floor(Math.random() * PUNISHMENTS.length)];
}

interface DarePageProps {
  onBack: () => void;
}

const SKIPS_INITIAL = 3;

/** Controls dare card + skip badge layout. Adjust these to change spacing/position. */
const DARE_LAYOUT = {
  /** Vertical offset: larger = dare sits higher, smaller = dare sits lower */
  containerPaddingBottom: 'max(8rem, env(safe-area-inset-bottom) + 6rem)',
  /** Space between dare card and skip badge */
  cardToBadgeGap: '1rem', // mt-4 = 1rem
  /** Space below dare card (before badge) */
  cardMarginBottom: '3.5rem', // mb-10 = 2.5rem
} as const;

export default function DarePage({ onBack }: DarePageProps) {
  const [phase, setPhase] = useState<'spinning' | 'revealed' | 'punishment' | 'punishmentRevealed'>('spinning');
  const [currentDare, setCurrentDare] = useState('');
  const [currentPunishment, setCurrentPunishment] = useState('');
  const [skipsRemaining, setSkipsRemaining] = useState(SKIPS_INITIAL);
  const [showNoSkipsMessage, setShowNoSkipsMessage] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleBackClick = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => onBack());
    });
  };

  useEffect(() => {
    if (phase !== 'spinning') return;
    const timer = setTimeout(() => {
      setPhase('revealed');
      setCurrentDare(pickRandomDare());
    }, 5000);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleNewDare = () => {
    setPhase('spinning');
    setCurrentDare('');
    setCurrentPunishment('');
    setSkipsRemaining(SKIPS_INITIAL);
  };

  useEffect(() => {
    if (!showNoSkipsMessage) return;
    const timer = setTimeout(() => setShowNoSkipsMessage(false), 2500);
    return () => clearTimeout(timer);
  }, [showNoSkipsMessage]);

  const handleSkip = () => {
    if (skipsRemaining > 0) {
      setSkipsRemaining((s) => s - 1);
      setCurrentDare(pickRandomDare());
    } else {
      setShowNoSkipsMessage(true);
    }
  };

  const handleAccept = () => {
    setPhase('punishment');
    setCurrentPunishment(pickRandomPunishment());
  };

  useEffect(() => {
    if (phase !== 'punishment') return;
    const timer = setTimeout(() => {
      setPhase('punishmentRevealed');
    }, 5000);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div className="w-full h-dvh relative flex flex-col overflow-hidden" style={{ backgroundColor: '#BEBDDF' }}>
      {/* Halftone dot overlay - vintage print texture (same as home) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.35] z-0 halftone-overlay" />
      {phase === 'revealed' && (
        <button
          onClick={handleBackClick}
          disabled={isNavigating}
          className="fixed top-0 left-0 z-50 p-4 flex items-center gap-2 text-[#1B1B1B] hover:opacity-80 active:opacity-70 transition-opacity touch-manipulation disabled:opacity-70 disabled:pointer-events-none"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
          aria-label="Back to home"
          aria-busy={isNavigating}
        >
          {isNavigating ? (
            <CircleNotch size={24} weight="bold" className="animate-spin" />
          ) : (
            <ArrowLeft size={24} weight="regular" />
          )}
          <span className="type-btn type-btn--sm">{isNavigating ? 'Loading…' : 'Big back'}</span>
        </button>
      )}

      {/* Initial spinning image - centered, fades out when dare revealed */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-700 ${
          phase === 'revealed' || phase === 'punishment' || phase === 'punishmentRevealed' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <img
          src="/Subject%203.png"
          alt=""
          className="w-48 h-auto max-w-[80vw] animate-dare-spin object-contain drop-shadow-lg"
        />
      </div>

      {/* Punishment revealed only: Subject 6 background - slides up from bottom */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
          phase === 'punishmentRevealed' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <img
          src="/Subject%206.png"
          alt=""
          className={`w-[min(120vw,80rem)] h-auto object-contain opacity-[1] ${
            phase === 'punishmentRevealed' ? 'subject6-slide-up' : ''
          }`}
        />
      </div>

      {/* Punishment revealed only: gradient overlay - transparent top, white bottom */}
      <div
        className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 ${
          phase === 'punishmentRevealed' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ background: 'linear-gradient(to bottom, transparent 0%, transparent 50%, #BEBDDF 100%)' }}
      />

      {/* Punishment loading: spinning Subject 5 + "Preparing your punishment" */}
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center px-6 transition-opacity duration-500 ${
          phase === 'punishment' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <img
          src="/Subject%205.png"
          alt=""
          className="w-48 h-auto max-w-[80vw] animate-dare-spin object-contain drop-shadow-lg mb-8"
        />
        <p className="text-center text-xl text-[#1B1B1B]" style={{ fontFamily: "'Druk Wide', sans-serif" }}>
          Preparing your punishment
        </p>
      </div>

      {/* Punishment revealed: message + buttons - absolutely centered */}
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center px-6 transition-opacity duration-500 ${
          phase === 'punishmentRevealed' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom) + 5rem)' }}
      >
        <p
          className="text-center text-xl md:text-2xl text-[#1B1B1B] leading-relaxed max-w-2xl mb-10"
          style={{ fontFamily: "'Druk Wide', sans-serif" }}
        >
          {currentPunishment}
        </p>
        {/* Desktop: inline buttons */}
        <div className="hidden md:flex flex-row gap-4">
          <button
            type="button"
            onClick={handleBackClick}
            disabled={isNavigating}
            className="type-btn px-8 py-3 rounded-lg border-2 bg-white border-gray-400 text-[#1B1B1B] active:opacity-80 hover:border-gray-600 hover:bg-gray-100 transition-all touch-manipulation disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isNavigating ? (
              <>
                <CircleNotch size={18} weight="bold" className="animate-spin" />
                Loading…
              </>
            ) : (
              'HOME'
            )}
          </button>
          <button
            type="button"
            onClick={handleNewDare}
            className="type-btn px-8 py-3 rounded-lg border-2 border-gray-400 bg-white text-[#1B1B1B] active:opacity-80 hover:border-gray-600 hover:bg-gray-100 transition-all touch-manipulation"
          >
            NEW DARE
          </button>
        </div>
      </div>

      {/* No skips left message overlay */}
      {showNoSkipsMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 px-6">
          <p className="text-center type-btn text-xl md:text-2xl font-bold text-white">
            NO SKIPS LEFT BITCH DO IT
          </p>
        </div>
      )}

      {/* Dare text - absolutely centered in viewport */}
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-opacity duration-500 ${
          phase === 'revealed' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          paddingLeft: 'var(--view-padding-x)',
          paddingRight: 'var(--view-padding-x)',
          paddingBottom: DARE_LAYOUT.containerPaddingBottom,
        }}
      >
        <div
          className="title-responsive"
          style={{ textAlign: 'center', lineHeight: '.7', fontSize: 'min(1.5rem, 6vw)', marginBottom: '1rem' }}
        >
          <div className="title-calvo title-calvo--sm">JOEY HAS TO...</div>
        </div>
        <div className="dare-card-outer max-w-2xl w-full block" style={{ marginBottom: DARE_LAYOUT.cardMarginBottom, marginLeft: 5, marginRight: 5 }}>
          <div className="dare-card-container">
            <p className="text-center type-heading text-[#1B1B1B]">
              {currentDare}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom sheet + skips badge: badge sits 16px above sheet, independent of dare card */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-10 flex flex-col-reverse items-center gap-4 ${
          phase === 'revealed' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Bottom sheet */}
        <div
          className={`dare-bottom-sheet w-full bg-[#262262] flex flex-col gap-3 ${
            phase === 'revealed' ? 'dare-bottom-sheet-visible' : ''
          }`}
          style={{
            paddingLeft: 'var(--view-padding-x)',
            paddingRight: 'var(--view-padding-x)',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingTop: '1rem',
          }}
        >
          <p className="text-center" style={{ marginBottom: '0rem' }}>
            <span className="title-calvo title-calvo--sm" style={{ fontSize: 'min(1.5rem, 6vw)' }}>DID HE DO IT?</span>
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={handleAccept}
              className="type-btn dare-btn-card flex-1 md:flex-none min-w-0 flex items-center justify-center gap-2 py-4 md:py-3 px-8 text-[#1B1B1B] active:opacity-80 hover:bg-gray-50 transition-all touch-manipulation"
            >
              <Cigarette size={20} weight="bold" className="md:hidden" />
              <span className="md:hidden">HELL YEAH</span>
              <span className="hidden md:inline">Accept</span>
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="type-btn dare-btn-card flex-1 md:flex-none min-w-0 flex items-center justify-center gap-2 py-4 md:py-3 px-8 text-[#1B1B1B] active:opacity-80 hover:bg-gray-50 transition-all touch-manipulation"
            >
              <ArrowArcRight size={20} weight="bold" className="md:hidden" />
              <ArrowArcRight size={18} weight="bold" className="hidden md:block" />
              <span className="md:hidden">NOPE</span>
              <span className="hidden md:inline">Skip</span>
            </button>
          </div>
        </div>
        {/* Skips badge - 16px above bottom sheet via gap-4 */}
        <span
          key={skipsRemaining}
          className={`type-caption inline-flex items-center justify-center gap-1.5 w-fit px-3 py-1 rounded-full shrink-0 ${
            skipsRemaining === 0 ? 'badge-wiggle' : ''
          } ${skipsRemaining >= SKIPS_INITIAL ? 'invisible' : ''}`}
          style={{
            ...(skipsRemaining === 0
              ? { backgroundColor: '#dc2626', color: 'white' }
              : { color: '#1B1B1B', backgroundColor: 'rgba(27, 27, 27, 0.1)' }),
          }}
        >
          <ArrowArcRight size={12} weight="regular" />
          {skipsRemaining} {skipsRemaining === 1 ? 'skip' : 'skips'} left
        </span>
      </div>

      {/* Mobile: fixed buttons at bottom - punishment phase */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-10 flex flex-col gap-3 transition-opacity duration-500 ${
          phase === 'punishmentRevealed' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          paddingLeft: 'var(--view-padding-x)',
          paddingRight: 'var(--view-padding-x)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          paddingTop: '1rem',
        }}
      >
        <div className="flex flex-row gap-3">
          <button
            type="button"
            onClick={handleBackClick}
            disabled={isNavigating}
            className="type-btn flex-1 min-w-0 flex items-center justify-center gap-2 py-4 rounded-xl bg-white border shadow-sm border-black/15 text-[#1B1B1B] active:opacity-80 hover:bg-black/5 hover:bg-gray-100 transition-all touch-manipulation disabled:opacity-70 disabled:pointer-events-none"
          >
            {isNavigating ? (
              <>
                <CircleNotch size={20} weight="bold" className="animate-spin" />
                Loading…
              </>
            ) : (
              'HOME'
            )}
          </button>
          <button
            type="button"
            onClick={handleNewDare}
            className="type-btn flex-1 min-w-0 py-4 rounded-xl border-2 border-gray-400 bg-white shadow-sm text-[#1B1B1B] active:opacity-80 hover:border-gray-600 hover:bg-gray-100 transition-all touch-manipulation"
          >
            NEW DARE
          </button>
        </div>
      </div>
    </div>
  );
}
