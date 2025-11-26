// 2D Vector utilities with complex number support

import Complex from 'complex.js';

// A Vec represents a 2D vector where components can be complex numbers
export interface Vec {
  x: Complex;
  y: Complex;
}

// Create a Vec from real or complex numbers
export function vec(x: number | Complex, y: number | Complex): Vec {
  return {
    x: typeof x === 'number' ? new Complex(x, 0) : x,
    y: typeof y === 'number' ? new Complex(y, 0) : y,
  };
}

// Add two vectors
export function vecAdd(v1: Vec, v2: Vec): Vec {
  return {
    x: v1.x.add(v2.x),
    y: v1.y.add(v2.y),
  };
}

// Subtract two vectors
export function vecSub(v1: Vec, v2: Vec): Vec {
  return vecAdd(v1, vecScale(-1, v2));
}

// Dot product of two vectors
export function vecDot(v1: Vec, v2: Vec): Complex {
  return v1.x.mul(v2.x).add(v1.y.mul(v2.y));
}

// Scale a vector by a scalar (real or complex)
export function vecScale(k: number | Complex, v: Vec): Vec {
  const kComplex = typeof k === 'number' ? new Complex(k, 0) : k;
  return {
    x: kComplex.mul(v.x),
    y: kComplex.mul(v.y),
  };
}

// Calculate the magnitude of a vector
export function vecMagnitude(v: Vec): number {
  // sqrt(x* x + y* y) where * is complex conjugate
  const xConj = v.x.conjugate();
  const yConj = v.y.conjugate();
  const magSquared = v.x.mul(xConj).add(v.y.mul(yConj));
  return Math.sqrt(magSquared.re);
}

// Normalize a vector to unit length
export function vecNormalize(v: Vec): Vec {
  const mag = vecMagnitude(v);
  if (mag === 0) return v;
  return vecScale(1 / mag, v);
}

// Reflect vector v off a surface with normal norm
// Formula: v' = v - 2(v·n)n where n is unit normal
export function vecReflect(v: Vec, norm: Vec): Vec {
  const normUnit = vecNormalize(norm);
  const dotProduct = vecDot(v, normUnit);
  const twoDotN = vecScale(dotProduct.mul(2), normUnit);
  return vecSub(v, twoDotN);
}

// Map a function over both components of a vector
export function vecMap(v: Vec, f: (c: Complex) => Complex): Vec {
  return {
    x: f(v.x),
    y: f(v.y),
  };
}

// Check if vector is zero
export function vecZero(v: Vec): boolean {
  return v.x.abs() === 0 && v.y.abs() === 0;
}

// Check if two vectors are equal
export function vecEqual(v1: Vec, v2: Vec): boolean {
  return v1.x.equals(v2.x) && v1.y.equals(v2.y);
}

// Serialize a vector to a string key for use in Maps
export function vecToKey(v: Vec): string {
  return `${v.x.re},${v.x.im},${v.y.re},${v.y.im}`;
}

// Round vector components to integers
export function vecRound(v: Vec): Vec {
  return {
    x: new Complex(Math.round(v.x.re), Math.round(v.x.im)),
    y: new Complex(Math.round(v.y.re), Math.round(v.y.im)),
  };
}

