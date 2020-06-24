import {Vector2} from '@math.gl/core';

const scratchCompass = new Vector2();
const scratchClosest = new Vector2();
const scratchOffsetA = new Vector2();
const scratchOffsetB = new Vector2();

export function clamp(value, min, max) {
  return [value.x, value.y].map((val, i) => Math.min(Math.max(min[i], val), max[i]));
}

export function length(xy) {
  const x = xy[0];
  const y = xy[1];
  return Math.sqrt(x * x + y * y);
}

export const COMPASS = {
  up: [0, 1],
  down: [0, -1],
  left: [-1, 0],
  right: [1, 0]
};

export function direction(vector) {
  let dir = null;
  let maxVal = -1;
  vector = vector.clone().normalize();
  Object.keys(COMPASS).map((key) => {
    const value = COMPASS[key];
    scratchCompass.set(value[0], value[1]);
    const cos = scratchCompass.dot(vector);
    if (cos > maxVal) {
      dir = key;
      maxVal = cos;
    }
  });
  return dir;
}

export function detectRectCollision(rectA, rectB) {
  // collision x-axis?
  const collisionX =
    rectA.offset[0] + rectA.size[0] >= rectB.offset[0] &&
    rectB.offset[0] + rectB.size[0] >= rectA.offset[0];
  // collision y-axis?
  const collisionY =
    rectA.offset[1] + rectA.size[1] >= rectB.offset[1] &&
    rectB.offset[1] + rectB.size[1] >= rectA.offset[1];
  // collision only if on both axes
  return collisionX && collisionY;
}

export function detectCircleRectCollision(objectA, objectB) {
  const offsetA = scratchOffsetA.set(objectA.offset[0], objectA.offset[1]);
  const offsetB = scratchOffsetB.set(objectB.offset[0], objectB.offset[1]);
  const diff = offsetA.subtract(offsetB);

  const halfSizeB = objectB.halfSize;
  const min = [-halfSizeB[0], -halfSizeB[1]];
  const max = [halfSizeB[0], halfSizeB[1]];
  const clamped = clamp(diff, min, max);
  scratchClosest.set(clamped[0], clamped[1]);

  const dist = diff.distance(scratchClosest);
  const collided = dist < objectA.radius;

  if (collided) {
    // A - (closest + B) = A - B - closest = diff - closest
    const difference = diff.subtract(scratchClosest);
    const dir = direction(difference);
    return {
      collided,
      distance: difference.len(),
      dir
    };
  }
  return {collided};
}
