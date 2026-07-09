import { useState } from "react";
import winstar from "../images/winstar.jpg";

export default function VictoryMessage({
  onDismiss,
  dateKey,
  mapDifficulty,
  colorDifficulty,
  streak,
}) {
  const [copied, setCopied] = useState(false);

  const shareText =
    `Fill4 Daily ${dateKey} — solved on ${mapDifficulty} with ${colorDifficulty} colors!` +
    (streak > 1 ? ` 🔥 ${streak} day streak` : "");

  const copyResult = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(shareText)
        .then(() => setCopied(true))
        .catch(() => {});
    }
  };

  return (
    <div className="victory">
      <div className="dismiss" onClick={onDismiss}>
        X
      </div>
      <img src={winstar} alt="victory" className="winstar" />
      <button className="share" onClick={copyResult}>
        {copied ? "Copied!" : "Share Result"}
      </button>
    </div>
  );
}
