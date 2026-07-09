import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDifficulty } from "../contexts/DifficultyContext";
import { usePalette, ERASER } from "../contexts/PaletteContext";
import { createBoard, countUnfilled, isLegalMove } from "../game/board";
import {
  currentStreak,
  dailySeed,
  isDailyComplete,
  recordDailySolve,
  todayKey,
} from "../game/daily";
import ArchivePicker from "./ArchivePicker";
import Voronoi from "./Voronoi";
import VictoryMessage from "./VictoryMessage";

export default function ColoringGrid() {
  const { mapDifficulty, numPoints, colorDifficulty } = useDifficulty();
  const { palette, selectedId } = usePalette();

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
  // the only mutable game state
  const [colors, setColors] = useState(() => Array(numPoints).fill(null));
  const [victoryDismissed, setVictoryDismissed] = useState(false);
  const [invalidId, setInvalidId] = useState(null);
  const [, setCompletionsVersion] = useState(0);
  const invalidTimer = useRef(null);

  // reset during render when the board changes, so no frame ever shows (or
  // records) old colors against new geometry
  const boardKey = `${seed}:${numPoints}`;
  const [prevBoardKey, setPrevBoardKey] = useState(boardKey);
  if (boardKey !== prevBoardKey) {
    setPrevBoardKey(boardKey);
    setColors(Array(numPoints).fill(null));
    setVictoryDismissed(false);
    setInvalidId(null);
  }

  // shrinking the palette clears only the cells whose color no longer exists
  useEffect(() => {
    setColors((prev) =>
      prev.map((c) => (c !== null && c >= colorDifficulty ? null : c))
    );
  }, [colorDifficulty]);

  const numNull = countUnfilled(colors);
  const solved = colors.length === numPoints && numNull === 0;

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
            ? `Daily Puzzle · ${selectedDate}${dailyDone ? " ✓" : ""}${
                streak > 0 ? ` · 🔥 ${streak}` : ""
              }`
            : `Archive · ${selectedDate}${dailyDone ? " ✓" : ""} · no streak`),
        ].map((char, i) => (
          <span key={i} style={{ animationDelay: `${-i * 0.15}s` }}>
            {char}
          </span>
        ))}
      </div>
      {victoryDismissed || !solved ? (
        <>
          <Voronoi
            cellCount={numPoints}
            voronoi={voronoi}
            colors={colors}
            palette={palette}
            invalidId={invalidId}
            onPaint={paintCell}
            onErase={eraseCell}
          />
          <div className="score">
            {numNull > 0 ? `${numNull} to go!` : "Great Job!"}
          </div>
        </>
      ) : (
        <VictoryMessage
          onDismiss={() => setVictoryDismissed(true)}
          dateKey={selectedDate}
          mapDifficulty={mapDifficulty}
          colorDifficulty={colorDifficulty}
          streak={isToday ? streak : 0}
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
        <ArchivePicker selectedDate={selectedDate} onPick={pickDate} />
      </div>
    </div>
  );
}
