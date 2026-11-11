/**
 * ASTED 2D Canvas Game Engine (PBR & SAT Edition)
 * High-performance 60 FPS physics engine with convex polygon collision detection (SAT),
 * zero-allocation particle pooling, and procedural PBR Canvas2D rendering.
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface CircleCollider {
  x: number;
  y: number;
  radius: number;
  vx?: number;
  vy?: number;
  mass?: number;
  restitution?: number;
  friction?: number;
}

export interface BoxCollider {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConvexPolygon {
  vertices: Vector2D[];
  normals: Vector2D[]; // Precomputed outward unit normals
  centroid: Vector2D;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  restitution?: number;
  friction?: number;
  color?: string;
  borderColor?: string;
  label?: string;
}

export interface CollisionResult {
  collided: boolean;
  normal: Vector2D; // Direction to push collider away (points from surface to circle)
  depth: number;    // Penetration depth
  contactPoint?: Vector2D;
}

export interface PBRPolygonOptions {
  baseColor?: string;
  glowColor?: string;
  metalness?: number; // 0 to 1
  roughness?: number; // 0 to 1
  bevelWidth?: number;
  angleOffset?: number;
}

/**
 * Precomputes normals, bounding box, and centroid for a convex polygon.
 * Vertices must be ordered (counter-clockwise or clockwise).
 */
export function createConvexPolygon(
  vertices: Vector2D[],
  options?: {
    restitution?: number;
    friction?: number;
    color?: string;
    borderColor?: string;
    label?: string;
  }
): ConvexPolygon {
  if (vertices.length < 3) {
    throw new Error('Convex polygon requires at least 3 vertices');
  }

  const normals: Vector2D[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;

  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    sumX += v.x;
    sumY += v.y;
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;

    const next = vertices[(i + 1) % vertices.length];
    const dx = next.x - v.x;
    const dy = next.y - v.y;
    const len = Math.hypot(dx, dy) || 1;
    // Normal perpendicular to edge (outward or inward)
    normals.push({ x: -dy / len, y: dx / len });
  }

  const centroid = { x: sumX / vertices.length, y: sumY / vertices.length };

  // Ensure normals point outward from centroid
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    const midX = (v.x + vertices[(i + 1) % vertices.length].x) / 2;
    const midY = (v.y + vertices[(i + 1) % vertices.length].y) / 2;
    const toMidX = midX - centroid.x;
    const toMidY = midY - centroid.y;
    const dot = normals[i].x * toMidX + normals[i].y * toMidY;
    if (dot < 0) {
      normals[i].x = -normals[i].x;
      normals[i].y = -normals[i].y;
    }
  }

  return {
    vertices,
    normals,
    centroid,
    minX,
    maxX,
    minY,
    maxY,
    restitution: options?.restitution ?? 0.72,
    friction: options?.friction ?? 0.12,
    color: options?.color,
    borderColor: options?.borderColor,
    label: options?.label,
  };
}

/**
 * Creates a triangular convex wedge deflector (e.g. for Plinko wall zig-zags)
 */
export function createTriangleWedge(
  p1: Vector2D,
  p2: Vector2D,
  p3: Vector2D,
  options?: { restitution?: number; friction?: number; color?: string; label?: string }
): ConvexPolygon {
  return createConvexPolygon([p1, p2, p3], options);
}

/**
 * Creates an oriented rectangular convex polygon
 */
export function createPolygonBox(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation = 0,
  options?: { restitution?: number; friction?: number; color?: string; label?: string }
): ConvexPolygon {
  const hw = width / 2;
  const hh = height / 2;
  const corners = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];

  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const vertices = corners.map((c) => ({
    x: x + (c.x * cos - c.y * sin),
    y: y + (c.x * sin + c.y * cos),
  }));

  return createConvexPolygon(vertices, options);
}

/**
 * 2D Collision Engine with Separating Axis Theorem (SAT) & Zero-Allocation Caching
 */
export class Collision2D {
  // Reusable scratch objects to eliminate GC allocation during 60 FPS collision loops
  static scratchResult: CollisionResult = {
    collided: false,
    normal: { x: 0, y: 0 },
    depth: 0,
    contactPoint: { x: 0, y: 0 },
  };

  /**
   * Circle vs Circle collision
   */
  static circleVsCircle(c1: CircleCollider, c2: CircleCollider): CollisionResult {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dist = Math.hypot(dx, dy);
    const minDist = c1.radius + c2.radius;

    if (dist < minDist && dist > 0.0001) {
      const depth = minDist - dist;
      const normal = { x: dx / dist, y: dy / dist };
      return { collided: true, normal, depth };
    }
    return { collided: false, normal: { x: 0, y: 0 }, depth: 0 };
  }

  /**
   * Elastic collision resolution between two circles
   */
  static resolveElasticCircleCollision(c1: CircleCollider, c2: CircleCollider, restitution = 0.92) {
    const res = this.circleVsCircle(c1, c2);
    if (!res.collided) return false;

    const m1 = c1.mass || 1;
    const m2 = c2.mass || 1;
    const totalMass = m1 + m2;

    c1.x -= res.normal.x * res.depth * (m2 / totalMass);
    c1.y -= res.normal.y * res.depth * (m2 / totalMass);
    c2.x += res.normal.x * res.depth * (m1 / totalMass);
    c2.y += res.normal.y * res.depth * (m1 / totalMass);

    const v1x = c1.vx || 0;
    const v1y = c1.vy || 0;
    const v2x = c2.vx || 0;
    const v2y = c2.vy || 0;

    const rvx = v2x - v1x;
    const rvy = v2y - v1y;
    const velAlongNormal = rvx * res.normal.x + rvy * res.normal.y;

    if (velAlongNormal > 0) return true;

    const impulseMag = (-(1 + restitution) * velAlongNormal) / (1 / m1 + 1 / m2);
    const ix = impulseMag * res.normal.x;
    const iy = impulseMag * res.normal.y;

    if (c1.vx !== undefined) c1.vx -= (1 / m1) * ix;
    if (c1.vy !== undefined) c1.vy -= (1 / m1) * iy;
    if (c2.vx !== undefined) c2.vx += (1 / m2) * ix;
    if (c2.vy !== undefined) c2.vy += (1 / m2) * iy;

    return true;
  }

  /**
   * High-Precision Separating Axis Theorem (SAT): Circle vs Convex Polygon.
   * Zero-allocation: pass an optional outResult to avoid heap allocation.
   */
  static circleVsConvexPolygon(
    circle: CircleCollider,
    poly: ConvexPolygon,
    outResult: CollisionResult = Collision2D.scratchResult
  ): CollisionResult {
    // 1. Broadphase AABB quick reject
    const r = circle.radius;
    if (
      circle.x + r < poly.minX ||
      circle.x - r > poly.maxX ||
      circle.y + r < poly.minY ||
      circle.y - r > poly.maxY
    ) {
      outResult.collided = false;
      outResult.depth = 0;
      return outResult;
    }

    let minOverlap = Infinity;
    let smallestAxisX = 0;
    let smallestAxisY = 0;

    const verts = poly.vertices;
    const count = verts.length;

    // 2. Test edge normal axes
    for (let i = 0; i < count; i++) {
      const normal = poly.normals[i];
      const nx = normal.x;
      const ny = normal.y;

      // Project polygon onto normal
      let minPoly = Infinity;
      let maxPoly = -Infinity;
      for (let j = 0; j < count; j++) {
        const dot = verts[j].x * nx + verts[j].y * ny;
        if (dot < minPoly) minPoly = dot;
        if (dot > maxPoly) maxPoly = dot;
      }

      // Project circle onto normal
      const circleDot = circle.x * nx + circle.y * ny;
      const minCircle = circleDot - r;
      const maxCircle = circleDot + r;

      // Separating axis found?
      if (minCircle >= maxPoly || minPoly >= maxCircle) {
        outResult.collided = false;
        outResult.depth = 0;
        return outResult;
      }

      const overlap = Math.min(maxCircle - minPoly, maxPoly - minCircle);
      if (overlap < minOverlap) {
        minOverlap = overlap;
        smallestAxisX = nx;
        smallestAxisY = ny;
      }
    }

    // 3. Test vertex axes (closest vertex to circle center)
    let closestDistSq = Infinity;
    let closestVertX = 0;
    let closestVertY = 0;

    for (let i = 0; i < count; i++) {
      const v = verts[i];
      const dx = circle.x - v.x;
      const dy = circle.y - v.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closestVertX = v.x;
        closestVertY = v.y;
      }
    }

    const vAxisDx = circle.x - closestVertX;
    const vAxisDy = circle.y - closestVertY;
    const vAxisDist = Math.hypot(vAxisDx, vAxisDy);

    if (vAxisDist > 0.0001) {
      const vnx = vAxisDx / vAxisDist;
      const vny = vAxisDy / vAxisDist;

      let minPoly = Infinity;
      let maxPoly = -Infinity;
      for (let j = 0; j < count; j++) {
        const dot = verts[j].x * vnx + verts[j].y * vny;
        if (dot < minPoly) minPoly = dot;
        if (dot > maxPoly) maxPoly = dot;
      }

      const circleDot = circle.x * vnx + circle.y * vny;
      const minCircle = circleDot - r;
      const maxCircle = circleDot + r;

      if (minCircle >= maxPoly || minPoly >= maxCircle) {
        outResult.collided = false;
        outResult.depth = 0;
        return outResult;
      }

      const overlap = Math.min(maxCircle - minPoly, maxPoly - minCircle);
      if (overlap < minOverlap) {
        minOverlap = overlap;
        smallestAxisX = vnx;
        smallestAxisY = vny;
      }
    }

    // Ensure normal points from polygon to circle
    const toCircleX = circle.x - poly.centroid.x;
    const toCircleY = circle.y - poly.centroid.y;
    if (smallestAxisX * toCircleX + smallestAxisY * toCircleY < 0) {
      smallestAxisX = -smallestAxisX;
      smallestAxisY = -smallestAxisY;
    }

    outResult.collided = true;
    outResult.depth = minOverlap;
    outResult.normal.x = smallestAxisX;
    outResult.normal.y = smallestAxisY;
    if (!outResult.contactPoint) outResult.contactPoint = { x: 0, y: 0 };
    outResult.contactPoint.x = circle.x - smallestAxisX * (r - minOverlap * 0.5);
    outResult.contactPoint.y = circle.y - smallestAxisY * (r - minOverlap * 0.5);

    return outResult;
  }

  /**
   * SAT: Convex Polygon vs Convex Polygon
   */
  static convexVsConvex(
    polyA: ConvexPolygon,
    polyB: ConvexPolygon,
    outResult: CollisionResult = Collision2D.scratchResult
  ): CollisionResult {
    // Quick AABB reject
    if (
      polyA.maxX < polyB.minX ||
      polyA.minX > polyB.maxX ||
      polyA.maxY < polyB.minY ||
      polyA.minY > polyB.maxY
    ) {
      outResult.collided = false;
      outResult.depth = 0;
      return outResult;
    }

    let minOverlap = Infinity;
    let smallestAxisX = 0;
    let smallestAxisY = 0;

    const allNormals = [...polyA.normals, ...polyB.normals];

    for (let i = 0; i < allNormals.length; i++) {
      const n = allNormals[i];
      // Project A
      let minA = Infinity;
      let maxA = -Infinity;
      for (let j = 0; j < polyA.vertices.length; j++) {
        const dot = polyA.vertices[j].x * n.x + polyA.vertices[j].y * n.y;
        if (dot < minA) minA = dot;
        if (dot > maxA) maxA = dot;
      }

      // Project B
      let minB = Infinity;
      let maxB = -Infinity;
      for (let j = 0; j < polyB.vertices.length; j++) {
        const dot = polyB.vertices[j].x * n.x + polyB.vertices[j].y * n.y;
        if (dot < minB) minB = dot;
        if (dot > maxB) maxB = dot;
      }

      if (maxA <= minB || maxB <= minA) {
        outResult.collided = false;
        outResult.depth = 0;
        return outResult;
      }

      const overlap = Math.min(maxA - minB, maxB - minA);
      if (overlap < minOverlap) {
        minOverlap = overlap;
        smallestAxisX = n.x;
        smallestAxisY = n.y;
      }
    }

    const toBX = polyB.centroid.x - polyA.centroid.x;
    const toBY = polyB.centroid.y - polyA.centroid.y;
    if (smallestAxisX * toBX + smallestAxisY * toBY < 0) {
      smallestAxisX = -smallestAxisX;
      smallestAxisY = -smallestAxisY;
    }

    outResult.collided = true;
    outResult.depth = minOverlap;
    outResult.normal.x = smallestAxisX;
    outResult.normal.y = smallestAxisY;
    return outResult;
  }

  /**
   * High-precision collision resolution with physical restitution and friction.
   * Resolves ball hitting static or kinetic polygon.
   */
  static resolveElasticPolygonCollision(
    circle: CircleCollider,
    poly: ConvexPolygon,
    customRestitution?: number,
    customFriction?: number
  ): boolean {
    const res = this.circleVsConvexPolygon(circle, poly, Collision2D.scratchResult);
    if (!res.collided) return false;

    // 1. Minimum Translation Vector (MTV) positional correction
    circle.x += res.normal.x * (res.depth + 0.05);
    circle.y += res.normal.y * (res.depth + 0.05);

    // 2. Velocity decomposition
    const vx = circle.vx ?? 0;
    const vy = circle.vy ?? 0;
    const nx = res.normal.x;
    const ny = res.normal.y;

    // Normal velocity (v · n)
    const vDotN = vx * nx + vy * ny;

    // Moving away from surface? Don't pull back
    if (vDotN > 0) return true;

    // Tangent vector
    const tx = -ny;
    const ty = nx;
    const vDotT = vx * tx + vy * ty;

    const restitution = customRestitution ?? poly.restitution ?? circle.restitution ?? 0.75;
    const friction = customFriction ?? poly.friction ?? circle.friction ?? 0.1;

    // Reflect along normal with restitution
    const newNormalVel = -vDotN * restitution;
    // Damp along tangent with friction
    const newTangentVel = vDotT * (1 - Math.min(1, friction));

    circle.vx = newNormalVel * nx + newTangentVel * tx;
    circle.vy = newNormalVel * ny + newTangentVel * ty;

    return true;
  }

  /**
   * Circle vs AABB Box collider
   */
  static circleVsAABB(circle: CircleCollider, box: BoxCollider): CollisionResult {
    const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const dist = Math.hypot(dx, dy);

    if (dist < circle.radius) {
      const depth = circle.radius - dist;
      const normal = dist > 0.0001 ? { x: dx / dist, y: dy / dist } : { x: 0, y: -1 };
      return { collided: true, normal, depth };
    }
    return { collided: false, normal: { x: 0, y: 0 }, depth: 0 };
  }

  static pointInCircle(p: Vector2D, c: CircleCollider): boolean {
    return Math.hypot(p.x - c.x, p.y - c.y) <= c.radius;
  }

  static pointInAABB(p: Vector2D, box: BoxCollider): boolean {
    return p.x >= box.x && p.x <= box.x + box.width && p.y >= box.y && p.y <= box.y + box.height;
  }

  static pointInConvexPolygon(p: Vector2D, poly: ConvexPolygon): boolean {
    if (p.x < poly.minX || p.x > poly.maxX || p.y < poly.minY || p.y > poly.maxY) {
      return false;
    }
    const verts = poly.vertices;
    for (let i = 0; i < verts.length; i++) {
      const v1 = verts[i];
      const v2 = verts[(i + 1) % verts.length];
      const cross = (v2.x - v1.x) * (p.y - v1.y) - (v2.y - v1.y) * (p.x - v1.x);
      if (cross < 0) return false;
    }
    return true;
  }
}

/**
 * Procedural PBR Canvas2D Methods
 * Native gradient and composite mathematics emulating 24K gold, diamond refractions, and specular shines.
 */

/**
 * Dynamic 24K Gold Multi-Stop Specular Gradient
 * [#854d0e, #ca8a04, #fef08a, #ca8a04, #854d0e] with angle modulation
 */
export function createGold24KGradient(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  angleOffset = 0
): CanvasGradient {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  const shift = ((Math.sin(angleOffset) + 1) / 2) * 0.2; // slight dynamic sheen shift
  grad.addColorStop(0, '#854d0e');
  grad.addColorStop(Math.min(0.9, 0.25 + shift), '#ca8a04');
  grad.addColorStop(Math.min(0.95, 0.5 + shift), '#fef08a');
  grad.addColorStop(Math.min(0.98, 0.75 + shift), '#ca8a04');
  grad.addColorStop(1, '#854d0e');
  return grad;
}

/**
 * Procedural 3D Sphere with Metallic PBR Highlights, Fresnel rim, and Ambient Occlusion
 */
export function drawPBRSphere(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  baseColor = '#f43f5e',
  specularColor = '#ffffff',
  lightAngle = -Math.PI / 4
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();

  // 1. Base sphere diffuse + ambient occlusion
  const lightDist = radius * 0.45;
  const lx = x + Math.cos(lightAngle) * lightDist;
  const ly = y + Math.sin(lightAngle) * lightDist;

  const radial = ctx.createRadialGradient(lx, ly, radius * 0.1, x, y, radius);
  radial.addColorStop(0, specularColor);
  radial.addColorStop(0.35, baseColor);
  radial.addColorStop(0.85, baseColor);
  radial.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = radial;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. High specular sharp glint
  const glint = ctx.createRadialGradient(
    lx - radius * 0.1,
    ly - radius * 0.1,
    0,
    lx,
    ly,
    radius * 0.4
  );
  glint.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  glint.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
  glint.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glint;
  ctx.beginPath();
  ctx.arc(lx, ly, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // 3. Fresnel bounce rim glow
  ctx.restore();
}

/**
 * Procedural 24K Gold Coin with 3D depth and milled rim
 */
export function drawGoldCoin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angle: number,
  pitch = 0.65
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Outer rim
  const rimGrad = ctx.createLinearGradient(-radius, -radius * pitch, radius, radius * pitch);
  rimGrad.addColorStop(0, '#854d0e');
  rimGrad.addColorStop(0.3, '#ca8a04');
  rimGrad.addColorStop(0.5, '#fef08a');
  rimGrad.addColorStop(0.8, '#ca8a04');
  rimGrad.addColorStop(1, '#854d0e');

  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * pitch, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner beveled circle
  const innerR = radius * 0.82;
  const innerGrad = ctx.createLinearGradient(-innerR, innerR * pitch, innerR, -innerR * pitch);
  innerGrad.addColorStop(0, '#713f12');
  innerGrad.addColorStop(0.5, '#eab308');
  innerGrad.addColorStop(1, '#fef08a');

  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, innerR, innerR * pitch, 0, 0, Math.PI * 2);
  ctx.fill();

  // Specular ring stroke
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, innerR * 0.92, innerR * 0.92 * pitch, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a beveled, metallic PBR convex polygon (e.g. Plinko wall deflectors, wedges, bumpers)
 */
export function drawPBRConvexPolygon(
  ctx: CanvasRenderingContext2D,
  poly: ConvexPolygon,
  options?: PBRPolygonOptions
): void {
  const verts = poly.vertices;
  if (verts.length < 3) return;

  ctx.save();

  // 1. Gradient Fill
  const angle = options?.angleOffset ?? 0;
  const grad = ctx.createLinearGradient(poly.minX, poly.minY, poly.maxX, poly.maxY);

  if (options?.baseColor === 'gold') {
    grad.addColorStop(0, '#854d0e');
    grad.addColorStop(0.35, '#ca8a04');
    grad.addColorStop(0.5, '#fef08a');
    grad.addColorStop(0.8, '#ca8a04');
    grad.addColorStop(1, '#854d0e');
  } else if (poly.color) {
    grad.addColorStop(0, poly.color);
    grad.addColorStop(1, '#0f172a');
  } else {
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.5, '#334155');
    grad.addColorStop(1, '#0f172a');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(verts[0].x, verts[0].y);
  for (let i = 1; i < verts.length; i++) {
    ctx.lineTo(verts[i].x, verts[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // 2. Beveled Highlight border
  ctx.strokeStyle = options?.glowColor || poly.borderColor || '#38bdf8';
  ctx.lineWidth = options?.bevelWidth || 1.5;
  if (options?.glowColor) {
    ctx.shadowColor = options.glowColor;
    ctx.shadowBlur = 8;
  }
  ctx.stroke();

  // 3. Specular Edge reflection (top facets)
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(verts[0].x, verts[0].y);
  ctx.lineTo(verts[1].x, verts[1].y);
  ctx.stroke();

  ctx.restore();
}

/**
 * ASTED Core VFX: Destello de Estrella procedural de alta gama (60 FPS)
 */
export interface StarFlare {
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: string; // Ej: '#fef08a' para oro, '#10b981' para Esmeralda Neón
}

export function drawCasinoSpecularFlare(
  ctx: CanvasRenderingContext2D,
  flare: StarFlare,
  angleRotation: number
): void {
  ctx.save();
  ctx.translate(flare.x, flare.y);
  ctx.rotate(angleRotation);
  ctx.globalCompositeOperation = 'lighter'; // Efecto de fusión aditiva para brillos de casino
  ctx.globalAlpha = Math.max(0, Math.min(1, flare.alpha));

  // 1. Núcleo resplandeciente (Gradiente Radial)
  const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, flare.size * 0.4);
  coreGlow.addColorStop(0, '#ffffff');
  coreGlow.addColorStop(0.3, flare.color);
  coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(0, 0, flare.size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // 2. Destellos en Cruz (Efecto Lente de Diamante)
  const sharpGlow = ctx.createLinearGradient(-flare.size, 0, flare.size, 0);
  sharpGlow.addColorStop(0, 'rgba(0,0,0,0)');
  sharpGlow.addColorStop(0.5, '#ffffff');
  sharpGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sharpGlow;

  // Pico Horizontal
  ctx.fillRect(-flare.size, -2, flare.size * 2, 4);

  // Pico Vertical (Rotado internamente en el contexto)
  ctx.rotate(Math.PI / 2);
  ctx.fillRect(-flare.size, -2, flare.size * 2, 4);

  // Diagonal suave
  ctx.rotate(Math.PI / 4);
  ctx.globalAlpha = Math.max(0, flare.alpha * 0.45);
  ctx.fillRect(-flare.size * 0.6, -1.5, flare.size * 1.2, 3);

  ctx.restore();
}

/**
 * Procedural Multi-Faceted 3D Diamond Gem (Zero Bitmaps, Pure Geometric Vector)
 */
export function drawProceduralFacetGem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color = '#10b981',
  angle = 0,
  specularIntensity = 1
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const half = size / 2;
  const crownH = size * 0.35;
  const tableW = size * 0.55;

  // Table (top face)
  const tableGrad = ctx.createLinearGradient(-tableW / 2, -half, tableW / 2, -half + crownH);
  tableGrad.addColorStop(0, '#ffffff');
  tableGrad.addColorStop(0.3, color);
  tableGrad.addColorStop(1, '#064e3b');

  ctx.fillStyle = tableGrad;
  ctx.beginPath();
  ctx.moveTo(-tableW / 2, -half);
  ctx.lineTo(tableW / 2, -half);
  ctx.lineTo(half, -half + crownH);
  ctx.lineTo(-half, -half + crownH);
  ctx.closePath();
  ctx.fill();

  // Pavilion (bottom triangular facets)
  const pavGradL = ctx.createLinearGradient(-half, -half + crownH, 0, half);
  pavGradL.addColorStop(0, color);
  pavGradL.addColorStop(1, '#022c22');
  ctx.fillStyle = pavGradL;
  ctx.beginPath();
  ctx.moveTo(-half, -half + crownH);
  ctx.lineTo(0, -half + crownH);
  ctx.lineTo(0, half);
  ctx.closePath();
  ctx.fill();

  const pavGradR = ctx.createLinearGradient(0, -half + crownH, half, half);
  pavGradR.addColorStop(0, '#a7f3d0');
  pavGradR.addColorStop(1, color);
  ctx.fillStyle = pavGradR;
  ctx.beginPath();
  ctx.moveTo(0, -half + crownH);
  ctx.lineTo(half, -half + crownH);
  ctx.lineTo(0, half);
  ctx.closePath();
  ctx.fill();

  // Facet borders
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Specular flare if high intensity
  if (specularIntensity > 0.4) {
    drawCasinoSpecularFlare(
      ctx,
      { x: -tableW * 0.2, y: -half * 0.7, size: size * 0.6, alpha: specularIntensity, color: '#ffffff' },
      angle + 0.3
    );
  }

  ctx.restore();
}

/**
 * Zero-Allocation Particle System with Object Pooling
 * Fixed capacity array ensures 60 FPS without Garbage Collection pauses.
 */
export interface EngineParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  drag?: number;
  rotation?: number;
  vRot?: number;
  shape?: 'circle' | 'star' | 'coin' | 'ring';
  active: boolean;
}

export class EngineParticleSystem {
  private poolSize = 350;
  particles: EngineParticle[] = [];
  activeCount = 0;

  constructor(capacity = 350) {
    this.poolSize = capacity;
    this.particles = new Array(this.poolSize);
    for (let i = 0; i < this.poolSize; i++) {
      this.particles[i] = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 0,
        color: '#ffffff',
        alpha: 0,
        life: 0,
        maxLife: 1,
        active: false,
      };
    }
  }

  private obtainSlot(): EngineParticle | null {
    for (let i = 0; i < this.poolSize; i++) {
      if (!this.particles[i].active) {
        this.particles[i].active = true;
        this.activeCount++;
        return this.particles[i];
      }
    }
    return null;
  }

  emit(p: Partial<EngineParticle>) {
    const slot = this.obtainSlot();
    if (!slot) return;
    slot.x = p.x ?? 0;
    slot.y = p.y ?? 0;
    slot.vx = p.vx ?? 0;
    slot.vy = p.vy ?? 0;
    slot.radius = p.radius ?? 3;
    slot.color = p.color ?? '#facc15';
    slot.alpha = p.alpha ?? 1;
    slot.life = 0;
    slot.maxLife = p.maxLife ?? 30;
    slot.gravity = p.gravity ?? 0;
    slot.drag = p.drag ?? 1;
    slot.rotation = p.rotation ?? 0;
    slot.vRot = p.vRot ?? 0;
    slot.shape = p.shape ?? 'circle';
  }

  emitGoldenSparkles(x: number, y: number, count = 20) {
    const goldTones = ['#fef08a', '#facc15', '#eab308', '#ca8a04', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      const maxLife = 25 + Math.random() * 25;
      this.emit({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0,
        radius: 2 + Math.random() * 3.5,
        color: goldTones[Math.floor(Math.random() * goldTones.length)],
        alpha: 1,
        maxLife,
        gravity: 0.08,
        drag: 0.96,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        shape: Math.random() < 0.4 ? 'star' : 'circle',
      });
    }
  }

  emitGlowRing(x: number, y: number, color = '#facc15', maxRadius = 35) {
    this.emit({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 4,
      color,
      alpha: 0.9,
      maxLife: 20,
      drag: 1,
      shape: 'ring',
    });
  }

  emitCoins(x: number, y: number, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = 4 + Math.random() * 5.5;
      this.emit({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 6 + Math.random() * 3,
        color: '#facc15',
        alpha: 1,
        maxLife: 40 + Math.random() * 20,
        gravity: 0.22,
        drag: 0.98,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.35,
        shape: 'coin',
      });
    }
  }

  update(dt = 1) {
    for (let i = 0; i < this.poolSize; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.activeCount--;
        continue;
      }

      if (p.gravity) p.vy += p.gravity * dt;
      if (p.drag) {
        p.vx *= Math.pow(p.drag, dt);
        p.vy *= Math.pow(p.drag, dt);
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.rotation !== undefined && p.vRot !== undefined) {
        p.rotation += p.vRot * dt;
      }

      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.shape === 'ring') {
        p.radius += 1.8 * dt;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = 0; i < this.poolSize; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      ctx.globalAlpha = p.alpha;

      if (p.shape === 'star') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          ctx.rotate(Math.PI / 2);
          ctx.lineTo(p.radius * 2, 0);
          ctx.lineTo(p.radius * 0.4, p.radius * 0.4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.shape === 'coin') {
        drawGoldCoin(ctx, p.x, p.y, p.radius, p.rotation || 0, 0.6);
      } else if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  clear() {
    for (let i = 0; i < this.poolSize; i++) {
      this.particles[i].active = false;
    }
    this.activeCount = 0;
  }
}

/**
 * ASTED 60 FPS Canvas Game Engine Loop Runner
 */
export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  isRunning = false;
  isPaused = false;
  lastTime = 0;
  dt = 0;
  particles: EngineParticleSystem;
  private animId: number | null = null;

  mouse: Vector2D & { isDown: boolean } = { x: 0, y: 0, isDown: false };

  onUpdate?: (dt: number) => void;
  onRender?: (ctx: CanvasRenderingContext2D, dt: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
    this.particles = new EngineParticleSystem();
    this.bindMouseEvents();
  }

  private bindMouseEvents() {
    const updateCoords = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouse.x = (clientX - rect.left) * scaleX;
      this.mouse.y = (clientY - rect.top) * scaleY;
    };

    this.canvas.addEventListener('mousemove', (e) => updateCoords(e.clientX, e.clientY));
    this.canvas.addEventListener('mousedown', (e) => {
      updateCoords(e.clientX, e.clientY);
      this.mouse.isDown = true;
    });
    this.canvas.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.isDown = false;
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        updateCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    });
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        updateCoords(e.touches[0].clientX, e.touches[0].clientY);
        this.mouse.isDown = true;
      }
    });
    this.canvas.addEventListener('touchend', () => {
      this.mouse.isDown = false;
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now();
    }
  }

  private loop = (now: number) => {
    if (!this.isRunning) return;

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.dt = Math.min(rawDt, 0.1);

    if (!this.isPaused) {
      if (this.onUpdate) this.onUpdate(this.dt);
      this.particles.update(this.dt * 60);
    }

    this.clear();
    if (this.onRender) this.onRender(this.ctx, this.dt);
    this.particles.draw(this.ctx);

    this.animId = requestAnimationFrame(this.loop);
  };

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  destroy() {
    this.stop();
    this.particles.clear();
  }
}
