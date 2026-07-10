import winstar from "../images/winstar.jpg";
import ShareButton from "./ShareButton";

export default function VictoryMessage({
  onDismiss,
  dateKey,
  mapDifficulty,
  colorDifficulty,
  streak,
  voronoi,
  cellCount,
  colors,
  paletteId,
}) {
  return (
    <div className="victory">
      <div className="dismiss" onClick={onDismiss}>
        X
      </div>
      <img src={winstar} alt="victory" className="winstar" />
      <ShareButton
        dateKey={dateKey}
        mapDifficulty={mapDifficulty}
        colorDifficulty={colorDifficulty}
        streak={streak}
        voronoi={voronoi}
        cellCount={cellCount}
        colors={colors}
        paletteId={paletteId}
      />
    </div>
  );
}
