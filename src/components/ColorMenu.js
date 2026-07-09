import { usePalette, ERASER } from "../contexts/PaletteContext";

export default function ColorMenu() {
  const { palette, selectedId, selectColor, nextSet, prevSet } = usePalette();

  return (
    <div className="color-menu">
      <div className="left-arrow">
        <button className="set-button" onClick={prevSet}>
          &lt;--
        </button>
      </div>
      <div className="palette">
        {palette.map((color, i) => (
          <div
            key={i}
            className={`block ${selectedId === i ? "selected" : ""}`}
            style={{ backgroundColor: color }}
            onClick={() => selectColor(i)}
          ></div>
        ))}
        <div
          className={`block eraser ${selectedId === ERASER ? "selected" : ""}`}
          title="Eraser — or right-click a cell"
          onClick={() => selectColor(ERASER)}
        ></div>
      </div>
      <div className="right-arrow">
        <button className="set-button" onClick={nextSet}>
          --&gt;
        </button>
      </div>
    </div>
  );
}
