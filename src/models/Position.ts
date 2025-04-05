export class Position {
  private _x: number;
  private _y: number;

  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  samePosition(otherPosition: Position): boolean {
    return this._x === otherPosition._x && this._y === otherPosition._y;
  }

  equals(other: Position): boolean {
    return this.samePosition(other);
  }

  clone(): Position {
    return new Position(this._x, this._y);
  }

  toString(): string {
    return `${this._x},${this._y}`;
  }

  isValid(): boolean {
    return this._x >= 0 && this._x <= 7 && this._y >= 0 && this._y <= 7;
  }

  distanceTo(other: Position): number {
    return Math.sqrt((this._x - other._x) ** 2 + (this._y - other._y) ** 2);
  }
}