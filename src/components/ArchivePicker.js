import { useState } from "react";
import { loadCompletions, solvesOn, todayKey } from "../game/daily";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MAP_NAME = { easy: "Easy", medium: "Medium", hard: "Hard" };
const MAP_RANK = { easy: 0, medium: 1, hard: 2 };

function dateKeyOf(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

function viewOf(dateKey) {
  return {
    year: Number(dateKey.slice(0, 4)),
    month: Number(dateKey.slice(5, 7)) - 1,
  };
}

// "Easy · 4, Medium · 5" — the difficulties/colors a date was solved with
function solvesLabel(solves) {
  return solves
    .slice()
    .sort(
      (a, b) =>
        MAP_RANK[a.mapDifficulty] - MAP_RANK[b.mapDifficulty] ||
        a.colorDifficulty - b.colorDifficulty
    )
    .map((s) => `${MAP_NAME[s.mapDifficulty]} · ${s.colorDifficulty}`)
    .join(", ");
}

export default function ArchivePicker({ selectedDate, onPick }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => viewOf(selectedDate));

  const toggle = () => {
    if (!open) {
      setView(viewOf(selectedDate));
    }
    setOpen(!open);
  };

  const shiftMonth = (delta) => {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const today = todayKey();
  const completions = open ? loadCompletions() : {};
  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div className="archive-picker">
      <button className="picker-toggle" onClick={toggle}>
        📅 {selectedDate}
      </button>
      {open && (
        <div className="calendar">
          <div className="cal-header">
            <button onClick={() => shiftMonth(-1)}>&lt;</button>
            <span>
              {MONTHS[view.month]} {view.year}
            </span>
            <button onClick={() => shiftMonth(1)}>&gt;</button>
          </div>
          <div className="cal-grid">
            {WEEKDAYS.map((w) => (
              <div key={w} className="cal-weekday">
                {w}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`blank${i}`} />;
              }
              const key = dateKeyOf(view.year, view.month, day);
              const future = key > today;
              const solves = solvesOn(completions, key);
              const completed = solves.length > 0;
              return (
                <button
                  key={key}
                  className={`cal-day ${future ? "future" : ""} ${
                    completed ? "completed" : ""
                  } ${key === selectedDate ? "selected" : ""}`}
                  disabled={future}
                  title={completed ? `Solved: ${solvesLabel(solves)}` : undefined}
                  onClick={() => {
                    onPick(key);
                    setOpen(false);
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
