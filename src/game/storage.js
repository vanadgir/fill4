// Per-board coloring persistence, keyed by seed (the seed already encodes
// date + map difficulty). A board with at least one painted cell is always
// stored; an all-blank board is removed, so storage only holds real progress.

const BOARDS_KEY = "fill4-boards";

function loadAll() {
  try {
    const v = JSON.parse(localStorage.getItem(BOARDS_KEY));
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

function saveAll(boards) {
  try {
    localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
  } catch {
    // localStorage unavailable — play on without saving
  }
}

// returns a sanitized colors array, or null if nothing usable is stored
export function loadSavedBoard(seed, numPoints, colorDifficulty) {
  const saved = loadAll()[seed];
  if (!Array.isArray(saved) || saved.length !== numPoints) {
    return null;
  }
  return saved.map((c) =>
    Number.isInteger(c) && c >= 0 && c < colorDifficulty ? c : null
  );
}

export function saveBoard(seed, colors) {
  const boards = loadAll();
  boards[seed] = colors;
  saveAll(boards);
}

export function removeSavedBoard(seed) {
  const boards = loadAll();
  if (seed in boards) {
    delete boards[seed];
    saveAll(boards);
  }
}
