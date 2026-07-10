import {
  useContext,
  createContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useDifficulty } from "./DifficultyContext";

// sentinel selection id for the eraser tool
export const ERASER = -1;

// colorset data (exported for the share GIF, which cycles every set)
export const colorSets = [
  [
    "#FF5733", // vivid orange
    "#41EAD4", // teal
    "#F1C40F", // bright yellow
    "#9B59B6", // deep purple
    "#FF8C00", // dark orange
    "#2ECC71", // emerald green
  ],
  [
    "#F4D03F", // goldenrod
    "#8E44AD", // dark violet
    "#7F8C8D", // grayish blue
    "#2ECC71", // emerald green
    "#F39C12", // orange
    "#3498DB", // vibrant blue
  ],
  [
    "#7F8C8D", // grayish blue
    "#2ECC71", // emerald green
    "#F39C12", // orange
    "#8E44AD", // purple
    "#FF5733", // vivid orange
    "#FFC300", // vibrant yellow
  ],
  [
    "#16A085", // dark green
    "#F1C40F", // yellow
    "#3498DB", // dark blue
    "#D35400", // dark orange
    "#7F8C8D", // grayish blue
    "#E74C3C", // red
  ],
  [
    "#2980B9", // blue
    "#E74C3C", // red
    "#2C3E50", // dark slate
    "#F39C12", // yellow
    "#9B59B6", // deep purple
    "#27AE60", // bright green
  ],
  [
    "#CCCCCC", // light grey
    "#999999", // medium grey
    "#666666", // medium grey
    "#333333", // dark grey
    "#1A1A1A", // charcoal grey
    "#000000", // dark black
  ],
];

// information that context holds
export const PaletteContext = createContext({
  palette: [],
  selectedId: 0,
  selectColor: () => {},
  nextSet: () => {},
  prevSet: () => {},
});

// define provider
export function PaletteProvider({ children }) {
  const [paletteId, setPaletteId] = useState(0);
  const [selectedId, setSelectedId] = useState(0);

  const { colorDifficulty } = useDifficulty();

  const nextSet = useCallback(() => {
    setPaletteId((id) => (id + 1) % colorSets.length);
  }, []);

  const prevSet = useCallback(() => {
    setPaletteId((id) => (id - 1 + colorSets.length) % colorSets.length);
  }, []);

  const palette = useMemo(
    () => colorSets[paletteId].slice(0, colorDifficulty),
    [paletteId, colorDifficulty]
  );

  const selectColor = useCallback((colorId) => {
    setSelectedId(colorId);
  }, []);

  // if the palette shrinks below the current selection, clamp it
  useEffect(() => {
    if (selectedId !== ERASER && selectedId >= colorDifficulty) {
      setSelectedId(colorDifficulty - 1);
    }
  }, [colorDifficulty, selectedId]);

  return (
    <PaletteContext.Provider
      value={{ palette, paletteId, selectedId, selectColor, nextSet, prevSet }}
    >
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  return useContext(PaletteContext);
}
