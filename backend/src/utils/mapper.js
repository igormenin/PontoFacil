/**
 * Converts snake_case strings to camelCase.
 * @param {string} str 
 * @returns {string}
 */
const toCamel = (str) => {
  return str.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

/**
 * Converts camelCase strings to snake_case.
 * @param {string} str 
 * @returns {string}
 */
const toSnake = (str) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Checks if a value is an object (and not null or array or Date).
 * @param {any} o 
 * @returns {boolean}
 */
const isObject = (o) => {
  return o === Object(o) && !Array.isArray(o) && typeof o !== 'function' && !(o instanceof Date);
};

/**
 * Recursively converts object keys from snake_case to camelCase.
 * @param {any} o 
 * @returns {any}
 */
export const keysToCamel = (o) => {
  if (isObject(o)) {
    const n = {};

    Object.keys(o).forEach((k) => {
      n[toCamel(k)] = keysToCamel(o[k]);
    });

    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => {
      return keysToCamel(i);
    });
  }

  return o;
};

/**
 * Recursively converts object keys from camelCase to snake_case.
 * @param {any} o 
 * @returns {any}
 */
export const keysToSnake = (o) => {
  if (isObject(o)) {
    const n = {};

    Object.keys(o).forEach((k) => {
      n[toSnake(k)] = keysToSnake(o[k]);
    });

    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => {
      return keysToSnake(i);
    });
  }

  return o;
};
