export interface Point {
  x: number;
  y: number;
}

/**
 * Cardinal-spline → cubic bezier. Produces the soft, editorial curves used
 * across Aurum's charts while passing exactly through every data point.
 */
export function smoothPath(points: Point[], tension = 0.22): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) * tension;
    const c1y = p1.y + (p2.y - p0.y) * tension;
    const c2x = p2.x - (p3.x - p1.x) * tension;
    const c2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function polylineLength(points: Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return Math.max(length, 1);
}

export function scalePoints(values: number[], width: number, height: number, padding = 6): Point[] {
  if (values.length === 0) return [];
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const usableHeight = height - padding * 2;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  return values.map((value, index) => ({
    x: index * stepX,
    y: padding + usableHeight - ((value - min) / span) * usableHeight,
  }));
}
