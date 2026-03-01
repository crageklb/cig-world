import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Heart, Target, Trophy } from '@phosphor-icons/react';

interface CigShot {
  id: number;
  x: number;
  y: number;
  spawnTime: number;
  vx?: number;
  curvePhase?: number;
}

interface Droplet {
  id: number;
  x: number;
  y: number;
}

interface Splash {
  id: number;
  x: number;
  y: number;
  spawnTime: number;
  variant?: 'yellow' | 'red';
}

interface SpecialTarget {
  id: number;
  x: number;
  y: number;
  spawnTime: number;
  src: string;
}

interface BazookaTarget {
  id: number;
  x: number;
  y: number;
  spawnTime: number;
}

interface JoJoTarget {
  id: number;
  x: number;
  y: number;
  spawnTime: number;
}

const SPECIAL_TARGET_IMAGES = [
  '/subject-special.png',
  '/subject-special-2.png',
  '/subject-special-3.png',
  '/subject-special-4.png',
];

const LIVES_INITIAL = 3;
const HOLD_INTERVAL_MS = 500;
const HOLD_INTERVAL_SUPER_MS = 80;
const HOLD_INTERVAL_BAZOOKA_MS = 100;
const HOLD_DELAY_MS = 120;
const SUPER_CIG_DURATION_MS = 10000;
const SUPER_CIG_TRIGGER_EVERY = 50;
const CIG_SPEED = 0.38;
const CIG_SPEED_BAZOOKA = 0.75;
const DROPLET_SPEED_BASE = 0.08;
const DROPLET_SPEED_MAX = 0.30;
const DROPLET_SPEED_BAZOOKA_BOOST = 0.06;
const DROPLET_SPAWN_INTERVAL_BASE_MS = 1100;
const DROPLET_SPAWN_INTERVAL_MIN_MS = 220;
const DROPLET_SPAWN_JITTER_MS = 350;
const COLLISION_RADIUS = 6;
const CIG_TIP_OFFSET_Y = -7; /* tip = top of cig (leading edge when shooting up); was -3 (center-ish) */
const CIG_LIFETIME_MS = 3500;
const MAX_CIGS_ON_SCREEN = 40;
const MAX_SPLASHES_ON_SCREEN = 8;
const SPLASH_DURATION_MS = 520;
const SPECIAL_TARGET_POINTS = 100;
const SPECIAL_TARGET_COLLISION_RADIUS = 12;
const SPECIAL_TARGET_SPEED = 0.065;
const SPECIAL_TARGET_SPAWN_MIN_MS = 1000;
const SPECIAL_TARGET_SPAWN_MAX_MS = 2800;
const BAZOOKA_TARGET_COLLISION_RADIUS = 12;
const BAZOOKA_TARGET_SPEED = 0.06;
const BAZOOKA_TARGET_INITIAL_DELAY_MS = 30000;
const BAZOOKA_TARGET_SPAWN_MIN_MS = 30000;
const BAZOOKA_TARGET_SPAWN_MAX_MS = 60000;
const JOJO_TARGET_COLLISION_RADIUS = 12;
const JOJO_TARGET_SPEED = 0.07;
const JOJO_TARGET_INITIAL_DELAY_MS = 8000;
const JOJO_TARGET_SPAWN_MIN_MS = 18000;
const JOJO_TARGET_SPAWN_MAX_MS = 35000;
const JOJO_SNAKEY_DURATION_MS = 3000;
const BAZOOKA_DURATION_MS = 20000;
const WHITE_DROPLET_SPAWN_INTERVAL_MS = 600;

// Tendril configs: angle (deg), length (viewBox units), stroke width. 12 tendrils for perf.
const SPLASH_TENDRILS: Array<[number, number, number]> = [
  [0, 36, 4], [30, 30, 3], [60, 38, 5], [90, 28, 3],
  [120, 35, 4], [150, 32, 5], [180, 38, 4], [210, 30, 3],
  [240, 34, 5], [270, 32, 3], [300, 36, 4], [330, 30, 3],
];

export default function SmokePage({ onBack }: { onBack: () => void }) {
  const [cigs, setCigs] = useState<CigShot[]>([]);
  const [droplets, setDroplets] = useState<Droplet[]>([]);
  const [specialTargets, setSpecialTargets] = useState<SpecialTarget[]>([]);
  const [splashes, setSplashes] = useState<Splash[]>([]);
  const [lives, setLives] = useState(LIVES_INITIAL);
  const [points, setPoints] = useState(0);
  const [dropletPoints, setDropletPoints] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('shoot-high-score')) || 0;
    } catch {
      return 0;
    }
  });
  const [gameOver, setGameOver] = useState(false);
  const [superCigActive, setSuperCigActive] = useState(false);
  const [showSuperCigMessage, setShowSuperCigMessage] = useState(false);
  const [bazookaJoeActive, setBazookaJoeActive] = useState(false);
  const [showBazookaMessage, setShowBazookaMessage] = useState(false);
  const [showJojoMessage, setShowJojoMessage] = useState(false);
  const [bazookaTargets, setBazookaTargets] = useState<BazookaTarget[]>([]);
  const [jojoTargets, setJojoTargets] = useState<JoJoTarget[]>([]);
  const [snakeyModeActive, setSnakeyModeActive] = useState(false);

  const nextCigId = useRef(0);
  const nextDropletId = useRef(0);
  const nextSpecialTargetId = useRef(0);
  const nextBazookaTargetId = useRef(0);
  const nextJojoTargetId = useRef(0);
  const nextSplashId = useRef(0);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPosRef = useRef({ clientX: 0, clientY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const cigsRef = useRef<CigShot[]>([]);
  const dropletsRef = useRef<Droplet[]>([]);
  const specialTargetsRef = useRef<SpecialTarget[]>([]);
  const bazookaTargetsRef = useRef<BazookaTarget[]>([]);
  const jojoTargetsRef = useRef<JoJoTarget[]>([]);
  const snakeyModeActiveRef = useRef(false);
  const snakeyEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jojoTargetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const splashesRef = useRef<Splash[]>([]);
  const gameStartTimeRef = useRef(performance.now());
  const gameOverRef = useRef(false);
  const pointsRef = useRef(0);
  const dropletPointsRef = useRef(0);
  const spawnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const specialTargetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bazookaTargetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bazookaJoeActiveRef = useRef(false);
  const bazookaEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whiteDropletIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const superCigActiveRef = useRef(false);
  const superCigEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFireTimeRef = useRef(0);

  // Persist high score to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shoot-high-score', String(highScore));
    } catch { /* storage unavailable */ }
  }, [highScore]);

  // White safe area during active play only; light purple on game over and when leaving (Safari theme-color)
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const restore = '#BEBDDF';
    const update = (color: string) => {
      meta?.setAttribute('content', color);
    };
    update(gameOver ? restore : '#ffffff');
    return () => {
      const m = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (m) m.setAttribute('content', restore);
    };
  }, [gameOver]);

  cigsRef.current = cigs;
  dropletsRef.current = droplets;
  specialTargetsRef.current = specialTargets;
  bazookaTargetsRef.current = bazookaTargets;
  jojoTargetsRef.current = jojoTargets;
  snakeyModeActiveRef.current = snakeyModeActive;
  splashesRef.current = splashes;
  bazookaJoeActiveRef.current = bazookaJoeActive;
  gameOverRef.current = gameOver;
  pointsRef.current = points;
  dropletPointsRef.current = dropletPoints;
  superCigActiveRef.current = superCigActive;

  const spawnCig = useCallback(
    (clientX: number, _clientY: number, lockedToBottom = false) => {
      if (gameOverRef.current) return;
      if (cigsRef.current.length >= MAX_CIGS_ON_SCREEN) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = lockedToBottom ? 95 : ((_clientY - rect.top) / rect.height) * 100;
      const id = nextCigId.current++;
      lastFireTimeRef.current = performance.now();
      const spawnTime = performance.now();
      const base = { id, x, y, spawnTime };
      if (snakeyModeActiveRef.current) {
        setCigs((prev) => [...prev, {
          ...base,
          vx: (Math.random() - 0.5) * 3,
          curvePhase: Math.random() * Math.PI * 2,
        }]);
      } else {
        setCigs((prev) => [...prev, base]);
      }
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
    const dpts = dropletPointsRef.current;
    const intervalMax = Math.max(
      DROPLET_SPAWN_INTERVAL_MIN_MS,
      DROPLET_SPAWN_INTERVAL_BASE_MS - dpts * 12 - elapsedSec * 8
    );
    const delay = intervalMax + Math.random() * DROPLET_SPAWN_JITTER_MS;
    spawnTimeoutRef.current = setTimeout(() => {
      spawnDroplet();
      scheduleNextDroplet();
    }, delay);
  }, [spawnDroplet]);

  const spawnSpecialTarget = useCallback(() => {
    if (gameOverRef.current) return;
    const x = 15 + Math.random() * 70;
    const id = nextSpecialTargetId.current++;
    const src = SPECIAL_TARGET_IMAGES[Math.floor(Math.random() * SPECIAL_TARGET_IMAGES.length)]!;
    setSpecialTargets((prev) => [...prev, { id, x, y: -8, spawnTime: performance.now(), src }]);
  }, []);

  const scheduleNextSpecialTarget = useCallback((): ReturnType<typeof setTimeout> | null => {
    if (gameOverRef.current) return null;
    const delay =
      SPECIAL_TARGET_SPAWN_MIN_MS +
      Math.random() * (SPECIAL_TARGET_SPAWN_MAX_MS - SPECIAL_TARGET_SPAWN_MIN_MS);
    const t = setTimeout(() => {
      spawnSpecialTarget();
      scheduleNextSpecialTarget();
    }, delay);
    return t;
  }, [spawnSpecialTarget]);

  const spawnBazookaTarget = useCallback(() => {
    if (gameOverRef.current || bazookaJoeActiveRef.current) return;
    const x = 15 + Math.random() * 70;
    const id = nextBazookaTargetId.current++;
    setBazookaTargets((prev) => [...prev, { id, x, y: -10, spawnTime: performance.now() }]);
  }, []);

  const scheduleNextBazookaTarget = useCallback((): ReturnType<typeof setTimeout> | null => {
    if (gameOverRef.current) return null;
    const delay =
      BAZOOKA_TARGET_SPAWN_MIN_MS +
      Math.random() * (BAZOOKA_TARGET_SPAWN_MAX_MS - BAZOOKA_TARGET_SPAWN_MIN_MS);
    const t = setTimeout(() => {
      if (!bazookaJoeActiveRef.current) {
        spawnBazookaTarget();
      }
      scheduleNextBazookaTarget();
    }, delay);
    return t;
  }, [spawnBazookaTarget]);

  const spawnJojoTarget = useCallback(() => {
    if (gameOverRef.current || bazookaJoeActiveRef.current) return;
    const x = 15 + Math.random() * 70;
    const id = nextJojoTargetId.current++;
    setJojoTargets((prev) => [...prev, { id, x, y: -8, spawnTime: performance.now() }]);
  }, []);

  const scheduleNextJojoTarget = useCallback((): ReturnType<typeof setTimeout> | null => {
    if (gameOverRef.current) return null;
    const delay =
      JOJO_TARGET_SPAWN_MIN_MS +
      Math.random() * (JOJO_TARGET_SPAWN_MAX_MS - JOJO_TARGET_SPAWN_MIN_MS);
    const t = setTimeout(() => {
      if (!bazookaJoeActiveRef.current) {
        spawnJojoTarget();
      }
      scheduleNextJojoTarget();
    }, delay);
    return t;
  }, [spawnJojoTarget]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    lastPosRef.current = { clientX: e.clientX, clientY: e.clientY };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (gameOver) return;
      e.preventDefault();
      const { clientX, clientY } = e;
      lastPosRef.current = { clientX, clientY };

      const fireInterval = bazookaJoeActiveRef.current
        ? HOLD_INTERVAL_BAZOOKA_MS
        : superCigActiveRef.current
          ? HOLD_INTERVAL_SUPER_MS
          : HOLD_INTERVAL_MS;
      const now = performance.now();
      if (now - lastFireTimeRef.current < fireInterval) return; /* rate limit */

      spawnCig(clientX, clientY, true); /* always from bottom */

      holdTimeoutRef.current = setTimeout(() => {
        holdTimeoutRef.current = null;
        const fireNext = () => {
          const interval = bazookaJoeActiveRef.current
            ? HOLD_INTERVAL_BAZOOKA_MS
            : superCigActiveRef.current
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
    lastFireTimeRef.current = 0;
    pointsRef.current = 0;
    dropletPointsRef.current = 0;
    setGameOver(false);
    setLives(LIVES_INITIAL);
    setPoints(0);
    setDropletPoints(0);
    setCigs([]);
    setDroplets([]);
    setSpecialTargets([]);
    specialTargetsRef.current = [];
    setSplashes([]);
    splashesRef.current = [];
    setSuperCigActive(false);
    setShowSuperCigMessage(false);
    superCigActiveRef.current = false;
    setBazookaJoeActive(false);
    setShowBazookaMessage(false);
    setShowJojoMessage(false);
    bazookaJoeActiveRef.current = false;
    setBazookaTargets([]);
    setJojoTargets([]);
    setSnakeyModeActive(false);
    bazookaTargetsRef.current = [];
    jojoTargetsRef.current = [];
    snakeyModeActiveRef.current = false;
    cigsRef.current = [];
    dropletsRef.current = [];
    if (superCigEndTimeoutRef.current) {
      clearTimeout(superCigEndTimeoutRef.current);
      superCigEndTimeoutRef.current = null;
    }
    if (bazookaEndTimeoutRef.current) {
      clearTimeout(bazookaEndTimeoutRef.current);
      bazookaEndTimeoutRef.current = null;
    }
    if (whiteDropletIntervalRef.current) {
      clearInterval(whiteDropletIntervalRef.current);
      whiteDropletIntervalRef.current = null;
    }
    if (specialTargetTimeoutRef.current) {
      clearTimeout(specialTargetTimeoutRef.current);
      specialTargetTimeoutRef.current = null;
    }
    if (bazookaTargetTimeoutRef.current) {
      clearTimeout(bazookaTargetTimeoutRef.current);
      bazookaTargetTimeoutRef.current = null;
    }
    if (jojoTargetTimeoutRef.current) {
      clearTimeout(jojoTargetTimeoutRef.current);
      jojoTargetTimeoutRef.current = null;
    }
    if (snakeyEndTimeoutRef.current) {
      clearTimeout(snakeyEndTimeoutRef.current);
      snakeyEndTimeoutRef.current = null;
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

  // Special target spawning - random intervals
  useEffect(() => {
    if (gameOver) return;
    specialTargetTimeoutRef.current = scheduleNextSpecialTarget();
    return () => {
      if (specialTargetTimeoutRef.current) {
        clearTimeout(specialTargetTimeoutRef.current);
        specialTargetTimeoutRef.current = null;
      }
    };
  }, [gameOver, scheduleNextSpecialTarget]);

  // Bazooka target spawning - only after 2 minutes of play, then rare intervals
  useEffect(() => {
    if (gameOver) return;
    const initialDelay = setTimeout(() => {
      bazookaTargetTimeoutRef.current = scheduleNextBazookaTarget();
    }, BAZOOKA_TARGET_INITIAL_DELAY_MS);
    return () => {
      clearTimeout(initialDelay);
      if (bazookaTargetTimeoutRef.current) {
        clearTimeout(bazookaTargetTimeoutRef.current);
        bazookaTargetTimeoutRef.current = null;
      }
    };
  }, [gameOver, scheduleNextBazookaTarget]);

  // JoJo target spawning - after 8s, freq between special and bazooka
  useEffect(() => {
    if (gameOver) return;
    const initialDelay = setTimeout(() => {
      jojoTargetTimeoutRef.current = scheduleNextJojoTarget();
    }, JOJO_TARGET_INITIAL_DELAY_MS);
    return () => {
      clearTimeout(initialDelay);
      if (jojoTargetTimeoutRef.current) {
        clearTimeout(jojoTargetTimeoutRef.current);
        jojoTargetTimeoutRef.current = null;
      }
    };
  }, [gameOver, scheduleNextJojoTarget]);

  // Game loop
  useEffect(() => {
    const loop = () => {
      if (gameOverRef.current) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();
      const elapsedSec = (now - gameStartTimeRef.current) / 1000;
      const dpts = dropletPointsRef.current;
      const isBazooka = bazookaJoeActiveRef.current;
      const dropletSpeed = Math.min(
        DROPLET_SPEED_MAX,
        DROPLET_SPEED_BASE + dpts * 0.0015 + elapsedSec * 0.0012 +
        (isBazooka ? DROPLET_SPEED_BAZOOKA_BOOST : 0)
      );
      const cigSpeed = isBazooka ? CIG_SPEED_BAZOOKA : CIG_SPEED;

      const currentCigs = cigsRef.current;
      const currentDroplets = dropletsRef.current;
      const currentSpecialTargets = specialTargetsRef.current;
      const currentBazookaTargets = bazookaTargetsRef.current;
      const currentJojoTargets = jojoTargetsRef.current;

      const updatedCigs = currentCigs.map((c) => {
        if (c.vx != null && c.curvePhase != null) {
          const t = (now - c.spawnTime) / 1000;
          const curveX = Math.sin(t * 4 + c.curvePhase) * 2.5;
          return { ...c, x: c.x + (c.vx ?? 0) * 0.15 + curveX, y: c.y - cigSpeed };
        }
        return { ...c, y: c.y - cigSpeed };
      }).filter((c) => c.y > -20 && now - c.spawnTime < CIG_LIFETIME_MS);

      const updatedDroplets = currentDroplets.map((d) => ({
        ...d,
        y: d.y + dropletSpeed,
      }));

      const updatedSpecialTargets = currentSpecialTargets.map((t) => ({
        ...t,
        y: t.y + SPECIAL_TARGET_SPEED,
      }));

      const updatedBazookaTargets = currentBazookaTargets.map((t) => ({
        ...t,
        y: t.y + BAZOOKA_TARGET_SPEED,
      }));

      const updatedJojoTargets = currentJojoTargets.map((t) => ({
        ...t,
        y: t.y + JOJO_TARGET_SPEED,
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
            if (specialTargetTimeoutRef.current) {
              clearTimeout(specialTargetTimeoutRef.current);
              specialTargetTimeoutRef.current = null;
            }
            if (bazookaTargetTimeoutRef.current) {
              clearTimeout(bazookaTargetTimeoutRef.current);
              bazookaTargetTimeoutRef.current = null;
            }
            if (jojoTargetTimeoutRef.current) {
              clearTimeout(jojoTargetTimeoutRef.current);
              jojoTargetTimeoutRef.current = null;
            }
            if (snakeyEndTimeoutRef.current) {
              clearTimeout(snakeyEndTimeoutRef.current);
              snakeyEndTimeoutRef.current = null;
            }
            if (bazookaEndTimeoutRef.current) {
              clearTimeout(bazookaEndTimeoutRef.current);
              bazookaEndTimeoutRef.current = null;
            }
            if (whiteDropletIntervalRef.current) {
              clearInterval(whiteDropletIntervalRef.current);
              whiteDropletIntervalRef.current = null;
            }
          }
          return newLives;
        });
      }

      const hitCigIds = new Set<number>();
      const hitDropletIds = new Set<number>();
      const hitSpecialTargetIds = new Set<number>();
      const hitSpecialTargetPositions: Array<{ x: number; y: number }> = [];
      const hitBazookaTargetIds = new Set<number>();
      const hitJojoTargetIds = new Set<number>();

      for (const cig of updatedCigs) {
        const cigTipY = cig.y + CIG_TIP_OFFSET_Y;
        for (const drop of stillOnScreen) {
          const dx = cig.x - drop.x;
          const dy = cigTipY - drop.y;
          if (dx * dx + dy * dy < COLLISION_RADIUS * COLLISION_RADIUS) {
            hitCigIds.add(cig.id);
            hitDropletIds.add(drop.id);
          }
        }
        for (const target of updatedSpecialTargets) {
          if (target.y < 0 || target.y > 100) continue;
          const dx = cig.x - target.x;
          const dy = cigTipY - target.y;
          if (dx * dx + dy * dy < SPECIAL_TARGET_COLLISION_RADIUS * SPECIAL_TARGET_COLLISION_RADIUS) {
            hitCigIds.add(cig.id);
            hitSpecialTargetIds.add(target.id);
            hitSpecialTargetPositions.push({ x: target.x, y: target.y });
          }
        }
        for (const bt of updatedBazookaTargets) {
          if (bt.y < 0 || bt.y > 100) continue;
          const dx = cig.x - bt.x;
          const dy = cigTipY - bt.y;
          if (dx * dx + dy * dy < BAZOOKA_TARGET_COLLISION_RADIUS * BAZOOKA_TARGET_COLLISION_RADIUS) {
            hitCigIds.add(cig.id);
            hitBazookaTargetIds.add(bt.id);
          }
        }
        for (const jt of updatedJojoTargets) {
          if (jt.y < 0 || jt.y > 100) continue;
          const dx = cig.x - jt.x;
          const dy = cigTipY - jt.y;
          if (dx * dx + dy * dy < JOJO_TARGET_COLLISION_RADIUS * JOJO_TARGET_COLLISION_RADIUS) {
            hitCigIds.add(cig.id);
            hitJojoTargetIds.add(jt.id);
          }
        }
      }

      if (hitDropletIds.size > 0) {
        const newDropletPoints = dpts + hitDropletIds.size;
        const newTotalPoints = pointsRef.current + hitDropletIds.size;
        setHighScore((h) => Math.max(h, newTotalPoints));
        const prevLevel = Math.floor(dpts / SUPER_CIG_TRIGGER_EVERY);
        const newLevel = Math.floor(newDropletPoints / SUPER_CIG_TRIGGER_EVERY);
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
        setDropletPoints((p) => p + hitDropletIds.size);
        setPoints((p) => p + hitDropletIds.size);
        // Spawn splashes at hit droplet positions (capped for performance)
        const newSplashes: Splash[] = stillOnScreen
          .filter((d) => hitDropletIds.has(d.id))
          .map((d) => ({
            id: nextSplashId.current++,
            x: d.x,
            y: d.y,
            spawnTime: now,
          }));
        const combined = [...splashesRef.current, ...newSplashes];
        splashesRef.current = combined.length > MAX_SPLASHES_ON_SCREEN
          ? combined.slice(-MAX_SPLASHES_ON_SCREEN)
          : combined;
        setSplashes(splashesRef.current);
      }

      if (hitSpecialTargetIds.size > 0) {
        setPoints((p) => p + SPECIAL_TARGET_POINTS * hitSpecialTargetIds.size);
        setHighScore((h) => Math.max(h, pointsRef.current + SPECIAL_TARGET_POINTS * hitSpecialTargetIds.size));
        const redSplashes: Splash[] = hitSpecialTargetPositions.map((pos) => ({
          id: nextSplashId.current++,
          x: pos.x,
          y: pos.y,
          spawnTime: now,
          variant: 'red' as const,
        }));
        splashesRef.current = [...splashesRef.current, ...redSplashes];
        setSplashes(splashesRef.current);
      }

      // JoJo target hit - activate SNAKEY MODE (cigs curve randomly for 3s)
      if (hitJojoTargetIds.size > 0) {
        snakeyModeActiveRef.current = true;
        setSnakeyModeActive(true);
        setShowJojoMessage(true);
        setTimeout(() => setShowJojoMessage(false), 3000);
        if (snakeyEndTimeoutRef.current) clearTimeout(snakeyEndTimeoutRef.current);
        snakeyEndTimeoutRef.current = setTimeout(() => {
          snakeyModeActiveRef.current = false;
          setSnakeyModeActive(false);
          snakeyEndTimeoutRef.current = null;
        }, JOJO_SNAKEY_DURATION_MS);
      }

      // Bazooka target hit - activate BAZOOKA JOE MODE
      if (hitBazookaTargetIds.size > 0 && !bazookaJoeActiveRef.current) {
        bazookaJoeActiveRef.current = true;
        setBazookaJoeActive(true);
        setShowBazookaMessage(true);
        setTimeout(() => setShowBazookaMessage(false), 2500);
        // White droplet spawning during bazooka mode
        whiteDropletIntervalRef.current = setInterval(() => {
          if (gameOverRef.current) return;
          const wx = 10 + Math.random() * 80;
          const wid = nextDropletId.current++;
          setDroplets((prev) => [...prev, { id: wid, x: wx, y: 0 }]);
        }, WHITE_DROPLET_SPAWN_INTERVAL_MS);
        if (bazookaEndTimeoutRef.current) clearTimeout(bazookaEndTimeoutRef.current);
        bazookaEndTimeoutRef.current = setTimeout(() => {
          bazookaJoeActiveRef.current = false;
          setBazookaJoeActive(false);
          bazookaEndTimeoutRef.current = null;
          if (whiteDropletIntervalRef.current) {
            clearInterval(whiteDropletIntervalRef.current);
            whiteDropletIntervalRef.current = null;
          }
        }, BAZOOKA_DURATION_MS);
      }

      const finalCigs = updatedCigs.filter((c) => !hitCigIds.has(c.id));
      const finalDroplets = stillOnScreen.filter(
        (d) => !hitDropletIds.has(d.id)
      );
      const finalSpecialTargets = updatedSpecialTargets.filter(
        (t) => !hitSpecialTargetIds.has(t.id) && t.y <= 100
      );
      const finalBazookaTargets = updatedBazookaTargets.filter(
        (t) => !hitBazookaTargetIds.has(t.id) && t.y <= 100
      );
      const finalJojoTargets = updatedJojoTargets.filter(
        (t) => !hitJojoTargetIds.has(t.id) && t.y <= 100
      );

      // Remove expired splashes
      const currentSplashes = splashesRef.current;
      const aliveSplashes = currentSplashes.filter(
        (s) => now - s.spawnTime < SPLASH_DURATION_MS
      );
      if (aliveSplashes.length !== currentSplashes.length) {
        splashesRef.current = aliveSplashes;
        setSplashes(aliveSplashes);
      }

      cigsRef.current = finalCigs;
      dropletsRef.current = finalDroplets;
      specialTargetsRef.current = finalSpecialTargets;
      bazookaTargetsRef.current = finalBazookaTargets;
      jojoTargetsRef.current = finalJojoTargets;

      setCigs(finalCigs);
      setDroplets(finalDroplets);
      setSpecialTargets(finalSpecialTargets);
      setBazookaTargets(finalBazookaTargets);
      setJojoTargets(finalJojoTargets);

      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 touch-manipulation select-none overflow-hidden transition-colors duration-500 ${bazookaJoeActive ? 'bazooka-bg bazooka-shake' : 'game-bg-tropical'}`}
      style={{ touchAction: 'manipulation' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      {/* Top edge gradient - fades to white (hidden during Bazooka Joe) */}
      {!bazookaJoeActive && (
        <div
          className="fixed top-0 left-0 right-0 h-32 z-[2] pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, white 0%, transparent 100%)' }}
        />
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        className={`fixed top-0 left-0 z-[60] p-4 flex items-center gap-2 hover:opacity-80 active:opacity-70 transition-opacity touch-manipulation ${bazookaJoeActive ? 'text-white' : 'text-[#1B1B1B]'}`}
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        aria-label="Back to home"
      >
        <ArrowLeft size={24} weight="regular" />
        <span className="type-btn type-btn--sm">Big back</span>
      </button>

      {/* SUPER CIG message */}
      {showSuperCigMessage && !bazookaJoeActive && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center pointer-events-none">
          <p className="super-cig-text text-4xl md:text-6xl font-black text-[#1B1B1B] uppercase tracking-tighter">
            SUPER CIG
          </p>
        </div>
      )}

      {/* JoJo hit message */}
      {showJojoMessage && !bazookaJoeActive && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center pointer-events-none">
          <p className="jojo-message-text text-3xl md:text-5xl font-black text-red-500 uppercase tracking-tighter text-center px-4">
            OOPS JOJO FUCKED UP UR CIGS
          </p>
        </div>
      )}

      {/* Bazooka face - slowly fades in over 20s */}
      {bazookaJoeActive && (
        <div className="bazooka-face-container fixed inset-0 z-[1] pointer-events-none overflow-hidden">
          <img
            src="/bazooka-face.png"
            alt=""
            className="bazooka-face-img"
          />
          <div className="bazooka-face-overlay" />
        </div>
      )}

      {/* BAZOOKA JOE MODE message */}
      {showBazookaMessage && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center pointer-events-none">
          <p className="bazooka-text text-3xl md:text-5xl font-black text-orange-500 uppercase tracking-tighter">
            BAZOOKA JOE MODE
          </p>
        </div>
      )}

      {/* Lives, score, high score - top right */}
      <div
        className={`fixed top-0 right-0 z-[60] flex items-center gap-6 p-4 font-semibold ${bazookaJoeActive ? 'text-white' : 'text-[#1B1B1B]'}`}
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-1.5">
          <Heart size={22} weight="fill" className="text-red-500" />
          <span className="type-subtitle">{lives}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Target size={22} weight="fill" className={bazookaJoeActive ? 'text-white' : 'text-[#1B1B1B]'} />
          <span className="type-subtitle">{points}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy size={22} weight="fill" className="text-amber-500" />
          <span className="type-subtitle">{highScore}</span>
        </div>
      </div>

      {/* Game over overlay */}
      {gameOver && (
        <div className="fixed inset-0 z-[70] flex flex-col" style={{ backgroundColor: '#BEBDDF' }}>
          {/* Halftone overlay — background only, not on page content */}
          <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.35] halftone-overlay" />
          {/* Subject 9 background - large, slides up from bottom */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <img
              src="/Subject%209.png"
              alt=""
              className="w-[min(120vw,80rem)] h-auto object-contain opacity-[1] subject6-slide-up--game-over"
            />
          </div>
          {/* Gradient overlay - transparent top, light purple bottom */}
          <div
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{ background: 'linear-gradient(to bottom, transparent 0%, transparent 50%, #BEBDDF 100%)' }}
          />
          <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 mb-36">
            <div
              className="title-responsive"
              style={{ textAlign: 'center', lineHeight: '.7', fontSize: 'min(10rem, 28vw)' }}
            >
              <div className="title-calvo mb-6">GAME OVER</div>
            </div>
            <p className="type-subtitle text-xl text-[#1B1B1B]">
              Final score: {points} points
            </p>
          </div>
          <div
            className="flex flex-col gap-3 px-4 pb-4 relative z-10 w-full max-w-md mx-auto"
            style={{
              paddingLeft: 'var(--view-padding-x)',
              paddingRight: 'var(--view-padding-x)',
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              paddingTop: '1rem',
            }}
          >
            <button
              type="button"
              onClick={handleRestart}
              className="type-btn dare-btn-card w-full flex items-center justify-center py-4 text-[#1B1B1B] active:opacity-80 hover:bg-gray-50 transition-all touch-manipulation"
            >
              RESTART
            </button>
            <button
              type="button"
              onClick={onBack}
              className="type-btn dare-btn-card w-full flex items-center justify-center py-4 text-[#1B1B1B] active:opacity-80 hover:bg-gray-50 transition-all touch-manipulation"
            >
              HOME
            </button>
          </div>
        </div>
      )}

      {/* Splash explosions - SVG tendrils radiate outward with smooth water-like motion */}
      {splashes.map(({ id, x, y, variant = 'yellow' }) => (
        <div
          key={id}
          className={`droplet-splash droplet-splash--${variant} absolute pointer-events-none`}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          aria-hidden
        >
          <svg className="droplet-splash-svg" viewBox="-50 -50 100 100">
            <defs>
              <radialGradient id={`splash-core-${id}`} cx="30%" cy="30%">
                <stop offset="0%" stopColor={variant === 'red' ? 'rgba(255,200,200,0.95)' : 'rgba(255,255,220,0.95)'} />
                <stop offset="50%" stopColor={variant === 'red' ? 'rgba(255,100,80,0.9)' : 'rgba(255,230,120,0.9)'} />
                <stop offset="100%" stopColor={variant === 'red' ? 'rgba(220,50,50,0.6)' : 'rgba(255,200,50,0.6)'} />
              </radialGradient>
            </defs>
            <circle className="droplet-splash-core" r="10" fill={`url(#splash-core-${id})`} />
            {SPLASH_TENDRILS.map(([angle, length, width], i) => {
              const rad = (angle * Math.PI) / 180;
              const x2 = Math.sin(rad) * length;
              const y2 = -Math.cos(rad) * length;
              return (
                <g key={i} style={{ '--tendril-length': length, '--tendril-delay': `${i * 12}ms` } as React.CSSProperties}>
                  <line
                    className="droplet-splash-tendril"
                    x1="0"
                    y1="0"
                    x2={x2}
                    y2={y2}
                    strokeWidth={width}
                    strokeLinecap="round"
                    stroke={variant === 'red' ? 'rgba(255,80,80,0.9)' : 'rgba(255,210,70,0.9)'}
                    strokeDasharray={length}
                  />
                  <circle
                    className="droplet-splash-drop"
                    cx={x2}
                    cy={y2}
                    r="4"
                    fill={variant === 'red' ? 'rgba(255,80,80,0.85)' : 'rgba(255,200,50,0.85)'}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      ))}

      {/* Bazooka targets - rare, sparkly glow */}
      {bazookaTargets.map(({ id, x, y }) => (
        <div
          key={id}
          className="bazooka-target absolute pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <img
            src="/cig-subject.png"
            alt=""
            className="bazooka-target-img"
          />
        </div>
      ))}

      {/* JoJo Siwa targets - red radioactive glow, triggers snakey cig mode */}
      {jojoTargets.map(({ id, x, y }) => (
        <div
          key={id}
          className="jojo-target absolute pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <img
            src="/jojo-siwa.png"
            alt=""
            className="jojo-target-img"
          />
        </div>
      ))}

      {/* Special falling targets - 100 pts, red splash when hit */}
      {specialTargets.map(({ id, x, y, src }) => (
        <img
          key={id}
          src={src}
          alt=""
          className="special-target-img absolute pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}

      {/* Droplets */}
      {droplets.map(({ id, x, y }) => (
        <img
          key={id}
          src="/piss.png"
          alt=""
          className={`droplet-img absolute pointer-events-none ${bazookaJoeActive ? 'droplet-img--white' : ''}`}
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}

      {/* Projectiles - Subject 3 rockets in bazooka mode, cigs otherwise */}
      {cigs.map(({ id, x, y }) => (
        <div
          key={id}
          className={`absolute pointer-events-none ${bazookaJoeActive ? 'bazooka-rocket' : 'cig-shot-js'}`}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {bazookaJoeActive ? (
            <div className="rocket-wrapper">
              <img
                src="/Subject%203.png"
                alt=""
                className="rocket-img"
              />
              <div className="rocket-trail" />
            </div>
          ) : (
            <img src="/Cigarette_Bullet.png" alt="" className="cig-bullet-img" />
          )}
        </div>
      ))}
    </div>
  );
}
