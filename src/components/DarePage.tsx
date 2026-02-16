import { useEffect, useState } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

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

interface DarePageProps {
  onBack: () => void;
}

export default function DarePage({ onBack }: DarePageProps) {
  const [phase, setPhase] = useState<'spinning' | 'revealed'>('spinning');
  const [currentDare, setCurrentDare] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('revealed');
      setCurrentDare(pickRandomDare());
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleSkip = () => {
    setCurrentDare(pickRandomDare());
  };

  const handleAccept = () => {
    // Stay on dare - user has accepted. Could add feedback like a toast.
  };

  return (
    <div className="w-full min-h-dvh h-dvh bg-black relative flex flex-col">
      <button
        onClick={onBack}
        className="fixed top-0 left-0 z-50 p-4 flex items-center gap-2 text-white/90 hover:text-white active:opacity-80 transition-opacity"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        aria-label="Back to home"
      >
        <ArrowLeft size={24} weight="regular" />
        <span className="text-base font-medium">Back</span>
      </button>

      {/* Spinning image - centered, fades out when phase changes */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          phase === 'revealed' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <img
          src="/Subject%203.png"
          alt=""
          className="w-48 h-auto max-w-[80vw] animate-dare-spin object-contain"
          style={{
            filter: 'drop-shadow(0.5px 0 0 white) drop-shadow(-0.5px 0 0 white) drop-shadow(0 0.5px 0 white) drop-shadow(0 -0.5px 0 white) drop-shadow(0.5px 0.5px 0 white) drop-shadow(-0.5px -0.5px 0 white) drop-shadow(0.5px -0.5px 0 white) drop-shadow(-0.5px 0.5px 0 white)',
          }}
        />
      </div>

      {/* Dare text and buttons - fades in when phase changes */}
      <div
        className={`flex flex-1 flex-col items-center justify-center px-6 transition-opacity duration-500 ${
          phase === 'revealed' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom) + 4rem)' }}
      >
        <p
          className="text-center text-xl md:text-2xl text-white leading-relaxed max-w-2xl mb-10"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {currentDare}
        </p>
        <div className="flex flex-row gap-4">
          <button
            type="button"
            onClick={handleAccept}
            className="px-8 py-3 rounded-full bg-white text-black font-semibold text-base active:opacity-80 hover:bg-white/90 transition-opacity"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="px-8 py-3 rounded-full border-2 border-white/60 text-white font-semibold text-base active:opacity-80 hover:border-white hover:bg-white/10 transition-all"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
