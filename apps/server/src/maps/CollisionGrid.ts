export class CollisionGrid {
  private grid: boolean[][];
  public readonly width: number;
  public readonly height: number;

  constructor(width: number, height: number, solidData: number[]) {
    this.width = width;
    this.height = height;
    this.grid = [];

    for (let y = 0; y < height; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < width; x++) {
        // If data > 0, it's a solid tile
        row.push(solidData[y * width + x] > 0);
      }
      this.grid.push(row);
    }
  }

  isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false; // Out of bounds is not walkable
    }
    return !this.grid[y][x];
  }
}
