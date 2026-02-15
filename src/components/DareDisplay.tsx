import { useEffect, useState } from 'react';

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

interface DareDisplayProps {
  visible: boolean;
}

export default function DareDisplay({ visible }: DareDisplayProps) {
  const [currentDare, setCurrentDare] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      const randomDare = DARES[Math.floor(Math.random() * DARES.length)];
      
      // Small delay for animation
      setTimeout(() => {
        setCurrentDare(randomDare);
      }, 300);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-x-0 bottom-0 flex items-end justify-center p-8 transition-all duration-500 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="bg-gradient-to-br from-punta-cana-sunset to-punta-cana-ocean rounded-2xl shadow-2xl p-8 max-w-2xl w-full border-4 border-yellow-300 transform hover:scale-105 transition-transform">
        <h2 className="text-3xl font-bold text-white mb-4 text-center drop-shadow-lg">
          🔥 BACHELOR PARTY DARE 🔥
        </h2>
        <p className="text-xl text-white text-center leading-relaxed font-medium drop-shadow">
          {currentDare}
        </p>
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              const randomDare = DARES[Math.floor(Math.random() * DARES.length)];
              setCurrentDare(randomDare);
            }}
            className="bg-white text-punta-cana-ocean px-6 py-3 rounded-full font-bold hover:bg-yellow-300 hover:scale-110 transition-all shadow-lg"
          >
            🎲 Get Another Dare
          </button>
        </div>
      </div>
    </div>
  );
}
