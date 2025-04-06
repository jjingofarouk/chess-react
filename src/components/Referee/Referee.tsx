import { useEffect, useRef, useState } from "react";
import { initialBoard } from "../../Constants";
import { Piece, Position } from "../../models";
import { Board } from "../../models/Board";
import { Pawn } from "../../models/Pawn";
import { PieceType, TeamType } from "../../Types";
import Chessboard from "../Chessboard/Chessboard";
import { Howl } from "howler";
import "./Referee.css";

// Sound effects
const moveSound = new Howl({ src: ["/sounds/move-self.mp3"] });
const captureSound = new Howl({ src: ["/sounds/capture.mp3"] });
const checkSound = new Howl({ src: ["/sounds/move-check.mp3"] });
const promotionSound = new Howl({ src: ["/sounds/promote.mp3"] });

interface MoveHistory {
  piece: Piece;
  from: Position;
  to: Position;
  captured?: Piece;
}

export default function Referee() {
  const [board, setBoard] = useState<Board>(initialBoard.clone());
  const [moveHistory, setMoveHistory] = useState<MoveHistory[]>([]);
  const [promotionPawn, setPromotionPawn] = useState<Piece | undefined>();
  const [isMuted, setIsMuted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const checkmateModalRef = useRef<HTMLDivElement>(null);
  const [gameOverMessage, setGameOverMessage] = useState<string>("");

  useEffect(() => {
    setBoard((prevBoard) => {
      const newBoard = prevBoard.clone();
      newBoard.calculateAllMoves();
      return newBoard;
    });
  }, []);

  function playMove(playedPiece: Piece, destination: Position): boolean {
    if (playedPiece.possibleMoves?.length === 0) return false;

    const isWhiteTurn = board.totalTurns % 2 === 1;
    if (playedPiece.team === TeamType.OUR && !isWhiteTurn) return false;
    if (playedPiece.team === TeamType.OPPONENT && isWhiteTurn) return false;

    const validMove = playedPiece.possibleMoves?.some((m) => m.samePosition(destination));
    if (!validMove) return false;

    let capturedPiece: Piece | undefined;

    setBoard((prevBoard) => {
      const clonedBoard = prevBoard.clone();
      capturedPiece = clonedBoard.getPieces().find((p) => p.samePosition(destination));
      const moveResult = clonedBoard.playMove(playedPiece, destination);
      if (!moveResult) return prevBoard;

      setMoveHistory((prev) => [
        ...prev,
        { piece: playedPiece.clone(), from: playedPiece.position.clone(), to: destination.clone(), captured: capturedPiece },
      ]);

      if (!isMuted) {
        if (capturedPiece) captureSound.play();
        else if (clonedBoard.currentGameState === GameState.CHECKMATE) checkSound.play();
        else moveSound.play();
      }

      if (clonedBoard.winningTeamResult !== null) {
        setGameOverMessage(`Checkmate! ${clonedBoard.winningTeamResult === TeamType.OUR ? "White" : "Black"} wins!`);
        checkmateModalRef.current?.classList.remove("hidden");
        if (!isMuted) checkSound.play();
      } else if (clonedBoard.currentGameState === GameState.STALEMATE) {
        setGameOverMessage("Stalemate! The game is a draw.");
        checkmateModalRef.current?.classList.remove("hidden");
      }

      return clonedBoard;
    });

    const promotionRow = playedPiece.team === TeamType.OUR ? 7 : 0;
    if (destination.y === promotionRow && playedPiece.type === PieceType.PAWN) {
      modalRef.current?.classList.remove("hidden");
      setPromotionPawn(playedPiece.clone());
      if (!isMuted) promotionSound.play();
    }

    return true;
  }

  function promotePawn(pieceType: PieceType) {
    if (!promotionPawn) return;

    setBoard((prevBoard) => {
      const clonedBoard = prevBoard.clone();
      const moveResult = clonedBoard.playMove(promotionPawn, promotionPawn.position, pieceType);
      if (moveResult) {
        clonedBoard.calculateAllMoves();
      }
      return clonedBoard;
    });

    modalRef.current?.classList.add("hidden");
    setPromotionPawn(undefined);
  }

  function undoLastMove() {
    if (moveHistory.length === 0) return;

    setBoard((prevBoard) => {
      const clonedBoard = prevBoard.clone();
      const lastMove = moveHistory[moveHistory.length - 1];
      const pieceToRevert = clonedBoard.getPieces().find((p) => p.samePosition(lastMove.to));
      if (pieceToRevert) {
        pieceToRevert.position = lastMove.from.clone();
        if (lastMove.captured) {
          clonedBoard.getPieces().push(lastMove.captured.clone());
        }
      }
      clonedBoard.calculateAllMoves();
      return clonedBoard;
    });

    setMoveHistory((prev) => prev.slice(0, -1));
  }

  function restartGame() {
    checkmateModalRef.current?.classList.add("hidden");
    setBoard(initialBoard.clone());
    setMoveHistory([]);
    setGameOverMessage("");
  }

  function toggleSound() {
    setIsMuted((prev) => !prev);
  }

  return (
    <div className="referee-container">
      <div className="game-info">
        <p>Total turns: {board.totalTurns}</p>
        <button onClick={undoLastMove} disabled={moveHistory.length === 0}>Undo Move</button>
        <button onClick={toggleSound}>{isMuted ? "Unmute" : "Mute"}</button>
      </div>

      <div className="modal hidden" ref={modalRef} role="dialog" aria-label="Pawn Promotion">
        <div className="modal-body">
          <button onClick={() => promotePawn(PieceType.QUEEN)} aria-label="Promote to Queen">
            <img src={`/assets/images/queen_${promotionPawn?.team === TeamType.OUR ? "w" : "b"}.png`} alt="Queen" />
          </button>
          <button onClick={() => promotePawn(PieceType.ROOK)} aria-label="Promote to Rook">
            <img src={`/assets/images/rook_${promotionPawn?.team === TeamType.OUR ? "w" : "b"}.png`} alt="Rook" />
          </button>
          <button onClick={() => promotePawn(PieceType.BISHOP)} aria-label="Promote to Bishop">
            <img src={`/assets/images/bishop_${promotionPawn?.team === TeamType.OUR ? "w" : "b"}.png`} alt="Bishop" />
          </button>
          <button onClick={() => promotePawn(PieceType.KNIGHT)} aria-label="Promote to Knight">
            <img src={`/assets/images/knight_${promotionPawn?.team === TeamType.OUR ? "w" : "b"}.png`} alt="Knight" />
          </button>
        </div>
      </div>

      <div className="modal hidden" ref={checkmateModalRef} role="dialog" aria-label="Game Over">
        <div className="modal-body">
          <div className="game-over-body">
            <span>{gameOverMessage}</span>
            <button onClick={restartGame}>Play Again</button>
          </div>
        </div>
      </div>

      <Chessboard playMove={playMove} pieces={board.getPieces()} />
    </div>
  );
}