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
      resume = false;
      // eslint-disable-next-line no-await-in-loop
      await wait(500);
    }
  } while (!resume);
  return res;
}
