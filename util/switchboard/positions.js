import { map, mapObjIndexed, pickAll } from 'ramda';

const parseStringPositions = map(JSON.parse);

function parsePositionCoordinates(position) {
  const coordinates = pickAll(['x', 'y', 'z', 'yaw', 'pitch'], position);
  return mapObjIndexed(parseFloat, coordinates);
}

function calculateDistance(firstPosition, secondPosition) {
  const firstCoordinates = parsePositionCoordinates(firstPosition);
  const secondCoordinates = parsePositionCoordinates(secondPosition);
  return Math.sqrt(
    (secondCoordinates.x - firstCoordinates.x) ** 2 +
      (secondCoordinates.y - firstCoordinates.y) ** 2 +
      (secondCoordinates.z - firstCoordinates.z) ** 2
  );
}

function degToRad(deg) {
  return (Math.PI / 180) * deg;
}

function calculateForwardDirectionVector(position) {
  return {
    x: -Math.sin(degToRad(position.yaw)),
    y: -Math.sin(degToRad(position.pitch)),
    z: Math.cos(degToRad(position.yaw)),
  };
}

function calculateHeadDirectionVector(position) {
  return {
    x: -Math.sin(degToRad(position.yaw)),
    y: -Math.sin(degToRad(position.pitch) - Math.PI / 2),
    z: Math.cos(degToRad(position.yaw)),
  };
}

export {
  parseStringPositions,
  calculateDistance,
  calculateForwardDirectionVector,
  calculateHeadDirectionVector,
};
