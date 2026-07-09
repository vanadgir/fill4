import { useDifficulty } from "./contexts/DifficultyContext";
import { PaletteProvider } from "./contexts/PaletteContext";
import GameBoard from "./components/GameBoard";
import ColorMenu from "./components/ColorMenu";
import GameRules from "./components/GameRules";
import "./App.css";
import { useState } from "react";

export default function App() {
  const { selectMapDifficulty, selectColorDifficulty } = useDifficulty();

  const [collapseTitle, setCollapseTitle] = useState(false);

  const toggleTitle = () => {
    setCollapseTitle(!collapseTitle);
  };

  const title = (
    <h1 className={`title ${collapseTitle ? "collapsed" : ""}`}>
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

  const mapDifficultySelector = (
    <select id="map-difficulty" onChange={mapDiff}>
      <option value="easy">Easy</option>
      <option value="medium">Medium</option>
      <option value="hard">Hard</option>
    </select>
  );

  const colorDifficultySelector = (
    <select id="color-difficulty" onChange={colorDiff}>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
    </select>
  );

  return (
    <div className="main">
      <div onClick={toggleTitle} className="title-bar">
        {title}
      </div>
      <PaletteProvider>
        <div className="game-bar">
          <div className={`left ${collapseTitle ? "hide" : ""}`}>
            {mapDifficultySelector}
          </div>
          <ColorMenu />
          <div className={`right ${collapseTitle ? "hide" : ""}`}>
            {colorDifficultySelector}
          </div>
        </div>
        <GameBoard />
      </PaletteProvider>
      <GameRules />
    </div>
  );
}
