import { useEffect, useState } from "react";
import { BOARD_WIDTH, BOARD_HEIGHT } from "../game/board";

// The logical board is always 1000x700 landscape (determinism contract) —
// portrait screens display the same board rotated 90°, so every player
// still plays the identical daily regardless of orientation.
function usePortrait() {
  const [portrait, setPortrait] = useState(
    () => window.matchMedia("(orientation: portrait)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const onChange = (e) => setPortrait(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return portrait;
}

export default function Voronoi({
  cellCount,
  voronoi,
  colors,
  palette,
  invalidId,
  onPaint,
  onErase,
}) {
  const portrait = usePortrait();

  const viewBox = portrait
    ? `0 0 ${BOARD_HEIGHT} ${BOARD_WIDTH}`
    : `0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`;
  // rotate(90) maps (x,y) -> (-y,x); the translate shifts it back on-screen
  const rotation = portrait
    ? `translate(${BOARD_HEIGHT} 0) rotate(90)`
    : undefined;

  return (
    <div className="voronoi">
      <svg viewBox={viewBox}>
        <g transform={rotation}>
          {Array.from({ length: cellCount }, (_, i) => {
            const colorId = colors[i];
            return (
              <path
                key={i}
                d={voronoi.renderCell(i)}
                className={invalidId === i ? "cell invalid" : "cell"}
                stroke="black"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                fill={colorId == null ? "white" : palette[colorId]}
                onClick={() => onPaint(i)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onErase(i);
                }}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
