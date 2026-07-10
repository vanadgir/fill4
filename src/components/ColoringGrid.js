import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDifficulty } from "../contexts/DifficultyContext";
import { usePalette, ERASER } from "../contexts/PaletteContext";
import { createBoard, countUnfilled, isLegalMove } from "../game/board";
import {
  currentStreak,
  dailySeed,
  isDailyComplete,
  recordDailySolve,
  shiftDateKey,
  todayKey,
} from "../game/daily";
import { loadSavedBoard, removeSavedBoard, saveBoard } from "../game/storage";
import ArchivePicker from "./ArchivePicker";
import ShareButton from "./ShareButton";
import Voronoi from "./Voronoi";
import VictoryMessage from "./VictoryMessage";

const MAP_ORDER = ["easy", "medium", "hard"];
const MAP_LETTER = { easy: "E", medium: "M", hard: "H" };
const MAP_NAME = { easy: "Easy", medium: "Medium", hard: "Hard" };

// how long the remaining-cell counter stays visible after a move before it
// fades, so it can never sit over a cell the player wants to click
const COUNTER_VISIBLE_MS = 2500;

export default function ColoringGrid() {
  const { mapDifficulty, numPoints, colorDifficulty } = useDifficulty();
  const { palette, paletteId, selectedId } = usePalette();

  // "today" is state, refreshed on focus and on a timer, so the app rolls
  // over correctly at midnight instead of trusting the mount-time date
  const [todayK, setTodayK] = useState(() => todayKey());
  useEffect(() => {
    const refresh = () => setTodayK(todayKey());
    const intervalId = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayK);
  const seed = dailySeed(selectedDate, mapDifficulty);
  const isToday = selectedDate === todayK;

  // board geometry is fully determined by (seed, numPoints)
  const { voronoi, neighbors } = useMemo(
    () => createBoard(seed, numPoints),
    [seed, numPoints]
  );

  // colors[i] is the palette index painted on cell i, or null if blank —
  // the only mutable game state; boards with any progress are restored
  // from storage, and a restored already-solved board skips the victory
  // popup (it only appears at the moment of solving)
  const [colors, setColors] = useState(
    () =>
      loadSavedBoard(seed, numPoints, colorDifficulty) ||
      Array(numPoints).fill(null)
  );
  const [victoryDismissed, setVictoryDismissed] = useState(() => {
    const saved = loadSavedBoard(seed, numPoints, colorDifficulty);
    return saved !== null && countUnfilled(saved) === 0;
  });
  const [invalidId, setInvalidId] = useState(null);
  const [, setCompletionsVersion] = useState(0);
  const [counterVisible, setCounterVisible] = useState(true);
  const invalidTimer = useRef(null);
  const counterTimer = useRef(null);

  // reset during render when the board changes, so no frame ever shows (or
  // records) old colors against new geometry
  const boardKey = `${seed}:${numPoints}`;
  const [prevBoardKey, setPrevBoardKey] = useState(boardKey);
  if (boardKey !== prevBoardKey) {
    setPrevBoardKey(boardKey);
    const saved = loadSavedBoard(seed, numPoints, colorDifficulty);
    setColors(saved || Array(numPoints).fill(null));
    setVictoryDismissed(saved !== null && countUnfilled(saved) === 0);
    setInvalidId(null);
  }

  // persist progress: any board with at least one move is stored, an
  // all-blank board (including after Clear) is dropped from storage
  useEffect(() => {
    if (colors.length !== numPoints) return;
    if (countUnfilled(colors) === numPoints) {
      removeSavedBoard(seed);
    } else {
      saveBoard(seed, colors);
    }
  }, [colors, seed, numPoints]);

  // shrinking the palette clears only the cells whose color no longer exists
  useEffect(() => {
    setColors((prev) =>
      prev.map((c) => (c !== null && c >= colorDifficulty ? null : c))
    );
  }, [colorDifficulty]);

  const numNull = countUnfilled(colors);
  const solved = colors.length === numPoints && numNull === 0;

  // show the counter briefly whenever progress changes, then fade it out
  useEffect(() => {
    setCounterVisible(true);
    clearTimeout(counterTimer.current);
    counterTimer.current = setTimeout(
      () => setCounterVisible(false),
      COUNTER_VISIBLE_MS
    );
    return () => clearTimeout(counterTimer.current);
  }, [numNull, boardKey]);

  const flashInvalid = useCallback((cellId) => {
    clearTimeout(invalidTimer.current);
    setInvalidId(cellId);
    invalidTimer.current = setTimeout(() => setInvalidId(null), 450);
  }, []);

  useEffect(() => () => clearTimeout(invalidTimer.current), []);

  const eraseCell = useCallback((cellId) => {
    setColors((prev) => {
      const next = [...prev];
      next[cellId] = null;
      return next;
    });
  }, []);

  const paintCell = useCallback(
    (cellId) => {
      if (selectedId === ERASER) {
        eraseCell(cellId);
        return;
      }
      if (!isLegalMove(colors, neighbors, cellId, selectedId)) {
        flashInvalid(cellId);
        return;
      }
      const next = [...colors];
      next[cellId] = selectedId;
      setColors(next);
      // record at the moment of the winning move, against the board actually
      // being played — never from an effect that can see a stale board
      if (countUnfilled(next) === 0) {
        recordDailySolve(selectedDate, mapDifficulty, colorDifficulty);
        setCompletionsVersion((n) => n + 1);
      }
    },
    [
      colors,
      neighbors,
      selectedId,
      selectedDate,
      mapDifficulty,
      colorDifficulty,
      eraseCell,
      flashInvalid,
    ]
  );

  // archive picker: any past date is a valid puzzle, the future never is
  const pickDate = (dateKey) => {
    const today = todayKey();
    setSelectedDate(dateKey > today ? today : dateKey);
  };

  const dailyDone =
    solved || isDailyComplete(selectedDate, mapDifficulty, colorDifficulty);
  const streak = currentStreak(mapDifficulty, colorDifficulty);

  return (
    <div className="color-grid">
      <div
        className="status"
        style={{
          "--c0": palette[0],
          "--c1": palette[1],
          "--c2": palette[2],
          "--c3": palette[3],
        }}
      >
        {[
          ...(isToday
            ? `Daily Puzzle · ${selectedDate}${dailyDone ? " ✓" : ""}`
            : `Archive · ${selectedDate}${dailyDone ? " ✓" : ""} · no streak`),
        ].map((char, i) => (
          <span key={i} style={{ animationDelay: `${-i * 0.15}s` }}>
            {char}
          </span>
        ))}
      </div>
      <div className="streaks">
        {MAP_ORDER.map((md) => {
          const s = currentStreak(md, colorDifficulty);
          return (
            <div
              key={md}
              className={`streak-badge ${s > 0 ? "" : "inactive"}`}
              title={`${MAP_NAME[md]} · ${colorDifficulty} colors · ${s}-day streak`}
            >
              <span className="streak-diff">{MAP_LETTER[md]}</span>
              <span className="streak-fire">
                🔥<span className="streak-color">{colorDifficulty}</span>
              </span>
              <span className="streak-count">{s}</span>
            </div>
          );
        })}
      </div>
      {victoryDismissed || !solved ? (
        <>
          <div className="board-wrap">
            <Voronoi
              cellCount={numPoints}
              voronoi={voronoi}
              colors={colors}
              palette={palette}
              invalidId={invalidId}
              onPaint={paintCell}
              onErase={eraseCell}
            />
            <div
              className={`counter ${solved ? "done" : ""} ${
                counterVisible ? "" : "hidden"
              }`}
            >
              {solved ? "✓" : numNull}
            </div>
          </div>
          {solved && (
            <ShareButton
              dateKey={selectedDate}
              mapDifficulty={mapDifficulty}
              colorDifficulty={colorDifficulty}
              streak={isToday ? streak : 0}
              voronoi={voronoi}
              cellCount={numPoints}
              colors={colors}
              paletteId={paletteId}
            />
          )}
        </>
      ) : (
        <VictoryMessage
          onDismiss={() => setVictoryDismissed(true)}
          dateKey={selectedDate}
          mapDifficulty={mapDifficulty}
          colorDifficulty={colorDifficulty}
          streak={isToday ? streak : 0}
          voronoi={voronoi}
          cellCount={numPoints}
          colors={colors}
          paletteId={paletteId}
        />
      )}
      <div className="button-grid">
        <button
          onClick={() => {
            setColors(Array(numPoints).fill(null));
            setVictoryDismissed(false);
          }}
        >
          Clear
        </button>
        <button onClick={() => setSelectedDate(todayKey())} disabled={isToday}>
          Today
        </button>
      </div>
      <div className="date-nav">
        <button
          className="date-arrow"
          aria-label="Previous day"
          onClick={() => setSelectedDate(shiftDateKey(selectedDate, -1))}
        >
          &lt;
        </button>
        <ArchivePicker selectedDate={selectedDate} onPick={pickDate} />
        <button
          className="date-arrow"
          aria-label="Next day"
          onClick={() => pickDate(shiftDateKey(selectedDate, 1))}
          disabled={isToday}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
