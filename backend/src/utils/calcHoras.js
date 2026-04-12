/**
 * Calculates duration between two HH:mm strings in decimal hours.
 * @param {string} start 'HH:mm'
 * @param {string} end 'HH:mm'
 * @returns {number}
 */
export const calculateDuration = (start, end) => {
  if (!start || !end) return 0;
  
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  
  const d1 = new Date(2000, 0, 1, h1, m1);
  const d2 = new Date(2000, 0, 1, h2, m2);
  
  if (d2 < d1) d2.setDate(d2.getDate() + 1); // Handle overnight
  
  const diffMs = d2 - d1;
  const hours = diffMs / (1000 * 60 * 60);
  
  return parseFloat(hours.toFixed(2));
};
