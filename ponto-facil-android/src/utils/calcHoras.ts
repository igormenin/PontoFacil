/**
 * Calculates duration between two HH:mm strings in decimal hours.
 * @param start 'HH:mm'
 * @param end 'HH:mm'
 * @returns number
 */
export const calculateDuration = (start: string, end: string): number => {
  if (!start || !end) return 0;
  
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  
  const d1 = new Date(2000, 0, 1, h1, m1);
  const d2 = new Date(2000, 0, 1, h2, m2);
  
  if (d2 < d1) d2.setDate(d2.getDate() + 1); // Handle overnight
  
  const diffMs = d2.getTime() - d1.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  
  return parseFloat(hours.toFixed(2));
};

/**
 * Formats a decimal hour number to HH:mm string.
 */
export const formatDecimalToTime = (decimal: number): string => {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
