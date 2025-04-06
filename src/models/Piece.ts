import { Position } from "./Position";
import { PieceType, TeamType } from "../Types";

export class Piece {
  private _position: Position;
  private _type: PieceType;
  private _team: TeamType;
  private _hasMoved: boolean;
  public possibleMoves: Position[];

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
    this.possibleMoves = possibleMoves.map((m) => m.clone());
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
      this.possibleMoves.map((m) => m.clone())
    );
  }
}

export class Pawn extends Piece {
  public enPassant: boolean = false;

  constructor(position: Position, team: TeamType, hasMoved: boolean = false) {
    super(position, PieceType.PAWN, team, hasMoved);
  }

  clone(): Pawn {
    const clonedPawn = new Pawn(this.position.clone(), this.team, this.hasMoved);
    clonedPawn.enPassant = this.enPassant;
    clonedPawn.possibleMoves = this.possibleMoves.map((m) => m.clone());
    return clonedPawn;
  }
}

export { PieceType, TeamType } from "../Types";