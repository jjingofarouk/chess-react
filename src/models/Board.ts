import {
  getPossibleBishopMoves,
  getPossibleKingMoves,
  getPossibleKnightMoves,
  getPossiblePawnMoves,
  getPossibleQueenMoves,
  getPossibleRookMoves,
  getCastlingMoves,
} from "../referee/rules";
import { PieceType, TeamType } from "../Types";
import { Pawn } from "./Pawn";
import { Piece } from "./Piece";
import { Position } from "./Position";

// Enum for game state to track end conditions
enum GameState {
  ONGOING,
  CHECKMATE,
  STALEMATE,
  DRAW,
}

export class Board {
  private pieces: Piece[];
  private totalTurns: number;
  private gameState: GameState = GameState.ONGOING;
  private winningTeam: TeamType | null = null;
  private moveHistory: { from: Position; to: Position; captured?: Piece }[] = []; // For draw detection
  private fiftyMoveCounter: number = 0; // For 50-move rule

  constructor(pieces: Piece[], totalTurns: number = 0) {
    this.pieces = pieces.map((p) => p.clone()); // Deep copy to avoid mutation
    this.totalTurns = totalTurns;
    this.initializeBoard();
  }

  get currentTeam(): TeamType {
    return this.totalTurns % 2 === 0 ? TeamType.OPPONENT : TeamType.OUR;
  }

  get currentGameState(): GameState {
    return this.gameState;
  }

  get winningTeamResult(): TeamType | null {
    return this.winningTeam;
  }

  /** Initializes the board and validates its state */
  private initializeBoard() {
  const whiteKings = this.pieces.filter((p) => p.isKing && p.team === TeamType.OUR);
  const blackKings = this.pieces.filter((p) => p.isKing && p.team === TeamType.OPPONENT);
  console.log("White kings:", whiteKings.length, whiteKings);
  console.log("Black kings:", blackKings.length, blackKings);
  if (whiteKings.length !== 1 || blackKings.length !== 1) {
    throw new Error("Invalid board: Must have exactly one king per team.");
  }
}

  /** Calculates all legal moves for the current team */
  calculateAllMoves(): void {
    if (this.gameState !== GameState.ONGOING) return;

    const currentTeamPieces = this.pieces.filter((p) => p.team === this.currentTeam);
    const opponentPieces = this.pieces.filter((p) => p.team !== this.currentTeam);

    // Step 1: Generate raw possible moves
    for (const piece of currentTeamPieces) {
      piece.possibleMoves = this.getValidMoves(piece, this.pieces);
    }

    // Step 2: Add castling moves
    const king = currentTeamPieces.find((p) => p.isKing);
    if (king && !king.hasMoved) {
      king.possibleMoves = [...(king.possibleMoves || []), ...getCastlingMoves(king, this.pieces)];
    }

    // Step 3: Filter out illegal moves (king in check)
    this.filterIllegalMoves(currentTeamPieces, opponentPieces);

    // Step 4: Check endgame conditions
    this.updateGameState(currentTeamPieces);
  }

  /** Filters moves that would leave the king in check */
  private filterIllegalMoves(currentTeamPieces: Piece[], opponentPieces: Piece[]): void {
    for (const piece of currentTeamPieces) {
      if (!piece.possibleMoves) continue;
      piece.possibleMoves = piece.possibleMoves.filter((move) => {
        const simulatedBoard = this.simulateMove(piece, move);
        const king = simulatedBoard.pieces.find(
          (p) => p.isKing && p.team === this.currentTeam
        )!;
        return !simulatedBoard.isKingInCheck(king, opponentPieces);
      });
    }
  }

  /** Updates game state (checkmate, stalemate, draw) */
  private updateGameState(currentTeamPieces: Piece[]): void {
    const hasLegalMoves = currentTeamPieces.some((p) => p.possibleMoves?.length > 0);

    if (!hasLegalMoves) {
      const king = currentTeamPieces.find((p) => p.isKing)!;
      const opponentPieces = this.pieces.filter((p) => p.team !== this.currentTeam);
      if (this.isKingInCheck(king, opponentPieces)) {
        this.gameState = GameState.CHECKMATE;
        this.winningTeam = this.currentTeam === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR;
      } else {
        this.gameState = GameState.STALEMATE;
      }
    } else if (this.isDrawByRepetition() || this.fiftyMoveCounter >= 50) {
      this.gameState = GameState.DRAW;
    }
  }

  /** Checks if the king is in check */
  private isKingInCheck(king: Piece, opponentPieces: Piece[]): boolean {
    for (const enemy of opponentPieces) {
      const moves = this.getValidMoves(enemy, this.pieces);
      if (moves.some((m) => m.samePosition(king.position))) return true;
    }
    return false;
  }

  /** Simulates a move without modifying the original board */
  private simulateMove(piece: Piece, move: Position): Board {
    const newBoard = this.clone();
    const movedPiece = newBoard.pieces.find((p) => p.samePiecePosition(piece))!;
    const capturedPiece = newBoard.pieces.find((p) => p.samePosition(move));
    movedPiece.position = move.clone();
    newBoard.pieces = newBoard.pieces.filter((p) => !p.samePosition(move));
    return newBoard;
  }

  /** Gets valid moves for a piece based on its type */
  getValidMoves(piece: Piece, boardState: Piece[]): Position[] {
    switch (piece.type) {
      case PieceType.PAWN:
        return getPossiblePawnMoves(piece, boardState);
      case PieceType.KNIGHT:
        return getPossibleKnightMoves(piece, boardState);
      case PieceType.BISHOP:
        return getPossibleBishopMoves(piece, boardState);
      case PieceType.ROOK:
        return getPossibleRookMoves(piece, boardState);
      case PieceType.QUEEN:
        return getPossibleQueenMoves(piece, boardState);
      case PieceType.KING:
        return getPossibleKingMoves(piece, boardState);
      default:
        return [];
    }
  }

  /** Executes a move and updates the board state */
  playMove(
    playedPiece: Piece,
    destination: Position,
    promotionType?: PieceType // Optional for pawn promotion
  ): boolean {
    if (this.gameState !== GameState.ONGOING) return false;

    const validMoves = playedPiece.possibleMoves || [];
    const isValidMove = validMoves.some((m) => m.samePosition(destination));
    if (!isValidMove) return false;

    const pawnDirection = playedPiece.team === TeamType.OUR ? 1 : -1;
    const destinationPiece = this.pieces.find((p) => p.samePosition(destination));
    const enPassantMove = this.isEnPassantMove(playedPiece, destination);

    // Handle castling
    if (this.isCastlingMove(playedPiece, destinationPiece)) {
      this.executeCastling(playedPiece, destinationPiece);
    }
    // Handle en passant
    else if (enPassantMove) {
      this.executeEnPassant(playedPiece, destination, pawnDirection);
    }
    // Handle standard move or capture
    else {
      this.executeStandardMove(playedPiece, destination, promotionType);
    }

    // Update move history and counters
    this.moveHistory.push({
      from: playedPiece.position.clone(),
      to: destination.clone(),
      captured: destinationPiece,
    });
    this.totalTurns++;
    this.fiftyMoveCounter = this.updateFiftyMoveCounter(playedPiece, destinationPiece);
    this.calculateAllMoves();

    return true;
  }

  /** Checks if the move is an en passant capture */
  private isEnPassantMove(playedPiece: Piece, destination: Position): boolean {
    if (!playedPiece.isPawn) return false;
    const pawn = playedPiece as Pawn;
    const pawnDirection = playedPiece.team === TeamType.OUR ? 1 : -1;
    return (
      pawn.enPassant &&
      destination.x !== playedPiece.position.x &&
      !this.pieces.some((p) => p.samePosition(destination)) &&
      this.pieces.some((p) =>
        p.samePosition(new Position(destination.x, destination.y - pawnDirection))
      )
    );
  }

  /** Executes an en passant move */
  private executeEnPassant(playedPiece: Piece, destination: Position, pawnDirection: number): void {
    this.pieces = this.pieces.filter(
      (p) => !p.samePosition(new Position(destination.x, destination.y - pawnDirection))
    );
    playedPiece.position = destination.clone();
    (playedPiece as Pawn).enPassant = false;
    playedPiece.hasMoved = true;
    this.clearEnPassantFlags();
  }

  /** Checks if the move is a castling move */
  private isCastlingMove(playedPiece: Piece, destinationPiece?: Piece): boolean {
    return (
      playedPiece.isKing &&
      destinationPiece?.isRook &&
      destinationPiece.team === playedPiece.team &&
      !playedPiece.hasMoved &&
      !destinationPiece.hasMoved
    );
  }

  /** Executes a castling move */
  private executeCastling(king: Piece, rook: Piece): void {
    const direction = rook.position.x > king.position.x ? 1 : -1;
    const newKingX = king.position.x + direction * 2;
    const newRookX = newKingX - direction;

    king.position.x = newKingX;
    rook.position.x = newRookX;
    king.hasMoved = true;
    rook.hasMoved = true;
  }

  /** Executes a standard move or capture */
  private executeStandardMove(
    playedPiece: Piece,
    destination: Position,
    promotionType?: PieceType
  ): void {
    const isPawnMove = playedPiece.isPawn;
    playedPiece.position = destination.clone();
    playedPiece.hasMoved = true;

    if (isPawnMove) {
      const pawn = playedPiece as Pawn;
      pawn.enPassant = Math.abs(destination.y - (pawn.hasMoved ? destination.y : pawn.position.y)) === 2;
      this.clearEnPassantFlags(pawn);

      // Handle promotion
      if (this.isPromotionMove(pawn)) {
        this.promotePawn(pawn, promotionType || PieceType.QUEEN);
      }
    }

    this.pieces = this.pieces.filter((p) => !p.samePosition(destination));
  }

  /** Clears en passant flags for all pawns except the specified one */
  private clearEnPassantFlags(exceptPawn?: Pawn): void {
    for (const piece of this.pieces) {
      if (piece.isPawn && piece !== exceptPawn) {
        (piece as Pawn).enPassant = false;
      }
    }
  }

  /** Checks if a pawn move is a promotion */
  private isPromotionMove(pawn: Piece): boolean {
    return pawn.team === TeamType.OUR ? pawn.position.y === 7 : pawn.position.y === 0;
  }

  /** Promotes a pawn to the specified piece type */
  private promotePawn(pawn: Piece, promotionType: PieceType): void {
    this.pieces = this.pieces.filter((p) => !p.samePiecePosition(pawn));
    this.pieces.push(new Piece(pawn.team, promotionType, pawn.position.clone(), true));
  }

  /** Updates the 50-move rule counter */
  private updateFiftyMoveCounter(playedPiece: Piece, capturedPiece?: Piece): number {
    return playedPiece.isPawn || capturedPiece ? 0 : this.fiftyMoveCounter + 1;
  }

  /** Checks for threefold repetition (simplified, use Zobrist hashing for production) */
  private isDrawByRepetition(): boolean {
    const positionCount = new Map<string, number>();
    for (const move of this.moveHistory) {
      const key = this.serializePosition(); // Simplified; use Zobrist hash in practice
      positionCount.set(key, (positionCount.get(key) || 0) + 1);
      if (positionCount.get(key)! >= 3) return true;
    }
    return false;
  }

  /** Serializes the current board position (placeholder) */
  private serializePosition(): string {
    return this.pieces
      .map((p) => `${p.type}${p.team}${p.position.x}${p.position.y}`)
      .sort()
      .join(",");
  }

  /** Clones the board for simulation */
  clone(): Board {
    return new Board(this.pieces, this.totalTurns);
  }

  /** Serializes the board to FEN (placeholder for extensibility) */
  toFEN(): string {
    // Implement FEN notation here for saving/loading games
    return "rnbqkbnr/pppppppp/5n5/8/8/5N5/PPPPPPPP/RNBQKBNR w KQkq - 0 1"; // Example
  }
}