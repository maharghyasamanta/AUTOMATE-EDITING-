import test from "node:test";
import assert from "node:assert/strict";
import {
  ENTRY_DURATION_SEC,
  ENTRY_START_Y,
  STOPS_S,
  STOPS_X,
  STOPS_Y,
  clamp,
  computeEntryOffset,
  computeScrollProgress,
  computeTargetTransform,
  sampleStops,
} from "./earthMath";

test("sampleStops matches keyframe endpoints and smoothstep midpoints", () => {
  assert.equal(sampleStops(STOPS_X, -0.5), 0);
  assert.equal(sampleStops(STOPS_X, 0), 0);
  assert.equal(sampleStops(STOPS_X, 0.32), -3.1);
  assert.equal(sampleStops(STOPS_X, 0.64), 3.2);
  assert.equal(sampleStops(STOPS_X, 1), 0);
  assert.equal(sampleStops(STOPS_X, 1.5), 0);

  assert.equal(sampleStops(STOPS_Y, 0), -4.5);
  assert.equal(sampleStops(STOPS_S, 0), 2.15);
  assert.equal(sampleStops(STOPS_S, 1), 1.12);

  // Midpoint between p=0 and p=0.32 -> smoothstep(0.5) === 0.5
  const midY = sampleStops(STOPS_Y, 0.16);
  assert.ok(Math.abs(midY - (-4.5 + 0.55) / 2) < 1e-9);
});

test("computeScrollProgress handles zero scrollable height and clamps bounds", () => {
  assert.equal(computeScrollProgress(0, 900, 900), 0);
  assert.equal(computeScrollProgress(-100, 2000, 900), 0);
  assert.equal(computeScrollProgress(550, 2000, 900), 0.5);
  assert.equal(computeScrollProgress(5000, 2000, 900), 1);
});

test("computeEntryOffset eases from ENTRY_START_Y to 0 and skips on reduced motion", () => {
  assert.equal(computeEntryOffset(0, false), ENTRY_START_Y);
  assert.equal(computeEntryOffset(ENTRY_DURATION_SEC, false), 0);
  assert.equal(computeEntryOffset(ENTRY_DURATION_SEC + 1, false), 0);
  assert.equal(computeEntryOffset(0, true), 0);
  assert.equal(computeEntryOffset(null, false), 0);
});

test("computeTargetTransform scales lateral X motion on narrow viewports", () => {
  const desktop = computeTargetTransform(0.32, 1440);
  assert.ok(Math.abs(desktop.x - -3.1) < 1e-9);

  const mobile = computeTargetTransform(0.32, 390);
  assert.ok(Math.abs(mobile.x - -3.1 * 0.5) < 1e-9);
  assert.equal(clamp(5, 0, 3), 3);
});
