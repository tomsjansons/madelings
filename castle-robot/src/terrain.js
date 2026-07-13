export const BRIDGE_TOP = 0.86;
export const WATER_NECK_DEPTH = -3.34;

export function getRobotSurfaceY(x, z) {
  const inMoat = z >= -72.5 && z <= -53.5;
  if (inMoat) return Math.abs(x) <= 5.25 ? BRIDGE_TOP : WATER_NECK_DEPTH;

  // Ramp from the inner courtyard to the western wall walk.
  const onWallRamp = x <= -28 && x >= -38 && z >= -126 && z <= -111;
  if (onWallRamp) return ((-x - 28) / 10) * 10;

  const onWesternWall = x >= -43.5 && x <= -36 && z >= -151 && z <= -82;
  if (onWesternWall) return 10;
  return 0;
}
