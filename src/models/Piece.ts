import { TeamType, PieceType } from "../Types";
import { Position } from "./Position";

export class Piece {
  private _position: Position;
  private _type: PieceType;
  private _team: TeamType;
  private _hasMoved: boolean;
  private _possibleMoves: Position[];

  constructor(
    position: Position,
    type: PieceType,
    team: TeamType,
    hasMoved: boolean = false,
    possibleMoves: Position[] = []
  ) {
    this._position = position.clone();
    this._type = type;
    this._team = team;
    this._hasMoved = hasMoved;
    this._possibleMoves = possibleMoves.map((m) => m.clone());
  }

  get image(): string {
    return `assets/images/${this._type}_${this._team}.png`;
  }

  get position(): Position {
    return this._position;
  }

  set position(value: Position) {
    this._position = value.clone();
  }

  get type(): PieceType {
    return this._type;
  }

  get team(): TeamType {
    return this._team;
  }

  get hasMoved(): boolean {
    return this._hasMoved;
  }

  set hasMoved(value: boolean) {
    this._hasMoved = value;
  }

  get possibleMoves(): Position[] {
    return this._possibleMoves;
  }

  set possibleMoves(value: Position[]) {
    this._possibleMoves = value.map((m) => m.clone());
  }

  isPawn(): this is Pawn {
    return this._type === PieceType.PAWN;
  }

  isRook(): boolean {
    return this._type === PieceType.ROOK;
  }

  isKnight(): boolean {
    return this._type === PieceType.KNIGHT;
  }

  isBishop(): boolean {
    return this._type === PieceType.BISHOP;
  }

  isKing(): boolean {
    return this._type === PieceType.KING;
  }

  isQueen(): boolean {
    return this._type === PieceType.QUEEN;
  }

  samePiecePosition(otherPiece: Piece): boolean {
    return this._position.samePosition(otherPiece._position);
  }

  samePosition(otherPosition: Position): boolean {
    return this._position.samePosition(otherPosition);
  }

  clone(): Piece {
    return new Piece(
      this._position.clone(),
      this._type,
      this._team,
      this._hasMoved,
      this._possibleMoves.map((m) => m.clone())
    );
  }

  resetTransientStates(): void {
    this._possibleMoves = [];
  }
}

export { Pawn } from "./Pawn";
``` ​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​