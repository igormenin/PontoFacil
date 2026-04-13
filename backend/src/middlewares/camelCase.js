import { keysToCamel } from '../utils/mapper.js';

/**
 * Express middleware to convert all JSON response keys to camelCase.
 * It intercepts the original `res.json` and applies a transformation.
 */
export const camelCaseMiddleware = (req, res, next) => {
  // Skip transformation for sync routes to maintain compatibility with Mobile sync protocol
  if (req.path.includes('/sync')) {
    return next();
  }

  const originalJson = res.json;

  res.json = (body) => {
    // Only transform if body is an object or array
    if (body && (typeof body === 'object' || Array.isArray(body))) {
      body = keysToCamel(body);
    }
    
    // Call the original res.json with the transformed body
    return originalJson.call(res, body);
  };

  next();
};
