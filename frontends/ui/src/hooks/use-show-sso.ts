const ignoreDomains = [
  'localhost:3000',
  '192',
  'dev',
  'lvmpd',
  'app'
];
const [subdomain] = window.location.host.split('.');
export const showSSO = !ignoreDomains.includes(subdomain);

export function useShowSSO() {
  return {
    showSSO,
  };
}