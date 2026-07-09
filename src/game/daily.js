// Daily puzzle seeds, completion tracking, and streaks.
// Seeds embed the full calendar date, so every day gets a fresh seed and no
// seed is ever reused. Map difficulty changes the board, so it is part of the
// seed; color count only changes the palette, so it is not.
// Dates use local system time, so the daily rolls over at the player's own
// midnight (same convention the Unity port should follow).

const COMPLETIONS_KEY = "fill4-daily-completions";
const STREAKS_KEY = "fill4-daily-streaks";

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function yesterdayKey(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

export function dailySeed(dateKey, mapDifficulty) {
  return `fill4:${dateKey}:${mapDifficulty}`;
}

function completionKey(dateKey, mapDifficulty, colorDifficulty) {
  return `${dateKey}:${mapDifficulty}:${colorDifficulty}`;
}

function settingsKey(mapDifficulty, colorDifficulty) {
  return `${mapDifficulty}:${colorDifficulty}`;
}

function loadJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (e.g. private browsing) — play on without saving
  }
}

export function isDailyComplete(dateKey, mapDifficulty, colorDifficulty) {
  return Boolean(
    loadJson(COMPLETIONS_KEY)[
      completionKey(dateKey, mapDifficulty, colorDifficulty)
    ]
  );
}

// Records a solve for any date. The streak only advances when the solved
// puzzle is actually today's — archive solves never count toward it.
export function recordDailySolve(
  dateKey,
  mapDifficulty,
  colorDifficulty,
  today = new Date()
) {
  const completions = loadJson(COMPLETIONS_KEY);
  completions[completionKey(dateKey, mapDifficulty, colorDifficulty)] = true;
  saveJson(COMPLETIONS_KEY, completions);

  if (dateKey !== todayKey(today)) return;

  const streaks = loadJson(STREAKS_KEY);
  const entry = streaks[settingsKey(mapDifficulty, colorDifficulty)];
  if (entry && entry.lastDate === dateKey) return; // already counted today
  const count =
    entry && entry.lastDate === yesterdayKey(today) ? entry.count + 1 : 1;
  streaks[settingsKey(mapDifficulty, colorDifficulty)] = {
    lastDate: dateKey,
    count,
  };
  saveJson(STREAKS_KEY, streaks);
}

// the streak is alive if the last counted solve was today or yesterday
export function currentStreak(mapDifficulty, colorDifficulty, today = new Date()) {
  const entry = loadJson(STREAKS_KEY)[settingsKey(mapDifficulty, colorDifficulty)];
  if (!entry) return 0;
  if (
    entry.lastDate === todayKey(today) ||
    entry.lastDate === yesterdayKey(today)
  ) {
    return entry.count;
  }
  return 0;
}
