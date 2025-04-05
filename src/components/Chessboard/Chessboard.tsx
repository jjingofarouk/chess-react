import { useRef, useState } from "react";
import "./Chessboard.css";
import Tile from "../Tile/Tile";
import { VERTICAL_AXIS, HORIZONTAL_AXIS } from "../../Constants";
import { Piece, Position } from "../../models";

interface Props {
  playMove: (piece: Piece, position: Position) => boolean;
  pieces: Piece[];
}

export default function Chessboard({ playMove, pieces }: Props) {
  const [activePiece, setActivePiece] = useState<HTMLElement | null>(null);
  const [grabPosition, setGrabPosition] = useState<Position>(new Position(-1, -1));
  const chessboardRef = useRef<HTMLDivElement>(null);

  // Unified event handler for grabbing a piece (mouse or touch)
  function grabPiece(e: React.MouseEvent | React.TouchEvent) {
    const element = e.target as HTMLElement;
    const chessboard = chessboardRef.current;
    if (!element.classList.contains("chess-piece") || !chessboard) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const tileSize = chessboard.clientWidth / 8; // Dynamic tile size
    const grabX = Math.floor((clientX - chessboard.offsetLeft) / tileSize);
    const grabY = Math.floor((chessboard.offsetTop + chessboard.clientHeight - clientY) / tileSize);
    setGrabPosition(new Position(grabX, grabY));

    const x = clientX - tileSize / 2 - chessboard.offsetLeft;
    const y = clientY - tileSize / 2 - chessboard.offsetTop;
    element.style.position = "absolute";
    element.style.zIndex = "100"; // Bring piece to front
    element.style.transform = `translate(${x}px, ${y}px)`; // Use transforms for smooth movement
    element.classList.add("dragging"); // Disable transition during drag
    setActivePiece(element);
  }

  // Unified event handler for moving a piece
  function movePiece(e: React.MouseEvent | React.TouchEvent) {
    const chessboard = chessboardRef.current;
    if (!activePiece || !chessboard) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const tileSize = chessboard.clientWidth / 8;
    const minX = 0; // Relative to chessboard
    const minY = 0;
    const maxX = chessboard.clientWidth - tileSize;
    const maxY = chessboard.clientHeight - tileSize;

    const x = Math.max(minX, Math.min(maxX, clientX - chessboard.offsetLeft - tileSize / 2));
    const y = Math.max(minY, Math.min(maxY, clientY - chessboard.offsetTop - tileSize / 2));

    activePiece.style.transform = `translate(${x}px, ${y}px)`;
  }

  // Unified event handler for dropping a piece
  function dropPiece(e: React.MouseEvent | React.TouchEvent) {
    const chessboard = chessboardRef.current;
    if (!activePiece || !chessboard) return;

    const clientX = "changedTouches" in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = "changedTouches" in e ? e.changedTouches[0].clientY : e.clientY;

    const tileSize = chessboard.clientWidth / 8;
    const x = Math.floor((clientX - chessboard.offsetLeft) / tileSize);
    const y = Math.floor((chessboard.offsetTop + chessboard.clientHeight - clientY) / tileSize);

    const currentPiece = pieces.find((p) => p.samePosition(grabPosition));
    if (currentPiece) {
      const success = playMove(currentPiece.clone(), new Position(x, y));
      if (!success) {
        activePiece.style.position = "relative";
        activePiece.style.transform = "translate(0, 0)"; // Reset to original position
        activePiece.style.removeProperty("z-index");
      }
    }
    activePiece.classList.remove("dragging");
    setActivePiece(null);
  }

  // Prevent default touch behavior (e.g., scrolling)
  const preventTouchDefault = (e: React.TouchEvent) => e.preventDefault();

  // Build the board
  let board = [];
  for (let j = VERTICAL_AXIS.length - 1; j >= 0; j--) {
    for (let i = 0; i < HORIZONTAL_AXIS.length; i++) {
      const number = j + i + 2;
      const piece = pieces.find((p) => p.samePosition(new Position(i, j)));
      const image = piece ? piece.image : undefined;

      const currentPiece = activePiece ? pieces.find((p) => p.samePosition(grabPosition)) : undefined;
      const highlight = currentPiece?.possibleMoves?.some((p) => p.samePosition(new Position(i, j))) || false;

      board.push(<Tile key={`${j},${i}`} image={image} number={number} highlight={highlight} />);
    }
  }

  return (
    <div id="chessboard-container">
      <div
        onMouseDown={grabPiece}
        onMouseMove={movePiece}
        onMouseUp={dropPiece}
        onTouchStart={grabPiece}
        onTouchMove={(e) => {
          preventTouchDefault(e);
          movePiece(e);
        }}
        onTouchEnd={(e) => {
          preventTouchDefault(e);
          dropPiece(e);
        }}
        id="chessboard"
        ref={chessboardRef}
      >
        {board}
      </div>
    </div>
  );
}