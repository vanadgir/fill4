import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { BOARD_WIDTH, BOARD_HEIGHT } from "../game/board";

// output size of the shared image (logical space scaled down)
const SCALE = 0.6;
const FRAME_DELAY_MS = 1000;

// standalone SVG of just the solved board, no page chrome
function boardSvgString(voronoi, cellCount, colors, palette) {
  const cells = [];
  for (let i = 0; i < cellCount; i++) {
    const d = voronoi.renderCell(i);
    const fill = colors[i] == null ? "white" : palette[colors[i]];
    cells.push(
      `<path d="${d}" fill="${fill}" stroke="black" stroke-width="3"/>`
    );
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}">` +
    `<rect width="${BOARD_WIDTH}" height="${BOARD_HEIGHT}" fill="white"/>` +
    cells.join("") +
    `</svg>`
  );
}

async function rasterizeToCanvas(svgString, width, height) {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function rasterize(svgString, width, height) {
  const canvas = await rasterizeToCanvas(svgString, width, height);
  return canvas.getContext("2d").getImageData(0, 0, width, height);
}

// animated GIF of the solved board, one frame per color set, 1s per frame
export async function buildSolvedGif(voronoi, cellCount, colors, paletteSets) {
  const width = Math.round(BOARD_WIDTH * SCALE);
  const height = Math.round(BOARD_HEIGHT * SCALE);
  const gif = GIFEncoder();
  for (const set of paletteSets) {
    const svg = boardSvgString(voronoi, cellCount, colors, set);
    const { data } = await rasterize(svg, width, height);
    const gifPalette = quantize(data, 256);
    const index = applyPalette(data, gifPalette);
    gif.writeFrame(index, width, height, {
      palette: gifPalette,
      delay: FRAME_DELAY_MS,
    });
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: "image/gif" });
}

// static PNG of the solved board (a single palette), for clipboard targets
// that only accept image/* and can't take the animated GIF
export async function buildSolvedPng(voronoi, cellCount, colors, palette) {
  const width = Math.round(BOARD_WIDTH * SCALE);
  const height = Math.round(BOARD_HEIGHT * SCALE);
  const canvas = await rasterizeToCanvas(
    boardSvgString(voronoi, cellCount, colors, palette),
    width,
    height
  );
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
