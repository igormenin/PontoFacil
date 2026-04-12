import { keysToSnake } from '../utils/mapper.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Update request objects with parsed and snake_cased data
    // This allows the controllers/services to work with snake_case internally
    if (parsed.body) {
      Object.assign(req.body, keysToSnake(parsed.body));
    }
    
    // Note: parsed.params and parsed.query left as-is to prevent Express getter issues
    
    next();
  } catch (err) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: err.errors || err.issues || [],
        status: 400,
      },
    });
  }
};
