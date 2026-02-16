import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Cigarette, Heart, Target, Trophy } from '@phosphor-icons/react';

interface CigShot {
  id: number;
  x: number;
  y: number;
  spawnTime: number;
}

interface Droplet {
  id: number;
  x: number;
  y: number;
}

const LIVES_INITIAL = 3;
const HOLD_INTERVAL_MS = 400;
const HOLD_INTERVAL_SUPER_MS = 30;
const HOLD_DELAY_MS = 120;
const SUPER_CIG_DURATION_MS = 10000;
const SUPER_CIG_TRIGGER_EVERY = 50;
const CIG_SPEED = 0.55;
const DROPLET_SPEED_BASE = 0.06;
const DROPLET_SPEED_MAX = 0.22;
const DROPLET_SPAWN_INTERVAL_BASE_MS = 1400;
const DROPLET_SPAWN_INTERVAL_MIN_MS = 280;
const DROPLET_SPAWN_JITTER_MS = 400;
const COLLISION_RADIUS = 6;
const CIG_LIFETIME_MS = 3500;

export default function SmokePage({ onBack }: { onBack: () => void }) {
  const [cigs, setCigs] = useState<CigShot[]>([]);
  const [droplets, setDroplets] = useState<Droplet[]>([]);
  const [lives, setLives] = useState(LIVES_INITIAL);
  const [points, setPoints] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [superCigActive, setSuperCigActive] = useState(false);
  const [showSuperCigMessage, setShowSuperCigMessage] = useState(false);

  const nextCigId = useRef(0);
  const nextDropletId = useRef(0);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPosRef = useRef({ clientX: 0, clientY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const cigsRef = useRef<CigShot[]>([]);
  const dropletsRef = useRef<Droplet[]>([]);
  const gameStartTimeRef = useRef(performance.now());
  const gameOverRef = useRef(false);
  const pointsRef = useRef(0);
  const spawnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const superCigActiveRef = useRef(false);
  const superCigEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  cigsRef.current = cigs;
  dropletsRef.current = droplets;
  gameOverRef.current = gameOver;
  pointsRef.current = points;
  superCigActiveRef.current = superCigActive;

  const spawnCig = useCallback(
    (clientX: number, clientY: number, lockedToBottom = false) => {
      if (gameOverRef.current) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = lockedToBottom ? 95 : ((clientY - rect.top) / rect.height) * 100;
      const id = nextCigId.current++;
      setCigs((prev) => [...prev, { id, x, y, spawnTime: performance.now() }]);
    },
    []
  );

  const spawnDroplet = useCallback(() => {
    if (gameOverRef.current) return;
    const x = 10 + Math.random() * 80;
    const id = nextDropletId.current++;
    setDroplets((prev) => [...prev, { id, x, y: 0 }]);
  }, []);

  const scheduleNextDroplet = useCallback(() => {
    if (gameOverRef.current) return;
    const elapsedSec = (performance.now() - gameStartTimeRef.current) / 1000;
    const pts = pointsRef.current;
    const intervalMax = Math.max(
      DROPLET_SPAWN_INTERVAL_MIN_MS,
      DROPLET_SPAWN_INTERVAL_BASE_MS - pts * 40 - elapsedSec * 25
    );
    const delay = intervalMax + Math.random() * DROPLET_SPAWN_JITTER_MS;
    spawnTimeoutRef.current = setTimeout(() => {
      spawnDroplet();
      scheduleNextDroplet();
    }, delay);
  }, [spawnDroplet]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    lastPosRef.current = { clientX: e.clientX, clientY: e.clientY };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (gameOver) return;
      e.preventDefault();
      const { clientX, clientY } = e;
      lastPosRef.current = { clientX, clientY };
      spawnCig(clientX, clientY);

      holdTimeoutRef.current = setTimeout(() => {
        holdTimeoutRef.current = null;
        const fireNext = () => {
          const interval = superCigActiveRef.current
            ? HOLD_INTERVAL_SUPER_MS
            : HOLD_INTERVAL_MS;
          holdIntervalRef.current = window.setTimeout(() => {
            if (gameOverRef.current) return;
            const { clientX: cx } = lastPosRef.current;
            spawnCig(cx, 0, true);
            fireNext();
          }, interval) as unknown as ReturnType<typeof setInterval>;
        };
        fireNext();
      }, HOLD_DELAY_MS);
    },
    [spawnCig, gameOver]
  );

  const clearHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearTimeout(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const handlePointerUp = useCallback(clearHold, [clearHold]);
  const handlePointerLeave = useCallback(clearHold, [clearHold]);

  const handleRestart = useCallback(() => {
    gameOverRef.current = false;
    gameStartTimeRef.current = performance.now();
    setGameOver(false);
    setLives(LIVES_INITIAL);
    setPoints(0);
    setCigs([]);
    setDroplets([]);
    setSuperCigActive(false);
    setShowSuperCigMessage(false);
    superCigActiveRef.current = false;
    cigsRef.current = [];
    dropletsRef.current = [];
    if (superCigEndTimeoutRef.current) {
      clearTimeout(superCigEndTimeoutRef.current);
      superCigEndTimeoutRef.current = null;
    }
  }, []);

  // Droplet spawning - progressive difficulty
  useEffect(() => {
    if (gameOver) return;
    const t = setTimeout(() => {
      scheduleNextDroplet();
    }, 1500);
    return () => {
      clearTimeout(t);
      if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
    };
  }, [gameOver, scheduleNextDroplet]);

  // Game loop
  useEffect(() => {
    const loop = () => {
      if (gameOverRef.current) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();
      const elapsedSec = (now - gameStartTimeRef.current) / 1000;
      const pts = pointsRef.current;
      const dropletSpeed = Math.min(
        DROPLET_SPEED_MAX,
        DROPLET_SPEED_BASE + pts * 0.0015 + elapsedSec * 0.0012
      );

      const currentCigs = cigsRef.current;
      const currentDroplets = dropletsRef.current;

      const updatedCigs = currentCigs
        .map((c) => ({ ...c, y: c.y - CIG_SPEED }))
        .filter((c) => c.y > -20 && now - c.spawnTime < CIG_LIFETIME_MS);

      const updatedDroplets = currentDroplets.map((d) => ({
        ...d,
        y: d.y + dropletSpeed,
      }));

      // Droplets that passed bottom = lose life
      const passedBottom = updatedDroplets.filter((d) => d.y > 100);
      const stillOnScreen = updatedDroplets.filter((d) => d.y <= 100);

      if (passedBottom.length > 0) {
        setLives((l) => {
          const newLives = Math.max(0, l - passedBottom.length);
          if (newLives <= 0) {
            gameOverRef.current = true;
            setGameOver(true);
            if (spawnTimeoutRef.current) {
              clearTimeout(spawnTimeoutRef.current);
              spawnTimeoutRef.current = null;
            }
          }
          return newLives;
        });
      }

      const hitCigIds = new Set<number>();
      const hitDropletIds = new Set<number>();
      for (const cig of updatedCigs) {
        for (const drop of stillOnScreen) {
          const dx = cig.x - drop.x;
          const dy = cig.y - drop.y;
          if (Math.sqrt(dx * dx + dy * dy) < COLLISION_RADIUS) {
            hitCigIds.add(cig.id);
            hitDropletIds.add(drop.id);
          }
        }
      }

      if (hitDropletIds.size > 0) {
        const newPoints = pts + hitDropletIds.size;
        setHighScore((h) => Math.max(h, newPoints));
        const prevLevel = Math.floor(pts / SUPER_CIG_TRIGGER_EVERY);
        const newLevel = Math.floor(newPoints / SUPER_CIG_TRIGGER_EVERY);
        if (newLevel > prevLevel) {
          superCigActiveRef.current = true;
          setSuperCigActive(true);
          setShowSuperCigMessage(true);
          if (superCigEndTimeoutRef.current) {
            clearTimeout(superCigEndTimeoutRef.current);
          }
          superCigEndTimeoutRef.current = setTimeout(() => {
            superCigActiveRef.current = false;
            setSuperCigActive(false);
            superCigEndTimeoutRef.current = null;
          }, SUPER_CIG_DURATION_MS);
          setTimeout(() => setShowSuperCigMessage(false), 2000);
        }
        setPoints((p) => p + hitDropletIds.size);
      }

      const finalCigs = updatedCigs.filter((c) => !hitCigIds.has(c.id));
      const finalDroplets = stillOnScreen.filter(
        (d) => !hitDropletIds.has(d.id)
      );

      cigsRef.current = finalCigs;
      dropletsRef.current = finalDroplets;
      setCigs(finalCigs);
      setDroplets(finalDroplets);

      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-white z-50 touch-manipulation select-none overflow-hidden"
      style={{ touchAction: 'manipulation' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="fixed top-0 left-0 z-[60] p-4 flex items-center gap-2 text-[#1B1B1B] hover:opacity-80 active:opacity-70 transition-opacity touch-manipulation"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        aria-label="Back to home"
      >
        <ArrowLeft size={24} weight="regular" />
        <span className="text-base font-medium">Back</span>
      </button>

      {/* SUPER CIG message */}
      {showSuperCigMessage && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center pointer-events-none">
          <p className="super-cig-text text-4xl md:text-6xl font-black text-[#1B1B1B] uppercase tracking-tighter">
            SUPER CIG
          </p>
        </div>
      )}

      {/* Lives, score, high score - top right */}
      <div
        className="fixed top-0 right-0 z-[60] flex items-center gap-6 p-4 text-[#1B1B1B] font-semibold"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-1.5">
          <Heart size={22} weight="fill" className="text-red-500" />
          <span>{lives}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Target size={22} weight="fill" className="text-[#1B1B1B]" />
          <span>{points}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy size={22} weight="fill" className="text-amber-500" />
          <span>{highScore}</span>
        </div>
      </div>

      {/* Game over overlay */}
      {gameOver && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-white">
          {/* Subject 9 background - large, faded, at bottom */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <img
              src="/Subject%209.png"
              alt=""
              className="w-[min(120vw,80rem)] h-auto object-contain opacity-[1] translate-y-[50%]"
            />
          </div>
          {/* Gradient overlay - same as Dare punishment: transparent top, white bottom */}
          <div
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{ background: 'linear-gradient(to bottom, transparent 0%, transparent 50%, white 100%)' }}
          />
          <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
            <p className="text-2xl font-bold text-[#1B1B1B] mb-2">Game Over</p>
            <p className="text-lg text-[#1B1B1B]/70">
              Final score: {points} points
            </p>
          </div>
          <div
            className="flex flex-row gap-3 px-4 pb-4 relative z-10"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))', paddingTop: '1rem' }}
          >
            <button
              type="button"
              onClick={handleRestart}
              className="flex-1 min-w-0 py-4 bg-white rounded-xl border shadow-sm border-black/15 text-[#1B1B1B] font-semibold text-base active:opacity-80 hover:bg-black/5 hover:bg-gray-100 transition-all touch-manipulation"
            >
              RESTART
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex-1 min-w-0 py-4 rounded-xl bg-[#1b1b1b] shadow-sm text-white font-semibold text-base active:opacity-80 hover:bg-[#1b1b1b]/90 transition-opacity touch-manipulation"
            >
              HOME
            </button>
          </div>
        </div>
      )}

      {/* Droplets */}
      {droplets.map(({ id, x, y }) => (
        <img
          key={id}
          src="/piss.png"
          alt=""
          className="droplet-img absolute pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}

      {/* Cigarettes */}
      {cigs.map(({ id, x, y }) => (
        <div
          key={id}
          className="cig-shot-js absolute pointer-events-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Cigarette size={32} weight="fill" className="text-[#8B7355]" />
        </div>
      ))}
    </div>
  );
}
