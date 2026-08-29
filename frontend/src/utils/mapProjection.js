const SVG_WIDTH = 1920;
const SVG_HEIGHT = 1080;

const MAP_LEFT = 26;
const MAP_RIGHT = 1882;
const MAP_TOP = 106;
const MAP_BOTTOM = 970;

const MIN_LONGITUDE = -169.5;
const MAX_LONGITUDE = 180;

const MAX_LATITUDE = 83.6;
const MIN_LATITUDE = -55.98;

/*
  These are our known calibration anchors.

  targetX / targetY are percentages inside the actual
  1920x1080 buddies-map.svg.

  The first six preserve the positions we already verified visually.

  Glen Massey is corrected onto New Zealand's North Island instead
  of sitting out in the Tasman Sea.
*/
const CALIBRATION_POINTS = [
  {
    name: "Orange",
    latitude: 33.7872568,
    longitude: -117.850308,
    targetX: 16.23134,
    targetY: 38.36489,
  },

  {
    name: "Lubbock",
    latitude: 33.5855677,
    longitude: -101.8470215,
    targetX: 20.39205,
    targetY: 38.48049,
  },

  {
    name: "Boise",
    latitude: 43.6166163,
    longitude: -116.200886,
    targetX: 16.66018,
    targetY: 32.73121,
  },

  {
    name: "Atlanta",
    latitude: 33.7544657,
    longitude: -84.3898151,
    targetX: 24.93075,
    targetY: 38.38368,
  },

  {
    name: "Stuttgart",
    latitude: 48.7784485,
    longitude: 9.1800132,
    targetX: 49.25802,
    targetY: 29.77272,
  },

  {
    name: "Vicosa",
    latitude: -20.7538586,
    longitude: -42.8815888,
    targetX: 35.72250,
    targetY: 69.62502,
  },

  {
    name: "Glen Massey",
    latitude: -37.6724737,
    longitude: 175.0693419,
    targetX: 94.6,
    targetY: 80,
  },
];

const getBasePosition = (latitude, longitude) => {
  const svgX =
    MAP_LEFT +
    ((longitude - MIN_LONGITUDE) /
      (MAX_LONGITUDE - MIN_LONGITUDE)) *
      (MAP_RIGHT - MAP_LEFT);

  const svgY =
    MAP_TOP +
    ((MAX_LATITUDE - latitude) /
      (MAX_LATITUDE - MIN_LATITUDE)) *
      (MAP_BOTTOM - MAP_TOP);

  return {
    x: (svgX / SVG_WIDTH) * 100,
    y: (svgY / SVG_HEIGHT) * 100,
  };
};

/*
  Longitude spans roughly 360 degrees while latitude spans 180,
  so normalize them before calculating anchor distance.
*/
const getNormalizedDistance = (
  latitude,
  longitude,
  anchorLatitude,
  anchorLongitude
) => {
  const longitudeDistance =
    (longitude - anchorLongitude) / 360;

  const latitudeDistance =
    (latitude - anchorLatitude) / 180;

  return Math.sqrt(
    longitudeDistance * longitudeDistance +
      latitudeDistance * latitudeDistance
  );
};

const getCalibrationCorrection = (
  latitude,
  longitude
) => {
  let weightedXCorrection = 0;
  let weightedYCorrection = 0;
  let totalWeight = 0;

  for (const point of CALIBRATION_POINTS) {
    const baseAnchor = getBasePosition(
      point.latitude,
      point.longitude
    );

    const correctionX =
      point.targetX - baseAnchor.x;

    const correctionY =
      point.targetY - baseAnchor.y;

    const distance = getNormalizedDistance(
      latitude,
      longitude,
      point.latitude,
      point.longitude
    );

    /*
      If we're essentially sitting exactly on an anchor,
      return that anchor's correction directly.
    */
    if (distance < 0.000001) {
      return {
        x: correctionX,
        y: correctionY,
      };
    }

    /*
      Inverse-distance-squared weighting.

      Nearby calibration points matter much more than
      points on the opposite side of the planet.
    */
    const weight = 1 / (distance * distance);

    weightedXCorrection += correctionX * weight;
    weightedYCorrection += correctionY * weight;
    totalWeight += weight;
  }

  return {
    x: weightedXCorrection / totalWeight,
    y: weightedYCorrection / totalWeight,
  };
};

export const latLonToMapPosition = (
  latitude,
  longitude
) => {
  const basePosition = getBasePosition(
    latitude,
    longitude
  );

  const correction = getCalibrationCorrection(
    latitude,
    longitude
  );

  return {
    x: basePosition.x + correction.x,
    y: basePosition.y + correction.y,
  };
};