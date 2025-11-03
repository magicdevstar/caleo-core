import { GeoLocationSensorState } from "react-use/lib/useGeolocation";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getLocationWithRequest = (): Promise<GeolocationPosition | null> => new Promise((resolve) => {
  if (!navigator.geolocation) {
    resolve(null);
  }

  const success = (position: GeolocationPosition) => {
    resolve(position);
  };

  const err = (error: GeolocationPositionError) => {
    // TODO: I saw a weird error at one point that might prevent
    // locations from being saved the first time the button is clicked 🤔
    // I can't recreate it though.
    console.error(error);
    resolve(null);
  };

  navigator.geolocation.getCurrentPosition(success, err);
});

export const getLocation = async (): Promise<GeolocationPosition | null> => {
  let resume = true;
  let res: GeolocationPosition | null = null;
  do {
    try {
      // eslint-disable-next-line no-await-in-loop
      res = await getLocationWithRequest();
      resume = true;
    } catch(error) {
      console.error('Error getting location, retrying...', error);
      resume = false;
      // eslint-disable-next-line no-await-in-loop
      await wait(500);
    }
  } while (!resume);
  return res;
}

export const isWithinPolygon = (coords: [number, number][], { latitude, longitude }: GeoLocationSensorState) => {
  if (!coords || coords.length < 3 || !latitude || !longitude) return false;

  let inside = false;
  // eslint-disable-next-line no-plusplus
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [xi, yi] = coords[i];
    const [xj, yj] = coords[j];
    const intersect = yi > latitude !== yj > latitude && (longitude < (xj - xi) * (latitude - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const getCenterOfPolygon = (coords: [number, number][]) => {
  if (!coords || (coords || []).filter(Boolean).length === 0) return null;

  const sum = coords.reduce(([accX, accY], [x, y]) => [accX + x, accY + y], [0, 0]);
  return [sum[0] / coords.length, sum[1] / coords.length];
}

export const getCenterOfPolygons = (polygons: (number[][] | null)[]) => {
  if (!polygons || polygons.length === 0) return null;
  
  const validPolygons = polygons.filter(Boolean) as number[][][];
  if (validPolygons.length === 0) return null;
  
  // Collect all coordinates from all polygons
  const allCoords: [number, number][] = [];
  validPolygons.forEach(polygon => {
    if (polygon && polygon.length > 0) {
      polygon.forEach(coord => {
        if (coord && coord.length >= 2) {
          allCoords.push([coord[0], coord[1]]);
        }
      });
    }
  });
  
  if (allCoords.length === 0) return null;
  
  const sum = allCoords.reduce(([accX, accY], [x, y]) => [accX + x, accY + y], [0, 0]);
  return [sum[0] / allCoords.length, sum[1] / allCoords.length];
}
