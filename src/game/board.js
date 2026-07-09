import { Delaunay } from "d3";
import { createRng } from "./rng";

// Boards are generated in a fixed logical coordinate space and scaled to the
// screen with an SVG viewBox. This keeps the board (and cell adjacency)
// independent of window size, which a shared daily puzzle requires.
export const BOARD_WIDTH = 1000;
export const BOARD_HEIGHT = 700;

// Board generation is deterministic per seed string. The Unity port must
// reproduce the RNG and this exact generation order to share daily puzzles.
export function createBoard(seedString, numPoints) {
  const rng = createRng(seedString);
  const points = [];
  const seen = new Set();
  while (points.length < numPoints) {
    const x = Math.floor(rng() * (BOARD_WIDTH + 1));
    const y = Math.floor(rng() * (BOARD_HEIGHT + 1));
    const key = `${x},${y}`;
    if (!seen.has(key)) {
      seen.add(key);
      points.push([x, y]);
    }
  }
  const delaunay = Delaunay.from(points);
  const voronoi = delaunay.voronoi([0, 0, BOARD_WIDTH, BOARD_HEIGHT]);
  const neighbors = points.map((_, i) => [...voronoi.neighbors(i)]);
  return { points, voronoi, neighbors };
}

// The one rule of the game: a cell may not share a color with any neighbor.
export function isLegalMove(colors, neighbors, cellId, colorId) {
  return neighbors[cellId].every((n) => colors[n] !== colorId);
}

export function countUnfilled(colors) {
  return colors.reduce((acc, c) => (c === null ? acc + 1 : acc), 0);
}

export function isSolved(colors) {
  return colors.length > 0 && countUnfilled(colors) === 0;
}
