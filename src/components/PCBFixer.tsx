import { useState, useEffect, useCallback, useRef } from "react";

type CellType = "empty" | "trace" | "blocked" | "padA" | "padB" | "locked";

const GRID_COLS = 10;
const GRID_ROWS = 8;

interface LevelConfig {
  level: number;
  time: number;
  blockedRatio: number;
  lockedCells: number;
  label: string;
  pathRandomness: number;
  minPathLength: number;
}

const LEVELS: LevelConfig[] = [
  {
    level: 1,
    time: 25,
    blockedRatio: 0.1,
    lockedCells: 0,
    label: "NOVICE",
    pathRandomness: 0.05,
    minPathLength: 8,
  },
  {
    level: 2,
    time: 22,
    blockedRatio: 0.15,
    lockedCells: 0,
    label: "APPRENTICE",
    pathRandomness: 0.15,
    minPathLength: 10,
  },
  {
    level: 3,
    time: 20,
    blockedRatio: 0.2,
    lockedCells: 1,
    label: "TECHNICIAN",
    pathRandomness: 0.25,
    minPathLength: 12,
  },
  {
    level: 4,
    time: 18,
    blockedRatio: 0.25,
    lockedCells: 1,
    label: "ENGINEER",
    pathRandomness: 0.35,
    minPathLength: 14,
  },
  {
    level: 5,
    time: 16,
    blockedRatio: 0.3,
    lockedCells: 2,
    label: "SPECIALIST",
    pathRandomness: 0.45,
    minPathLength: 16,
  },
  {
    level: 6,
    time: 14,
    blockedRatio: 0.35,
    lockedCells: 2,
    label: "EXPERT",
    pathRandomness: 0.55,
    minPathLength: 20,
  },
  {
    level: 7,
    time: 12,
    blockedRatio: 0.4,
    lockedCells: 3,
    label: "MASTER",
    pathRandomness: 0.65,
    minPathLength: 24,
  },
  {
    level: 8,
    time: 10,
    blockedRatio: 0.45,
    lockedCells: 3,
    label: "GURU",
    pathRandomness: 0.75,
    minPathLength: 28,
  },
  {
    level: 9,
    time: 9,
    blockedRatio: 0.5,
    lockedCells: 4,
    label: "LEGEND",
    pathRandomness: 0.85,
    minPathLength: 32,
  },
  {
    level: 10,
    time: 8,
    blockedRatio: 0.55,
    lockedCells: 4,
    label: "NIGHTMARE",
    pathRandomness: 0.9,
    minPathLength: 36,
  },
  {
    level: 11,
    time: 7,
    blockedRatio: 0.6,
    lockedCells: 5,
    label: "HELL",
    pathRandomness: 0.95,
    minPathLength: 40,
  },
  {
    level: 12,
    time: 6,
    blockedRatio: 0.65,
    lockedCells: 5,
    label: "IMPOSSIBLE",
    pathRandomness: 1.0,
    minPathLength: 44,
  },
];

function getLevelConfig(level: number): LevelConfig {
  if (level <= LEVELS.length) return LEVELS[level - 1];
  const extra = level - 12;
  return {
    level,
    time: Math.max(4, 6 - extra),
    blockedRatio: Math.min(0.75, 0.65 + extra * 0.03),
    lockedCells: Math.min(8, 5 + extra),
    label: `LEVEL ${level}`,
    pathRandomness: 1.0,
    minPathLength: 44 + extra * 4,
  };
}

function generateSolvablePuzzle(config: LevelConfig): {
  grid: CellType[][];
  padA: [number, number];
  padB: [number, number];
  solutionPath: [number, number][];
} {
  const grid: CellType[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => "empty"),
  );

  const padA: [number, number] = [
    Math.floor(Math.random() * 3),
    Math.floor(Math.random() * 2),
  ];
  const padB: [number, number] = [
    GRID_COLS - 1 - Math.floor(Math.random() * 3),
    GRID_ROWS - 1 - Math.floor(Math.random() * 2),
  ];

  grid[padA[1]][padA[0]] = "padA";
  grid[padB[1]][padB[0]] = "padB";

  const solutionPath = generateWindingPath(padA, padB, config);

  const protectedCells = new Set<string>();
  solutionPath.forEach(([x, y]) => protectedCells.add(`${x},${y}`));
  protectedCells.add(`${padA[0]},${padA[1]}`);
  protectedCells.add(`${padB[0]},${padB[1]}`);

  const totalCells = GRID_COLS * GRID_ROWS;
  const blockedCount = Math.floor(totalCells * config.blockedRatio);
  let placed = 0;
  let attempts = 0;

  while (placed < blockedCount && attempts < 1000) {
    const x = Math.floor(Math.random() * GRID_COLS);
    const y = Math.floor(Math.random() * GRID_ROWS);
    const key = `${x},${y}`;
    if (!protectedCells.has(key) && grid[y][x] === "empty") {
      grid[y][x] = "blocked";
      placed++;
    }
    attempts++;
  }

  if (config.lockedCells > 0) {
    let lockedPlaced = 0;
    let lockedAttempts = 0;
    while (lockedPlaced < config.lockedCells && lockedAttempts < 500) {
      const x = Math.floor(Math.random() * GRID_COLS);
      const y = Math.floor(Math.random() * GRID_ROWS);
      const key = `${x},${y}`;
      if (!protectedCells.has(key) && grid[y][x] === "empty") {
        grid[y][x] = "locked";
        lockedPlaced++;
      }
      lockedAttempts++;
    }
  }

  return { grid, padA, padB, solutionPath };
}

function generateWindingPath(
  start: [number, number],
  end: [number, number],
  config: LevelConfig,
): [number, number][] {
  const path: [number, number][] = [start];
  const visited = new Set<string>([`${start[0]},${start[1]}`]);
  let current = start;

  while (current[0] !== end[0] || current[1] !== end[1]) {
    const neighbors = getNeighbors(current, visited);
    if (neighbors.length === 0) {
      if (path.length > 2) {
        path.pop();
        current = path[path.length - 1];
        continue;
      }
      break;
    }

    const scored = neighbors.map(([nx, ny]) => {
      const distToGoal = Math.abs(nx - end[0]) + Math.abs(ny - end[1]);
      const randomFactor = Math.random() * config.pathRandomness * 20;
      return {
        pos: [nx, ny] as [number, number],
        score: distToGoal + randomFactor,
      };
    });

    scored.sort((a, b) => a.score - b.score);
    const pickIndex = Math.floor(
      Math.random() *
        Math.min(scored.length, 1 + Math.floor(config.pathRandomness * 3)),
    );
    const next = scored[Math.min(pickIndex, scored.length - 1)].pos;

    path.push(next);
    visited.add(`${next[0]},${next[1]}`);
    current = next;

    if (path.length > GRID_COLS * GRID_ROWS) break;
  }

  return path;
}

function getNeighbors(
  pos: [number, number],
  visited: Set<string>,
): [number, number][] {
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  const result: [number, number][] = [];
  for (const [dx, dy] of directions) {
    const nx = pos[0] + dx;
    const ny = pos[1] + dy;
    if (
      nx >= 0 &&
      nx < GRID_COLS &&
      ny >= 0 &&
      ny < GRID_ROWS &&
      !visited.has(`${nx},${ny}`)
    ) {
      result.push([nx, ny]);
    }
  }
  return result;
}

function isConnected(
  grid: CellType[][],
  start: [number, number],
  end: [number, number],
): boolean {
  const queue: [number, number][] = [start];
  const visited = new Set<string>([`${start[0]},${start[1]}`]);
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    if (cx === end[0] && cy === end[1]) return true;
    for (const [dx, dy] of directions) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS) {
        const key = `${nx},${ny}`;
        const cell = grid[ny][nx];
        if (!visited.has(key) && (cell === "trace" || cell === "padB")) {
          visited.add(key);
          queue.push([nx, ny]);
        }
      }
    }
  }
  return false;
}

export function PCBFixer({
  onClose,
  onMinimize,
  onMaximize,
  isActive,
  setActive,
}: {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isActive: boolean;
  setActive: () => void;
}) {
  const [grid, setGrid] = useState<CellType[][]>([]);
  const [padA, setPadA] = useState<[number, number]>([0, 0]);
  const [padB, setPadB] = useState<[number, number]>([9, 7]);
  const [timeLeft, setTimeLeft] = useState(25);
  const [gameState, setGameState] = useState<
    "playing" | "won" | "lost" | "idle"
  >("idle");
  const [powerOn, setPowerOn] = useState(false);
  const [flickerPhase, setFlickerPhase] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("pcbfixer-highscore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    const saved = localStorage.getItem("pcbfixer-beststreak");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [dragPath, setDragPath] = useState<[number, number][]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [shakeGrid, setShakeGrid] = useState(false);
  const [wrongTraces, setWrongTraces] = useState(0);
  const [hintText, setHintText] = useState("");
  const [touchFeedback, setTouchFeedback] = useState<{
    x: number;
    y: number;
    show: boolean;
  }>({ x: 0, y: 0, show: false });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragPathRef = useRef<[number, number][]>([]);
  const gridStateRef = useRef<CellType[][]>([]);
  const padARef = useRef<[number, number]>([0, 0]);
  const padBRef = useRef<[number, number]>([9, 7]);

  const config = getLevelConfig(level);

  // Keep refs in sync
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);
  useEffect(() => {
    dragPathRef.current = dragPath;
  }, [dragPath]);
  useEffect(() => {
    gridStateRef.current = grid;
  }, [grid]);
  useEffect(() => {
    padARef.current = padA;
  }, [padA]);
  useEffect(() => {
    padBRef.current = padB;
  }, [padB]);

  const initBoard = useCallback(
    (startLevel?: number) => {
      const lvl = startLevel ?? level;
      const cfg = getLevelConfig(lvl);
      const { grid: newGrid, padA: a, padB: b } = generateSolvablePuzzle(cfg);

      setGrid(newGrid);
      setPadA(a);
      setPadB(b);
      setTimeLeft(cfg.time);
      setGameState("playing");
      setPowerOn(false);
      setFlickerPhase(false);
      setShowLevelUp(false);
      setDragPath([]);
      setIsDragging(false);
      isDraggingRef.current = false;
      dragPathRef.current = [];
      setWrongTraces(0);
      setShakeGrid(false);
      setHintText("Touch & drag from PAD A to PAD B!");
    },
    [level],
  );

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState("lost");
            setStreak(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (flickerPhase) {
      let count = 0;
      flickerRef.current = setInterval(() => {
        setPowerOn((prev) => !prev);
        count++;
        if (count > 15) {
          if (flickerRef.current) clearInterval(flickerRef.current);
          setPowerOn(true);
          setFlickerPhase(false);
        }
      }, 80);
    }
    return () => {
      if (flickerRef.current) clearInterval(flickerRef.current);
    };
  }, [flickerPhase]);

  useEffect(() => {
    if (gameState === "playing" && grid.length > 0) {
      if (isConnected(grid, padA, padB)) {
        setGameState("won");
        if (timerRef.current) clearInterval(timerRef.current);

        const timeBonus = timeLeft * 10;
        const levelBonus = level * 50;
        const newScore = score + 100 + timeBonus + levelBonus - wrongTraces * 5;
        setScore(Math.max(0, newScore));

        const newStreak = streak + 1;
        setStreak(newStreak);

        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem("pcbfixer-highscore", newScore.toString());
        }
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
          localStorage.setItem("pcbfixer-beststreak", newStreak.toString());
        }

        setFlickerPhase(true);
      }
    }
  }, [
    grid,
    gameState,
    padA,
    padB,
    score,
    streak,
    highScore,
    bestStreak,
    level,
    timeLeft,
    wrongTraces,
  ]);

  // ─── Coordinate extraction with touch support ─
  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number): [number, number] | null => {
      const target = gridRef.current;
      if (!target) return null;
      const rect = target.getBoundingClientRect();

      const x = Math.floor((clientX - rect.left) / (rect.width / GRID_COLS));
      const y = Math.floor((clientY - rect.top) / (rect.height / GRID_ROWS));

      if (x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS) {
        return [x, y];
      }
      return null;
    },
    [],
  );

  // ─── Core drag logic (works for both mouse and touch) ─
  const processDragStart = useCallback(
    (clientX: number, clientY: number) => {
      if (gameStateRef.current !== "playing") return;

      const cell = getCellFromPoint(clientX, clientY);
      if (!cell) return;

      const [x, y] = cell;
      const cellType = gridStateRef.current[y]?.[x];

      if (cellType !== "padA") {
        setShakeGrid(true);
        setTimeout(() => setShakeGrid(false), 300);
        setHintText("Start from PAD A!");
        return;
      }

      setIsDragging(true);
      isDraggingRef.current = true;
      setDragPath([[x, y]]);
      dragPathRef.current = [[x, y]];
      setHintText("Drag to Pad B...");
      setTouchFeedback({ x: clientX, y: clientY, show: true });
    },
    [getCellFromPoint],
  );

  const processDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDraggingRef.current || gameStateRef.current !== "playing") return;

      const cell = getCellFromPoint(clientX, clientY);
      if (!cell) return;

      const [x, y] = cell;
      const lastPos = dragPathRef.current[dragPathRef.current.length - 1];
      if (!lastPos) return;

      const dx = Math.abs(x - lastPos[0]);
      const dy = Math.abs(y - lastPos[1]);
      if (dx + dy !== 1) return;

      const alreadyInPath = dragPathRef.current.some(
        ([px, py]) => px === x && py === y,
      );
      if (alreadyInPath) return;

      const cellType = gridStateRef.current[y]?.[x];
      if (cellType === "blocked" || cellType === "locked") {
        setShakeGrid(true);
        setTimeout(() => setShakeGrid(false), 300);
        return;
      }

      const newPath = [...dragPathRef.current, [x, y] as [number, number]];
      dragPathRef.current = newPath;
      setDragPath(newPath);

      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        for (let ry = 0; ry < GRID_ROWS; ry++) {
          for (let rx = 0; rx < GRID_COLS; rx++) {
            if (next[ry][rx] === "trace") next[ry][rx] = "empty";
          }
        }
        newPath.forEach(([px, py]) => {
          if (next[py][px] === "empty") next[py][px] = "trace";
        });
        return next;
      });

      if (cellType === "padB") {
        setHintText("Release to confirm!");
      }

      setTouchFeedback({ x: clientX, y: clientY, show: true });
    },
    [getCellFromPoint],
  );

  const processDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;

    const lastPos = dragPathRef.current[dragPathRef.current.length - 1];
    const reachedB =
      lastPos &&
      lastPos[0] === padBRef.current[0] &&
      lastPos[1] === padBRef.current[1];

    if (!reachedB) {
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        for (let y = 0; y < GRID_ROWS; y++) {
          for (let x = 0; x < GRID_COLS; x++) {
            if (next[y][x] === "trace") next[y][x] = "empty";
          }
        }
        return next;
      });
      setWrongTraces((w) => w + 1);
      setHintText("RELEASED! Path reset. Try again from Pad A.");
      setShakeGrid(true);
      setTimeout(() => setShakeGrid(false), 300);
    } else {
      setHintText("Connection made! Checking...");
    }

    setIsDragging(false);
    isDraggingRef.current = false;
    dragPathRef.current = [];
    setDragPath([]);
    setTouchFeedback((prev) => ({ ...prev, show: false }));
  }, []);

  // Keep gameState in ref for handlers
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // ─── React event handlers (for mouse) ─
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      e.preventDefault();
      e.stopPropagation();
      processDragStart(e.clientX, e.clientY);
    },
    [processDragStart],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      processDragMove(e.clientX, e.clientY);
    },
    [processDragMove],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      processDragEnd();
    },
    [processDragEnd],
  );

  // ─── Touch handlers with proper passive/preventDefault ─
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      // Don't prevent default immediately - let RND check if it's a drag on title bar
      // But for the grid area, we need to take over
      const target = e.target as HTMLElement;
      const isInGrid = target.closest(".pcb-grid-container") !== null;
      if (isInGrid) {
        e.preventDefault();
        e.stopPropagation();
        processDragStart(touch.clientX, touch.clientY);
      }
    },
    [processDragStart],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      if (e.touches.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      processDragMove(touch.clientX, touch.clientY);
    },
    [processDragMove],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      processDragEnd();
    },
    [processDragEnd],
  );

  const handleTouchCancel = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      processDragEnd();
    },
    [processDragEnd],
  );

  // ─── Global listeners for drag continuation outside grid ─
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      processDragMove(e.clientX, e.clientY);
    };
    const onMouseUp = () => processDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      processDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => processDragEnd();

    window.addEventListener("mousemove", onMouseMove, { passive: false });
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [isDragging, processDragMove, processDragEnd]);

  const handleNextLevel = () => {
    const nextLevel = level + 1;
    setLevel(nextLevel);
    setShowLevelUp(true);
    setTimeout(() => {
      initBoard(nextLevel);
    }, 1500);
  };

  const handleRestart = () => {
    setLevel(1);
    setScore(0);
    setStreak(0);
    initBoard(1);
  };

  const getCellStyle = (
    cell: CellType,
    x: number,
    y: number,
  ): React.CSSProperties => {
    const isInDragPath = dragPath.some(([px, py]) => px === x && py === y);
    const isLastDrag =
      dragPath.length > 0 &&
      dragPath[dragPath.length - 1][0] === x &&
      dragPath[dragPath.length - 1][1] === y;

    const base: React.CSSProperties = {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "10px",
      fontWeight: "bold",
      userSelect: "none",
      WebkitUserSelect: "none",
      transition: "all 0.15s ease",
      position: "relative",
      overflow: "hidden",
      border: "1px solid #003300",
      pointerEvents: "none",
    };

    if (powerOn) {
      base.backgroundColor = "#32CD32";
    } else if (flickerPhase) {
      base.backgroundColor = Math.random() > 0.5 ? "#32CD32" : "#002200";
    } else {
      base.backgroundColor = "#002200";
    }

    if (cell === "empty" || cell === "trace") {
      base.backgroundImage = `
        linear-gradient(90deg, transparent 48%, ${powerOn ? "#228B22" : "#004400"} 49%, ${powerOn ? "#228B22" : "#004400"} 51%, transparent 52%),
        linear-gradient(0deg, transparent 48%, ${powerOn ? "#228B22" : "#004400"} 49%, ${powerOn ? "#228B22" : "#004400"} 51%, transparent 52%)
      `;
    }

    if (cell === "trace" || isInDragPath) {
      if (powerOn) {
        base.backgroundColor = "#E0FFE0";
        base.boxShadow = "inset 0 0 15px #fff, 0 0 15px #fff, 0 0 25px #00ffff";
        base.border = "1px solid #fff";
        base.zIndex = 2;
      } else {
        base.backgroundColor = isInDragPath ? "#FFD700" : "#DAA520";
        base.boxShadow = isInDragPath
          ? "0 0 10px #FFD700, inset 0 0 5px #FFA500"
          : "inset 0 0 4px #B8860B";
        base.border = isLastDrag ? "2px solid #FF00FF" : "1px solid #B8860B";
      }
    }

    if (cell === "blocked") {
      base.backgroundColor = powerOn ? "#1a1a1a" : "#0a0a0a";
      base.border = `1px solid ${powerOn ? "#444" : "#222"}`;
    }

    if (cell === "locked") {
      base.backgroundColor = "#330000";
      base.border = "2px dashed #FF0040";
      base.opacity = 0.8;
    }

    if (cell === "padA") {
      base.backgroundColor = powerOn ? "#00ff00" : "#228B22";
      base.boxShadow = powerOn
        ? "0 0 20px #00ff00, inset 0 0 10px #fff"
        : "none";
      base.border = "2px solid #fff";
    }

    if (cell === "padB") {
      base.backgroundColor = powerOn ? "#00ff00" : "#228B22";
      base.boxShadow = powerOn
        ? "0 0 20px #00ff00, inset 0 0 10px #fff"
        : "none";
      base.border = "2px solid #fff";
    }

    return base;
  };

  const getCellContent = (cell: CellType, x: number, y: number) => {
    const isLastDrag =
      dragPath.length > 0 &&
      dragPath[dragPath.length - 1][0] === x &&
      dragPath[dragPath.length - 1][1] === y;

    if (cell === "padA")
      return <span className="text-white text-xs font-bold">A</span>;
    if (cell === "padB")
      return <span className="text-white text-xs font-bold">B</span>;
    if (cell === "locked") return <span className="text-[10px]">🔒</span>;
    if (cell === "blocked")
      return (
        <div className="w-[70%] h-[40%] bg-[#333] border border-[#444] rounded-sm relative">
          <div className="absolute left-[15%] top-[-20%] w-[8%] h-[140%] bg-[#888]" />
          <div className="absolute right-[15%] top-[-20%] w-[8%] h-[140%] bg-[#888]" />
          <div className="absolute left-[20%] top-[30%] w-[60%] h-[2px] bg-[#666]" />
        </div>
      );
    if (cell === "trace" || isLastDrag) {
      if (powerOn) {
        return (
          <div className="w-[80%] h-[80%] bg-white/90 rounded-sm shadow-[0_0_8px_#fff,0_0_16px_#00ffff]" />
        );
      }
      return (
        <div
          className={`w-[80%] h-[80%] rounded-sm ${isLastDrag ? "bg-[#FF00FF]" : "bg-[#DAA520]"} shadow-[inset_0_0_4px_#B8860B]`}
        />
      );
    }
    return null;
  };

  return (
    <div
      className={`window h-full flex flex-col ${isActive ? "ring-2 ring-[#FF00FF]" : ""}`}
      onClick={setActive}
    >
      {/* Title Bar */}
      <div className="title-bar flex items-center justify-between cursor-move shrink-0">
        <div className="flex items-center gap-2">
          <span>🔧</span>
          <span className="hidden sm:inline">
            PCB-FIXER v3.0 — LVL {level} [{config.label}]
          </span>
          <span className="sm:hidden">PCB L{level}</span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="hidden sm:inline px-2 hover:bg-white/20"
          >
            🗕
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            className="hidden sm:inline px-2 hover:bg-white/20"
          >
            🗖
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-2 hover:bg-red-500 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className="flex-1 p-2 sm:p-3 bg-[#001100] flex flex-col items-center justify-start overflow-hidden"
      >
        {/* Stats */}
        <div className="w-full max-w-[420px] flex items-center justify-between text-[10px] sm:text-xs mb-1 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[#FF00FF] font-bold">LVL {level}</span>
            <span className="text-[#FFD700]">{config.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#00ffff] font-mono">🏆 {highScore}</span>
            <span className="text-[#32CD32] font-mono">🔥 {streak}</span>
            <span className="text-[#FF0040] font-mono">✗ {wrongTraces}</span>
          </div>
        </div>

        <div className="w-full max-w-[420px] flex items-center justify-between text-[10px] mb-1 shrink-0">
          <span className="text-[#FFD700]">SCORE: {score}</span>
          <span
            className={`${isDragging ? "text-[#FF00FF] animate-pulse" : "text-[#888]"}`}
          >
            {hintText}
          </span>
        </div>

        {/* Timer */}
        <div className="w-full max-w-[420px] mb-2 shrink-0">
          <div className="flex items-center justify-between mb-0.5">
            <span
              className={`text-[10px] font-bold ${timeLeft <= 5 ? "text-[#FF0040] animate-pulse" : "text-[#FF00FF]"}`}
            >
              ⏱️ {timeLeft}s
            </span>
            {timeLeft <= 5 && gameState === "playing" && (
              <span className="text-[#FF0040] text-[10px] font-bold animate-pulse">
                ⚠️ HURRY!
              </span>
            )}
          </div>
          <div
            className="w-full h-3 rounded border-2 overflow-hidden"
            style={{
              borderColor: timeLeft <= 5 ? "#FF0040" : "#FF00FF",
              background: "#1a1a1a",
              boxShadow: timeLeft <= 5 ? "0 0 10px #FF0040" : "none",
            }}
          >
            <div
              className="h-full transition-all duration-1000 ease-linear"
              style={{
                width: `${(timeLeft / config.time) * 100}%`,
                background:
                  timeLeft <= 5
                    ? "linear-gradient(90deg, #FF0040, #FF6666)"
                    : timeLeft <= config.time * 0.25
                      ? "linear-gradient(90deg, #FFD700, #FFAA00)"
                      : "linear-gradient(90deg, #FF00FF, #C44BFF)",
                boxShadow: timeLeft <= 5 ? "0 0 15px #FF0040" : "none",
              }}
            />
          </div>
        </div>

        {/* Grid - Dedicated touch capture layer */}
        <div
          ref={gridRef}
          className={`pcb-grid-container grid gap-[1px] p-1 rounded-lg border-2 select-none ${shakeGrid ? "animate-shake" : ""}`}
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
            width: "min(100%, 400px)",
            aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`,
            background: powerOn
              ? "#32CD32"
              : flickerPhase
                ? "#1a5a1a"
                : "#001100",
            borderColor: powerOn
              ? "#32CD32"
              : timeLeft <= 5 && gameState === "playing"
                ? "#FF0040"
                : "#FF00FF30",
            boxShadow: powerOn
              ? "0 0 30px #32CD32, inset 0 0 15px #228B22"
              : timeLeft <= 5 && gameState === "playing"
                ? "0 0 15px #FF0040"
                : "none",
            touchAction: "none",
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
            cursor: gameState === "playing" ? "crosshair" : "default",
            position: "relative",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          {grid.map((row, y) =>
            row.map((cell, x) => (
              <div key={`${x}-${y}`} style={getCellStyle(cell, x, y)}>
                {getCellContent(cell, x, y)}
              </div>
            )),
          )}
        </div>

        {/* Touch feedback indicator */}
        {touchFeedback.show && (
          <div
            className="fixed w-8 h-8 rounded-full border-2 border-[#FF00FF] bg-[#FF00FF]/30 pointer-events-none z-[300]"
            style={{
              left: touchFeedback.x - 16,
              top: touchFeedback.y - 16,
              transform: "scale(1)",
              animation: "pulse 0.5s ease-in-out infinite",
            }}
          />
        )}

        {/* Controls */}
        <div className="mt-2 flex gap-2 flex-wrap justify-center shrink-0">
          {gameState === "idle" ||
          gameState === "won" ||
          gameState === "lost" ? (
            <button
              onClick={() => initBoard()}
              className="nes-btn is-primary text-[10px] sm:text-xs px-3 py-1"
            >
              {gameState === "idle" ? "START GAME" : "PLAY AGAIN"}
            </button>
          ) : (
            <button
              onClick={() => initBoard()}
              className="nes-btn is-error text-[10px] sm:text-xs px-3 py-1"
            >
              RESTART
            </button>
          )}
          {gameState === "won" && (
            <button
              onClick={handleNextLevel}
              className="nes-btn is-success text-[10px] sm:text-xs px-3 py-1 animate-bounce"
            >
              NEXT LEVEL →
            </button>
          )}
        </div>

        {gameState === "idle" && (
          <div className="text-center mt-1 text-[#FFD700] text-[10px] max-w-[420px] shrink-0 leading-tight">
            <p>DRAG from Pad A → Pad B. Release = RESET!</p>
            <p className="text-[#FF0040]">
              ⚠️ One mistake = start over. No mercy.
            </p>
          </div>
        )}
      </div>

      {/* Level Up Flash */}
      {showLevelUp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200]">
          <div className="text-center">
            <div className="text-4xl mb-2 animate-pulse">⚡</div>
            <h2 className="text-[#32CD32] text-xl font-bold tracking-widest animate-pulse">
              LEVEL {level} UNLOCKED
            </h2>
            <p className="text-[#FFD700] text-xs mt-1">
              {getLevelConfig(level).label}
            </p>
            <p className="text-[#FF0040] text-[10px] mt-1">
              {getLevelConfig(level).time}s |{" "}
              {Math.round(getLevelConfig(level).blockedRatio * 100)}% blocked
            </p>
          </div>
        </div>
      )}

      {/* Win Dialog */}
      {gameState === "won" && !flickerPhase && !showLevelUp && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4">
          <div className="nes-container is-rounded is-dark !bg-[#002200] !border-[#32CD32] max-w-xs w-full text-center p-4">
            <div className="text-3xl mb-1">⚡</div>
            <h2 className="text-[#32CD32] text-base font-bold tracking-wider">
              CIRCUIT STABLE.
            </h2>
            <h2 className="text-[#00ffff] text-base font-bold mb-2 tracking-wider">
              SYSTEM ONLINE.
            </h2>
            <div className="text-[#FFD700] text-[10px] mb-1 space-y-0.5">
              <p>⏱️ Time Bonus: +{timeLeft * 10} pts</p>
              <p>📈 Level Bonus: +{level * 50} pts</p>
              <p className="text-[#FF00FF] font-bold text-xs">TOTAL: {score}</p>
            </div>
            <div className="flex gap-2 justify-center mt-3">
              <button
                onClick={handleNextLevel}
                className="nes-btn is-success text-[10px] px-3 py-1"
              >
                NEXT →
              </button>
              <button
                onClick={handleRestart}
                className="nes-btn is-error text-[10px] px-3 py-1"
              >
                RESET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Dialog */}
      {gameState === "lost" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4">
          <div className="nes-container is-rounded is-dark !bg-[#220000] !border-[#FF0040] max-w-xs w-full text-center p-4">
            <div className="text-3xl mb-1">💥</div>
            <h2 className="text-[#FF0040] text-base font-bold mb-2 tracking-wider">
              CIRCUIT FAILED.
            </h2>
            <p className="text-[#FFD700] text-[10px] mb-1">
              Time ran out before connection.
            </p>
            <p className="text-[#888] text-[10px] mb-1">
              Level {level} — {config.label}
            </p>
            <p className="text-[#FF00FF] text-[10px] mb-2">
              Score: {score} | Best: {bestStreak}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => initBoard()}
                className="nes-btn is-primary text-[10px] px-3 py-1"
              >
                RETRY
              </button>
              <button
                onClick={handleRestart}
                className="nes-btn is-error text-[10px] px-3 py-1"
              >
                RESET ALL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
