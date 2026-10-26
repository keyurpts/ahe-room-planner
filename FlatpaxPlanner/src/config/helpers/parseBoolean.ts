export function parseBoolean(value: string | undefined): boolean {
  if (value === undefined || value === '' || value === 'false') return false;
  if (value === 'true') return true;
  throw new Error('VITE_ENABLE_ANALYTICS must be true or false.');
}