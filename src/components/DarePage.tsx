import { useEffect, useRef, useState } from 'react';
import { ArrowArcRight, ArrowLeft, CircleNotch, Cigarette } from '@phosphor-icons/react';

const DARES = [
  "do whatever Wes says",
  "do whatever Craig says",
  "do whatever Dom says",
  "do whatever Dean says",
  "do whatever Sully says",
  "order a \"bussy boy\" from the bar",
  "finish his drink",
  "go do a cannonball into the pool",
  "run into the ocean right now",
  "ask a staff member \"where's the closest toilet time?\"",
  "do 10 pushups while smoking a cig",
  "take a shot and do an exaggerated cum face",
  "shotgun a beer",
  "tell the bartender your name at least 5 times while ordering a drink",
  "announce \"I'm gonna cum\" when you take your next shot",
];

const WHATEVER_DARES = DARES.filter((d) => d.includes("whatever "));
const OTHER_DARES = DARES.filter((d) => !d.includes("whatever "));

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Builds a queue of dares: randomly rotated, with at least one "whatever X says" every 2 dares. */
function buildDareQueue(): string[] {
  const whateverShuffled = shuffle(WHATEVER_DARES);
  const otherShuffled = shuffle(OTHER_DARES);
  // Interleave [whatever, other] - strict alternating so no two "other" are adjacent
  const whateverExpanded: string[] = [];
  for (let i = 0; i < otherShuffled.length; i++) {
    whateverExpanded.push(whateverShuffled[i % whateverShuffled.length]);
  }
  const queue: string[] = [];
  for (let i = 0; i < otherShuffled.length; i++) {
    queue.push(whateverExpanded[i], otherShuffled[i]);
  }
  return queue;
}

function createDareQueue() {
  let queue = buildDareQueue();
  return {
    next(): string {
      if (queue.length === 0) queue = buildDareQueue();
      return queue.shift()!;
    },
  };
}

const PUNISHMENTS = [
  'do a shot',
  'shotgun a beer',
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
  const dareQueueRef = useRef(createDareQueue());

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
      setCurrentDare(dareQueueRef.current.next());
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
      setCurrentDare(dareQueueRef.current.next());
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
        <div
          className="title-responsive"
          style={{ textAlign: 'center', lineHeight: '.7', fontSize: 'min(1.5rem, 6vw)', marginTop: '2rem' }}
        >
          <div className="title-calvo title-calvo--sm">PREPARING YOUR PUNISHMENT...</div>
        </div>
      </div>

      {/* Punishment revealed: YOU ALL HAVE TO... + punishment card + buttons */}
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-opacity duration-500 ${
          phase === 'punishmentRevealed' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          paddingLeft: 'var(--view-padding-x)',
          paddingRight: 'var(--view-padding-x)',
          paddingBottom: 'max(6rem, env(safe-area-inset-bottom) + 5rem)',
        }}
      >
        <div
          className="title-responsive"
          style={{ textAlign: 'center', lineHeight: '.7', fontSize: 'min(1.5rem, 6vw)', marginBottom: '1rem' }}
        >
          <div className="title-calvo title-calvo--sm">YOU ALL HAVE TO...</div>
        </div>
        <div className="dare-card-outer max-w-2xl w-full block" style={{ marginBottom: DARE_LAYOUT.cardMarginBottom, marginLeft: 5, marginRight: 5 }}>
          <div className="dare-card-container">
            <p className="text-center type-heading text-[#1B1B1B]">
              {currentPunishment}
            </p>
          </div>
        </div>
        {/* Desktop: stacked buttons matching game over screen */}
        <div className="hidden md:flex flex-col gap-3 w-full max-w-md mx-auto mt-6">
          <button
            type="button"
            onClick={handleBackClick}
            disabled={isNavigating}
            className="type-btn dare-btn-card w-full flex items-center justify-center gap-2 py-4 text-[#1B1B1B] active:opacity-80 hover:bg-gray-50 transition-all touch-manipulation disabled:opacity-70 disabled:pointer-events-none"
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
            className="type-btn dare-btn-card w-full flex items-center justify-center py-4 text-[#1B1B1B] active:opacity-80 hover:bg-gray-50 transition-all touch-manipulation"
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
        <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={handleBackClick}
            disabled={isNavigating}
            className="type-btn dare-btn-card w-full flex items-center justify-center gap-2 py-4 text-[#1B1B1B] active:opacity-80 hover:bg-gray-50 transition-all touch-manipulation disabled:opacity-70 disabled:pointer-events-none"
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
            className="type-btn dare-btn-card w-full flex items-center justify-center py-4 text-[#1B1B1B] active:opacity-80 hover:bg-gray-50 transition-all touch-manipulation"
          >
            NEW DARE
          </button>
        </div>
      </div>
    </div>
  );
}
