import { useCallback, useEffect, useRef, useState } from "react";
import { colorSets } from "../contexts/PaletteContext";
import { buildSolvedGif, buildSolvedPng, blobToDataUrl } from "../utils/shareGif";

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// how long the confirmation label lingers before reverting to "Share Result"
const STATUS_RESET_MS = 1500;

export default function ShareButton({
  dateKey,
  mapDifficulty,
  colorDifficulty,
  streak,
  voronoi,
  cellCount,
  colors,
  paletteId,
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const resetTimer = useRef(null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  // show a confirmation label, then revert to the default after a beat
  const flashStatus = useCallback((message) => {
    setStatus(message);
    clearTimeout(resetTimer.current);
    if (message) {
      resetTimer.current = setTimeout(() => setStatus(""), STATUS_RESET_MS);
    }
  }, []);

  const shareText =
    `Fill4 Daily ${dateKey} - solved on ${mapDifficulty} with ${colorDifficulty} colors!` +
    (streak > 1 ? ` 🔥 ${streak} day streak` : "");

  const downloadGif = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fill4-${dateKey}.gif`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareResult = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // start the animation on the palette the player actually used, then
      // cycle the rest
      const orderedSets = [
        ...colorSets.slice(paletteId),
        ...colorSets.slice(0, paletteId),
      ];
      const gifBlob = await buildSolvedGif(
        voronoi,
        cellCount,
        colors,
        orderedSets
      );
      const gifFile = new File([gifBlob], `fill4-${dateKey}.gif`, {
        type: "image/gif",
      });

      // mobile: native share sheet carries text + animated gif together
      if (
        navigator.canShare &&
        navigator.canShare({ files: [gifFile], text: shareText })
      ) {
        await navigator.share({ files: [gifFile], text: shareText });
        flashStatus("Shared!");
        return;
      }

      // desktop: one rich clipboard entry with the text and the board image.
      // The gif is embedded in the HTML flavor (animates in rich targets);
      // a static PNG flavor covers targets that only accept a plain image.
      const pngBlob = await buildSolvedPng(
        voronoi,
        cellCount,
        colors,
        colorSets[paletteId]
      );
      const gifDataUrl = await blobToDataUrl(gifBlob);
      const html =
        `<div>${escapeHtml(shareText)}<br>` +
        `<img alt="Fill4 solved board" src="${gifDataUrl}"></div>`;

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([shareText], { type: "text/plain" }),
            "text/html": new Blob([html], { type: "text/html" }),
            "image/png": pngBlob,
          }),
        ]);
        flashStatus("Copied to clipboard");
      } catch {
        // clipboard blocked or unsupported — copy the text, save the gif
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText).catch(() => {});
        }
        downloadGif(gifBlob);
        flashStatus("Text copied, GIF saved");
      }
    } catch (err) {
      // user dismissing the share sheet is not a failure
      flashStatus(err && err.name === "AbortError" ? "" : "Share failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className="share" onClick={shareResult} disabled={busy}>
      {busy ? "Preparing…" : status || "Share Result"}
    </button>
  );
}
