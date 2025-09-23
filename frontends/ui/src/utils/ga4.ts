import ReactGA from 'react-ga4';

export const GADomains: Record<string, string> = {
  'dev.caleopro.com': 'G-WSNZSY3LDD',
  'lasd-dev.caleopro.com': 'G-MK7TNZ3K2S',
  'app.caleopro.com': 'G-LM1DMC2DRF',
  'lasd.caleopro.com': 'G-2GTNEP3J38',
  'lvmpd.caleopro.com': 'G-6VR6G5SV58',
};
const domain = window.location.hostname;
export const hasGAKey = GADomains[domain] !== undefined;

export const initG4 = () => {
  if (hasGAKey) {
    ReactGA.initialize(GADomains[domain]);
  }
};
