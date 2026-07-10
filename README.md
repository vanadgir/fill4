# Fill 4

Fill4 is a browser game that generates a blank Voronoi diagram for the player to fill in. Every day there is a new **Daily Puzzle** — the board is generated from a seed derived from the calendar date, so every player gets the same board, and no seed is ever reused. Difficulty settings allow for 4 - 6 color options and 15, 30, or 45 starting Voronoi cells, and every past day's puzzle is playable from the archive. Compatible with most devices, but best experience is on a desktop browser. It is currently hosted through Github Pages and can be played [here](https://www.varun.pro/fill4/).

## Motivation

Inspired by the [four color theorem](https://en.wikipedia.org/wiki/Four_color_theorem) in graph theory, this game challenges the player to four-color a randomly generated Voronoi diagram, i.e. two cells that share a side cannot be the same color. Coming from a math background, this project was a great way to work with a familiar concept while learning React. Here's an interesting question to consider - can all Voronoi diagrams be represented as planar graphs?

## How to Play

Pick a color from the palette, then tap a cell to fill it. A cell can never share a color with a neighbor — illegal moves flash red. Use the eraser block (or right-click a cell) to remove a color. Solve the Daily Puzzle each day to build a streak, tracked per difficulty combination. The date picker lets you play any past day's puzzle from the archive, but only solving today's puzzle counts toward your streak. Progress on any board you've started (including solved boards) is saved on your device and restored when you return to that day — hit Clear to wipe it.

## Game Options

There are a few alternate color sets to hopefully account for varying types of colorblindness. If you would like to suggest another color set, simply send me a message or submit an issue with the 6 hex codes and I will try and get it added!

## Contributing

If you are interested in tinkering with the app on your local machine, feel free to download the source code. To get started, you will need to:

```javascript
npm install
npm start
```

The core game logic (seeded board generation and rules) lives in `src/game/` as plain JavaScript with no React dependencies.
