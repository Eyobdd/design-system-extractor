/**
 * Represents a rectangular bounding box in 2D space
 * Used for component positioning and comparison
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates the area of a bounding box
 */
export function getBoundingBoxArea(box: BoundingBox): number {
  return box.width * box.height;
}

/**
 * Checks if two bounding boxes overlap
 */
export function boundingBoxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/**
 * Calculates the intersection of two bounding boxes
 * Returns null if they don't overlap
 */
export function getBoundingBoxIntersection(a: BoundingBox, b: BoundingBox): BoundingBox | null {
  if (!boundingBoxesOverlap(a, b)) {
    return null;
  }

  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const width = Math.min(a.x + a.width, b.x + b.width) - x;
  const height = Math.min(a.y + a.height, b.y + b.height) - y;

  return { x, y, width, height };
}
