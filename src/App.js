import { useDifficulty } from "./contexts/DifficultyContext";
import { PaletteProvider } from "./contexts/PaletteContext";
import GameBoard from "./components/GameBoard";
import ColorMenu from "./components/ColorMenu";
import GameRules from "./components/GameRules";
import "./App.css";

export default function App() {
  const { selectMapDifficulty, selectColorDifficulty } = useDifficulty();

  const title = (
    <h1 className="title">
      <span>&nbsp;F&nbsp;</span>
      <span>&nbsp;I&nbsp;</span>
      <span>&nbsp;L&nbsp;</span>
      <span>&nbsp;L&nbsp;</span>
      <span>&nbsp;4&nbsp;</span>
    </h1>
  );

  const mapDiff = (event) => {
    selectMapDifficulty(event.target.value);
  };

  const colorDiff = (event) => {
    selectColorDifficulty(parseInt(event.target.value));
  };

  return (
    <div className="main">
      <div className="title-bar">{title}</div>
      <PaletteProvider>
        <div className="game-bar">
          <label className="field">
            <span>Game</span>
            <select id="map-difficulty" onChange={mapDiff}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className="field">
            <span>Colors</span>
            <select id="color-difficulty" onChange={colorDiff}>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </label>
        </div>
        <ColorMenu />
        <GameBoard />
      </PaletteProvider>
      <GameRules />
    </div>
  );
}
