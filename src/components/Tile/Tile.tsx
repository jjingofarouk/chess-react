import "./Tile.css";
import clsx from "clsx"; // Optional: Install with `npm install clsx`
import { memo } from "react";

interface Props {
  image?: string;
  number: number;
  highlight: boolean;
  showCoordinates?: boolean; // Optional: For debugging or user toggle
}

function Tile({ number, image, highlight, showCoordinates = false }: Props) {
  const isBlackTile = number % 2 === 0;
  const coordinates = `${String.fromCharCode(97 + (number % 8))}${8 - Math.floor(number / 8)}`; // e.g., "a8"

  const tileClasses = clsx("tile", {
    "black-tile": isBlackTile,
    "white-tile": !isBlackTile,
    "tile-highlight": highlight,
    "chess-piece-tile": !!image,
  });

  return (
    <div
      className={tileClasses}
      role="gridcell" // Accessibility: Indicates this is a cell in a grid
      aria-label={image ? `Chess piece at ${coordinates}` : `Empty square at ${coordinates}`} // Accessibility
    >
      {image && <div className="chess-piece" style={{ backgroundImage: `url(${image})` }} />}
      {showCoordinates && (
        <span className="tile-coordinate">{coordinates}</span> // Optional coordinate display
      )}
    </div>
  );
}

export default memo(Tile); // Memoize to prevent unnecessary re-renders