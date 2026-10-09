import type { DifferenceRegion, Rect } from './types.js';

const MAX_REGIONS = 5;
/** Merge nearby components when bounding boxes are within this gap (px). */
const MERGE_GAP = 8;

type Component = {
  bounds: Rect;
  mismatchedPixels: number;
};

export function extractRegions(
  mask: Uint8Array,
  width: number,
  height: number,
): DifferenceRegion[] {
  const visited = new Uint8Array(mask.length);
  const components: Component[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (mask[idx] !== 1 || visited[idx] === 1) continue;
      components.push(floodFill(mask, visited, width, height, x, y));
    }
  }

  const merged = mergeComponents(components).map((component) => ({
    bounds: component.bounds,
    mismatchedPixels: countMaskInRect(mask, width, component.bounds),
  }));

  merged.sort((a, b) => {
    if (b.mismatchedPixels !== a.mismatchedPixels) {
      return b.mismatchedPixels - a.mismatchedPixels;
    }
    if (a.bounds.y !== b.bounds.y) return a.bounds.y - b.bounds.y;
    if (a.bounds.x !== b.bounds.x) return a.bounds.x - b.bounds.x;
    if (a.bounds.width !== b.bounds.width) return a.bounds.width - b.bounds.width;
    return a.bounds.height - b.bounds.height;
  });

  return merged.slice(0, MAX_REGIONS).map((component, index) => {
    const areaPixels = component.bounds.width * component.bounds.height;
    return {
      id: `region-${index + 1}`,
      bounds: component.bounds,
      mismatchedPixels: component.mismatchedPixels,
      areaPixels,
      mismatchDensity: areaPixels === 0 ? 0 : component.mismatchedPixels / areaPixels,
    };
  });
}

function countMaskInRect(mask: Uint8Array, width: number, bounds: Rect): number {
  let count = 0;
  const x2 = bounds.x + bounds.width;
  const y2 = bounds.y + bounds.height;
  for (let y = bounds.y; y < y2; y += 1) {
    for (let x = bounds.x; x < x2; x += 1) {
      if (mask[y * width + x] === 1) count += 1;
    }
  }
  return count;
}

function floodFill(
  mask: Uint8Array,
  visited: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
): Component {
  let minX = startX;
  let minY = startY;
  let maxX = startX;
  let maxY = startY;
  let mismatchedPixels = 0;

  const stack: Array<[number, number]> = [[startX, startY]];
  visited[startY * width + startX] = 1;

  while (stack.length > 0) {
    const point = stack.pop();
    if (!point) break;
    const [x, y] = point;
    mismatchedPixels += 1;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nidx = ny * width + nx;
        if (mask[nidx] !== 1 || visited[nidx] === 1) continue;
        visited[nidx] = 1;
        stack.push([nx, ny]);
      }
    }
  }

  return {
    mismatchedPixels,
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    },
  };
}

function boxesNear(a: Rect, b: Rect, gap: number): boolean {
  const ax2 = a.x + a.width - 1;
  const ay2 = a.y + a.height - 1;
  const bx2 = b.x + b.width - 1;
  const by2 = b.y + b.height - 1;
  return !(
    ax2 + gap < b.x ||
    bx2 + gap < a.x ||
    ay2 + gap < b.y ||
    by2 + gap < a.y
  );
}

function unionBounds(a: Rect, b: Rect): Rect {
  const x1 = Math.min(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x + a.width - 1, b.x + b.width - 1);
  const y2 = Math.max(a.y + a.height - 1, b.y + b.height - 1);
  return { x: x1, y: y1, width: x2 - x1 + 1, height: y2 - y1 + 1 };
}

/**
 * Merge nearby components. After merge, mismatchedPixels is the sum of original
 * component pixel counts (disjoint connected components), which remains consistent
 * with the global mask count.
 */
function mergeComponents(components: Component[]): Component[] {
  if (components.length <= 1) return components;

  const items = components.map((c) => ({ ...c, bounds: { ...c.bounds } }));
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];
        if (!a || !b) continue;
        if (!boxesNear(a.bounds, b.bounds, MERGE_GAP)) continue;
        a.bounds = unionBounds(a.bounds, b.bounds);
        a.mismatchedPixels += b.mismatchedPixels;
        items.splice(j, 1);
        changed = true;
        break;
      }
      if (changed) break;
    }
  }
  return items;
}
