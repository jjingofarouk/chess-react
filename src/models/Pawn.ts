import { PieceType, TeamType } from "../Types";
import { Piece } from "./Piece";
import { Position } from "./Position";

/**
 * Represents a pawn piece in a chess game, extending the base Piece class.
 * Pawns have unique properties like en passant eligibility.
 */
export class Pawn extends Piece {
  private _enPassant: boolean; // Private to enforce controlled access

  /**
   * Constructs a new Pawn instance.
   * @param position - The initial position of the pawn on the board.
   * @param team - The team the pawn belongs to (OUR or OPPONENT).
   * @param hasMoved - Whether the pawn has moved from its starting position.
   * @param enPassant - Whether the pawn is eligible for an en passant capture (defaults to false).
   * @param possibleMoves - Array of possible moves for the pawn (defaults to empty).
   */
  constructor(
    position: Position,
    team: TeamType,
    hasMoved: boolean = false,
    enPassant: boolean = false,
    possibleMoves: Position[] = []
  ) {
    super(position, PieceType.PAWN, team, hasMoved, possibleMoves);
    this._enPassant = enPassant;
  }

  /** Gets whether the pawn is eligible for an en passant capture. */
  get enPassant(): boolean {
    return this._enPassant;
  }

  /** Sets the en passant eligibility for the pawn. */
  set enPassant(value: boolean) {
    this._enPassant = value;
  }

  /** Checks if this piece is a pawn (useful for type guards). */
  override isPawn(): this is Pawn {
    return true;
  }

  /**
   * Creates a deep copy of the pawn.
   * @returns A new Pawn instance with cloned properties.
   */
  clone(): Pawn {
    return new Pawn(
      this.position.clone(),
      this.team,
      this.hasMoved,
      this._enPassant,
      this.possibleMoves?.map((m) => m.clone()) ?? []
    );
  }

  /**
   * Resets transient states like en passant eligibility.
   * Useful for move simulation or board reset.
   */
  resetTransientStates(): void {
    this._enPassant = false;
  }

  /**
   * Checks if the pawn is eligible for promotion based on its position.
   * @returns True if the pawn is on the opponent's back rank.
   */
  isPromotionEligible(): boolean {
    return this.team === TeamType.OUR ? this.position.y === 7 : this.position.y === 0;
  }
}