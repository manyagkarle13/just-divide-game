import { useState, useEffect } from "react";
import heroImage from "./assets/hero.png";

// ─── helpers ────────────────────────────────────────────────────────────────
const GRID_SIZE = 16;
const QUEUE_LEN = 3;
const MAX_UNDO = 10;
const TRASH_PER_LEVEL = 3;
const POINTS_PER_LEVEL = 10;

const TILE_POOL = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 25, 30, 32, 35, 36];

function randomTile() {
  return TILE_POOL[Math.floor(Math.random() * TILE_POOL.length)];
}

function initQueue() {
  return Array.from({ length: QUEUE_LEN }, randomTile);
}

function applyMerges(grid, placedIdx) {
  let g = [...grid];
  let score = 0;
  let changed = true;

  while (changed) {
    changed = false;
    // get neighbors of every filled cell and check merge
    for (let i = 0; i < GRID_SIZE; i++) {
      if (g[i] === null) continue;
      const neighbors = getNeighbors(i);
      for (const ni of neighbors) {
        if (g[ni] === null) continue;
        const a = g[i], b = g[ni];
        if (a === b) {
          // equal → both vanish
          g[i] = null;
          g[ni] = null;
          score += 2;
          changed = true;
          break;
        }
        const big = Math.max(a, b), small = Math.min(a, b);
        if (big % small === 0) {
          const result = big / small;
          const bigIdx = a >= b ? i : ni;
          const smallIdx = a >= b ? ni : i;
          if (result === 1) {
            g[bigIdx] = null;
          } else {
            g[bigIdx] = result;
          }
          g[smallIdx] = null;
          score += 1;
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }
  return { grid: g, score };
}

function getNeighbors(idx) {
  const row = Math.floor(idx / 4), col = idx % 4;
  const nbrs = [];
  if (row > 0) nbrs.push(idx - 4);
  if (row < 3) nbrs.push(idx + 4);
  if (col > 0) nbrs.push(idx - 1);
  if (col < 3) nbrs.push(idx + 1);
  return nbrs;
}

function getHintCells(grid, tileVal) {
  const hints = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    if (grid[i] !== null) continue;
    const nbrs = getNeighbors(i);
    for (const ni of nbrs) {
      if (grid[ni] === null) continue;
      const a = tileVal, b = grid[ni];
      if (a === b) { hints.push(i); break; }
      const big = Math.max(a, b), small = Math.min(a, b);
      if (big % small === 0) { hints.push(i); break; }
    }
  }
  return hints;
}

function isGameOver(grid, queue, keepVal) {
  const allFilled = grid.every(v => v !== null);
  if (!allFilled) return false;
  // check if any merge possible
  for (let i = 0; i < GRID_SIZE; i++) {
    for (const ni of getNeighbors(i)) {
      const a = grid[i], b = grid[ni];
      if (a === b) return false;
      const big = Math.max(a, b), small = Math.min(a, b);
      if (big % small === 0) return false;
    }
  }
  return true;
}

// ─── tile colors ────────────────────────────────────────────────────────────
function tileColor(val) {
  if (val === null) return null;
  const colors = [
    { max: 4,  bg: "#FF8FA3", shadow: "#D95B75" },
    { max: 8,  bg: "#FFA960", shadow: "#D57B31" },
    { max: 12, bg: "#FFD66B", shadow: "#D2A53A" },
    { max: 20, bg: "#66D7EB", shadow: "#3CA9BF" },
    { max: 30, bg: "#93A8FF", shadow: "#6277CB" },
    { max: 50, bg: "#A48BFF", shadow: "#6E58CF" },
    { max: Infinity, bg: "#7A67D8", shadow: "#5442A8" },
  ];
  return colors.find(c => val <= c.max) || colors[colors.length - 1];
}

// ─── snapshot for undo ───────────────────────────────────────────────────────
function snapshot(state) {
  return {
    grid: [...state.grid],
    queue: [...state.queue],
    keepVal: state.keepVal,
    score: state.score,
    level: state.level,
    trashCount: state.trashCount,
  };
}

// ─── main component ──────────────────────────────────────────────────────────
export default function JustDivide() {
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill(null));
  const [queue, setQueue] = useState(initQueue);
  const [keepVal, setKeepVal] = useState(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem("jd_best") || "0"); } catch { return 0; }
  });
  const [level, setLevel] = useState(1);
  const [trashCount, setTrashCount] = useState(TRASH_PER_LEVEL);
  const [hintsEnabled, setHintsEnabled] = useState(false);
  const [timer, setTimer] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [draggingFrom, setDraggingFrom] = useState(null); // "queue" | "keep"
  const [dragVal, setDragVal] = useState(null);
  const [lastMergeIdx, setLastMergeIdx] = useState(null);

  // timer
  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [gameOver]);

  const timerStr = `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 60).padStart(2, "0")}`;

  // keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "z" || e.key === "Z") handleUndo();
      if (e.key === "r" || e.key === "R") handleRestart();
      if (e.key === "g" || e.key === "G") setHintsEnabled(h => !h);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ─── actions ─────────────────────────────────────────────────────────────
  function pushUndo(state) {
    setUndoStack(s => [...s.slice(-MAX_UNDO + 1), snapshot(state)]);
  }

  function handleUndo() {
    setUndoStack(s => {
      if (!s.length) return s;
      const prev = s[s.length - 1];
      setGrid(prev.grid);
      setQueue(prev.queue);
      setKeepVal(prev.keepVal);
      setScore(prev.score);
      setLevel(prev.level);
      setTrashCount(prev.trashCount);
      return s.slice(0, -1);
    });
  }

  function handleRestart() {
    setGrid(Array(GRID_SIZE).fill(null));
    setQueue(initQueue());
    setKeepVal(null);
    setScore(0);
    setLevel(1);
    setTrashCount(TRASH_PER_LEVEL);
    setTimer(0);
    setGameOver(false);
    setUndoStack([]);
  }

  function commitScore(newScore) {
    setScore(newScore);
    const newLevel = Math.floor(newScore / POINTS_PER_LEVEL) + 1;
    setLevel(prev => {
      if (newLevel > prev) {
        setTrashCount(tc => tc + TRASH_PER_LEVEL);
      }
      return newLevel;
    });
    if (newScore > bestScore) {
      setBestScore(newScore);
      try { localStorage.setItem("jd_best", String(newScore)); } catch {}
    }
  }

  function placeOnGrid(cellIdx) {
    if (grid[cellIdx] !== null) return;
    const val = dragVal;
    if (val === null) return;

    // save undo
    pushUndo({ grid, queue, keepVal, score, level, trashCount });

    const newGrid = [...grid];
    newGrid[cellIdx] = val;
    const { grid: resolved, score: gained } = applyMerges(newGrid, cellIdx);

    setGrid(resolved);
    setLastMergeIdx(cellIdx);
    setTimeout(() => setLastMergeIdx(null), 400);

    const newScore = score + gained;
    commitScore(newScore);

    consumeDragSource();

    if (isGameOver(resolved, queue, keepVal)) {
      setGameOver(true);
    }
  }

  function placeOnKeep() {
    const val = dragVal;
    if (val === null) return;
    pushUndo({ grid, queue, keepVal, score, level, trashCount });

    if (keepVal !== null && draggingFrom === "queue") {
      // swap: put keepVal back into front of queue
      setQueue(q => [keepVal, ...q]);
    }
    setKeepVal(val);
    consumeDragSource();
  }

  function placeOnTrash() {
    if (trashCount <= 0) return;
    pushUndo({ grid, queue, keepVal, score, level, trashCount });
    setTrashCount(tc => tc - 1);
    consumeDragSource();
  }

  function consumeDragSource() {
    if (draggingFrom === "queue") {
      setQueue(q => {
        const next = q.slice(1);
        while (next.length < QUEUE_LEN) next.push(randomTile());
        return next;
      });
    } else if (draggingFrom === "keep") {
      setKeepVal(null);
    }
    setDragVal(null);
    setDraggingFrom(null);
  }

  // ─── drag handlers ────────────────────────────────────────────────────────
  function onDragStart(val, from) {
    setDragVal(val);
    setDraggingFrom(from);
  }

  function onDropGrid(e, idx) {
    e.preventDefault();
    placeOnGrid(idx);
  }
  function onDropKeep(e) {
    e.preventDefault();
    placeOnKeep();
  }
  function onDropTrash(e) {
    e.preventDefault();
    placeOnTrash();
  }

  const hintCells = hintsEnabled && dragVal ? getHintCells(grid, dragVal) : [];

  // ─── render ───────────────────────────────────────────────────────────────
  const activeTile = draggingFrom === "queue" ? queue[0] : draggingFrom === "keep" ? keepVal : null;

  return (
    <div style={styles.root}>
      {/* Bubble background */}
      <BubbleBackground />

      <div style={styles.wrapper}>
        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.scoreBox}>🏆 {bestScore}</span>
          </div>
          <div style={styles.titleBlock}>
            <div style={styles.title}>JUST DIVIDE</div>
            <div style={styles.timerRow}>
              <span style={styles.timerIcon}>✂️</span>
              <span style={styles.timerText}>{timerStr}</span>
            </div>
          </div>
          <div style={styles.headerRight}>
            <button style={styles.iconBtn} onClick={() => setHintsEnabled(h => !h)} title="Toggle Hints (G)">
              {hintsEnabled ? "💡" : "🔦"}
            </button>
          </div>
        </div>

        <div style={styles.subtitle}>
          DIVIDE WITH THE NUMBERS TO SOLVE THE ROWS AND COLUMNS.
        </div>

        {/* ── Cat + badges ── */}
        {/* Main area */}
        <div style={styles.mainArea}>
          <div style={styles.characterWrap}>
            <CatInBox />
          </div>

          <div style={styles.boardColumn}>
            <div style={styles.gridTopStats}>
              <div style={styles.badge}>
                <span style={styles.badgeLabel}>LEVEL</span>
                <span style={styles.badgeVal}>{level}</span>
              </div>
              <div style={{...styles.badge, background: "linear-gradient(135deg,#ffd48a,#ffa777)", boxShadow: "0 8px 0 #d07e54"}}>
                <span style={styles.badgeLabel}>SCORE</span>
                <span style={styles.badgeVal}>{score}</span>
              </div>
            </div>

            <div style={styles.gridWrapper}>
              <div style={styles.grid}>
                {grid.map((val, idx) => {
                  const isHint = hintCells.includes(idx);
                  const isEmpty = val === null;
                  return (
                    <GridCell
                      key={idx}
                      val={val}
                      isHint={isHint}
                      isHighlighted={lastMergeIdx === idx}
                      onDragOver={e => { if (isEmpty) e.preventDefault(); }}
                      onDrop={e => onDropGrid(e, idx)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div style={styles.rightPanel}>
            {/* KEEP */}
            <div style={styles.panelLabel}>KEEP</div>
            <div
              style={{
                ...styles.keepSlot,
                borderColor: keepVal ? "#f08eb5" : "#ccb8c2",
                background: keepVal ? "#fff0f8" : "#fff",
              }}
              onDragOver={e => e.preventDefault()}
              onDrop={onDropKeep}
            >
              {keepVal !== null ? (
                <Tile
                  val={keepVal}
                  draggable
                  onDragStart={() => onDragStart(keepVal, "keep")}
                />
              ) : (
                <span style={styles.emptySlotText}>drop here</span>
              )}
            </div>

            {/* Queue */}
            <div style={styles.queueRow}>
              {queue.map((val, i) => (
                <Tile
                  key={i}
                  val={val}
                  draggable={i === 0}
                  size={i === 0 ? 62 : 48}
                  onDragStart={i === 0 ? () => onDragStart(val, "queue") : undefined}
                  style={{ opacity: i === 0 ? 1 : 0.55, cursor: i === 0 ? "grab" : "default" }}
                />
              ))}
            </div>

            {/* TRASH */}
            <div style={styles.panelLabel}>TRASH</div>
            <div
              style={styles.trashSlot}
              onDragOver={trashCount > 0 ? e => e.preventDefault() : undefined}
              onDrop={trashCount > 0 ? onDropTrash : undefined}
            >
              <span style={{ fontSize: 22 }}>🗑️</span>
              <span style={styles.trashCount}>x{trashCount}</span>
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div style={styles.controls}>
          <CtrlBtn onClick={handleUndo} title="Undo (Z)">↩ Undo</CtrlBtn>
          <CtrlBtn onClick={handleRestart} title="Restart (R)">🔄 Restart</CtrlBtn>
        </div>

        {/* ── Hint banner ── */}
        <div style={styles.tipText}>
          Drag the first queue tile to the board, KEEP slot, or TRASH to plan your next merge.
        </div>

        {hintsEnabled && (
          <div style={styles.hintBanner}>
            💡 Hints ON — highlighted cells can create a merge!
          </div>
        )}
      </div>

      {/* ── Game Over Overlay ── */}
      {gameOver && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Game Over! 🎉</div>
            <div style={styles.modalScore}>Score: <b>{score}</b></div>
            <div style={styles.modalBest}>Best: <b>{bestScore}</b></div>
            <button style={styles.modalBtn} onClick={handleRestart}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GridCell ────────────────────────────────────────────────────────────────
function GridCell({ val, isHint, isHighlighted, onDragOver, onDrop }) {
  const color = tileColor(val);
  return (
    <div
      style={{
        ...styles.cell,
        background: val !== null
          ? color.bg
          : isHint
          ? "rgba(255, 242, 170, 0.65)"
          : "rgba(255,255,255,0.28)",
        boxShadow: val !== null
          ? `0 5px 0 ${color.shadow}, 0 10px 15px rgba(0,0,0,0.12)`
          : isHint
          ? "0 0 0 3px #f4c95f inset"
          : "none",
        transform: isHighlighted ? "scale(1.12)" : "scale(1)",
        transition: "transform 0.25s, background 0.2s",
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {val !== null && (
        <span style={styles.tileNum}>{val}</span>
      )}
    </div>
  );
}

// ─── Tile ────────────────────────────────────────────────────────────────────
function Tile({ val, draggable, onDragStart, size = 60, style: extStyle }) {
  const color = tileColor(val);
  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: color ? color.bg : "#ddd",
        boxShadow: color ? `0 4px 0 ${color.shadow}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: draggable ? "grab" : "default",
        userSelect: "none",
        ...extStyle,
      }}
    >
      <span style={{ ...styles.tileNum, fontSize: size < 55 ? 16 : 22 }}>{val}</span>
    </div>
  );
}

// ─── BubbleBackground ────────────────────────────────────────────────────────
function BubbleBackground() {
  const bubbles = [
    { size: 130, top: "8%", left: "3%", color: "rgba(255, 183, 208, 0.28)" },
    { size: 84, top: "14%", right: "6%", color: "rgba(255, 215, 154, 0.25)" },
    { size: 170, bottom: "8%", left: "2%", color: "rgba(173, 230, 214, 0.26)" },
    { size: 68, top: "44%", right: "7%", color: "rgba(152, 214, 255, 0.30)" },
    { size: 110, bottom: "18%", right: "4%", color: "rgba(199, 183, 255, 0.24)" },
    { size: 48, top: "68%", left: "8%", color: "rgba(255, 166, 201, 0.22)" },
  ];
  return (
    <div style={styles.bg}>
      {bubbles.map((b, i) => (
        <div key={i} style={{
          position: "absolute",
          width: b.size, height: b.size,
          borderRadius: "50%",
          background: b.color,
          top: b.top, left: b.left, right: b.right, bottom: b.bottom,
          pointerEvents: "none",
        }} />
      ))}
    </div>
  );
}

// ─── CtrlBtn ─────────────────────────────────────────────────────────────────
function CtrlBtn({ onClick, children, title }) {
  return (
    <button onClick={onClick} title={title} style={styles.ctrlBtn}>
      {children}
    </button>
  );
}

function CatInBox() {
  return <img src={heroImage} alt="Cute cat" style={styles.sideCatImage} />;
}

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    width: "100%",
    background: "radial-gradient(circle at 12% 20%, #fceded 0%, rgba(255, 230, 241, 0.1) 30%), radial-gradient(circle at 84% 12%, #fff0d6 0%, rgba(255, 240, 214, 0.08) 28%), linear-gradient(150deg, #fff8ef 0%, #ffe3eb 48%, #d5f7ef 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Trebuchet MS', 'Gill Sans', 'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
    padding: "20px 12px 28px",
  },
  bg: {
    position: "absolute", inset: 0, pointerEvents: "none",
  },
  wrapper: {
    width: "min(96vw, 760px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
    position: "relative",
    zIndex: 1,
    padding: "20px 16px 22px",
    borderRadius: 30,
    background: "linear-gradient(160deg, rgba(255,255,255,0.78), rgba(255,255,255,0.58))",
    border: "1px solid rgba(255,255,255,0.82)",
    boxShadow: "0 24px 60px rgba(205, 126, 160, 0.22), 0 8px 26px rgba(103, 145, 153, 0.18)",
    backdropFilter: "blur(9px)",
  },
  header: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerLeft: { minWidth: 98 },
  headerRight: { minWidth: 98, display: "flex", justifyContent: "flex-end" },
  scoreBox: {
    background: "linear-gradient(135deg,#ff8eb4,#ffaf8a)",
    color: "#fffef8",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: 0.4,
    boxShadow: "0 8px 18px rgba(234, 120, 149, 0.28)",
  },
  titleBlock: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  },
  title: {
    fontSize: "clamp(32px, 4.7vw, 48px)",
    fontWeight: 900,
    color: "#704763",
    letterSpacing: 2.5,
    lineHeight: 1,
    textShadow: "0 2px 0 rgba(255,255,255,0.7)",
  },
  timerRow: {
    display: "flex", alignItems: "center", gap: 4, fontSize: 16, color: "#6f5c67", fontWeight: 700,
  },
  timerIcon: { fontSize: 16 },
  timerText: { fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  iconBtn: {
    background: "linear-gradient(145deg,#ffeaa7,#ffd3a1)",
    border: "1px solid rgba(255,255,255,0.9)",
    fontSize: 22,
    cursor: "pointer",
    borderRadius: 999,
    width: 44,
    height: 44,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 7px 14px rgba(210, 160, 94, 0.24)",
  },
  subtitle: {
    background: "linear-gradient(90deg,#ffa8c5,#ffc89f 55%, #b8ecd8)",
    color: "#5c4251",
    fontWeight: 900,
    fontSize: "clamp(11px, 2vw, 14px)",
    letterSpacing: 1.2,
    borderRadius: 999,
    padding: "10px 18px",
    textAlign: "center",
    width: "min(100%, 640px)",
    boxShadow: "0 6px 18px rgba(190, 138, 159, 0.22)",
  },
  boardColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  gridTopStats: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  badge: {
    background: "linear-gradient(135deg,#8a9bff,#5c78e7)",
    color: "#fff",
    borderRadius: 18,
    padding: "9px 18px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 8px 0 #455db7",
    minWidth: 94,
    border: "1px solid rgba(255,255,255,0.35)",
  },
  badgeLabel: { fontSize: 11, letterSpacing: 1.4, fontWeight: 800, opacity: 0.9 },
  badgeVal: { fontSize: 34, fontWeight: 900, lineHeight: 1 },
  characterWrap: {
    alignSelf: "center",
    marginRight: -4,
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    borderRadius: 20,
    width: "clamp(132px, 16vw, 176px)",
    height: "clamp(210px, 30vw, 290px)",
    border: "1px solid rgba(232, 226, 232, 0.95)",
    boxShadow: "0 12px 24px rgba(90, 73, 86, 0.14)",
    padding: "10px 8px",
    overflow: "hidden",
  },
  sideCatImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: 0,
    background: "#ffffff",
  },
  mainArea: {
    display: "flex",
    gap: 18,
    alignItems: "stretch",
    width: "100%",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  gridWrapper: {
    background: "linear-gradient(160deg,#79d4d4,#5cc4c5 55%, #50afb1)",
    borderRadius: 24,
    padding: 14,
    boxShadow: "0 16px 30px rgba(69, 152, 156, 0.35)",
    border: "1px solid rgba(255,255,255,0.45)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 10,
  },
  cell: {
    width: "clamp(58px, 9vw, 80px)",
    height: "clamp(58px, 9vw, 80px)",
    borderRadius: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid rgba(255,255,255,0.45)",
    cursor: "pointer",
  },
  tileNum: {
    fontSize: "clamp(20px, 2.6vw, 30px)",
    fontWeight: 900,
    color: "#fff",
    textShadow: "1px 2px 0 rgba(0,0,0,0.3)",
    userSelect: "none",
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    minWidth: 112,
    padding: "8px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.45)",
    border: "1px solid rgba(255,255,255,0.68)",
  },
  panelLabel: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 2,
    color: "#6f5566",
    background: "#fff4fb",
    borderRadius: 999,
    padding: "5px 12px",
    border: "1px solid rgba(226, 175, 198, 0.85)",
  },
  keepSlot: {
    width: 76, height: 76,
    borderRadius: 16,
    border: "3px dashed #ccb8c2",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "border-color 0.2s, background 0.2s",
  },
  emptySlotText: { fontSize: 11, color: "#a38f99", textAlign: "center", paddingInline: 6 },
  queueRow: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    alignItems: "center",
    background: "rgba(255,255,255,0.62)",
    borderRadius: 16,
    padding: "10px 8px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.55)",
  },
  trashSlot: {
    width: 76, height: 66,
    borderRadius: 16,
    border: "3px dashed #ff8c8c",
    background: "#fff4f4",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    cursor: "pointer",
  },
  trashCount: {
    fontSize: 14, fontWeight: 900, color: "#ef6f79",
  },
  controls: {
    display: "flex", gap: 12, marginTop: 2,
  },
  ctrlBtn: {
    background: "linear-gradient(135deg,#ff8eb4,#ffb68f)",
    color: "#fffdf8",
    border: "none",
    borderRadius: 14,
    padding: "11px 22px",
    fontWeight: 900,
    fontSize: 17,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 8px 0 #d97d9a, 0 12px 24px rgba(230, 125, 156, 0.28)",
    transition: "transform 0.12s",
  },
  tipText: {
    fontSize: "clamp(12px, 2vw, 14px)",
    color: "#7a6672",
    textAlign: "center",
    maxWidth: 560,
    lineHeight: 1.35,
  },
  hintBanner: {
    background: "linear-gradient(90deg,#ffe596,#ffd2a0)",
    color: "#6d4e36",
    fontWeight: 800,
    fontSize: 13,
    borderRadius: 999,
    padding: "8px 16px",
    boxShadow: "0 6px 14px rgba(219, 165, 98, 0.25)",
  },
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    background: "linear-gradient(165deg,#ffffff,#fff5fa)",
    borderRadius: 28,
    padding: "36px 48px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 20px 60px rgba(26, 17, 22, 0.3)",
    border: "1px solid rgba(255,255,255,0.75)",
  },
  modalTitle: { fontSize: 32, fontWeight: 900, color: "#754f66" },
  modalScore: { fontSize: 20, color: "#5b4450" },
  modalBest: { fontSize: 16, color: "#9a7d8d" },
  modalBtn: {
    marginTop: 8,
    background: "linear-gradient(135deg,#ff8eb4,#ffb68f)",
    color: "#fffdf8",
    border: "none",
    borderRadius: 14,
    padding: "12px 32px",
    fontSize: 18,
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 8px 0 #d97d9a",
  },
};

