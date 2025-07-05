import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi, { Schema } from 'joi';

// Custom request type with validated fields
export interface ValidatedRequest extends Request {
  validatedBody?: any;
  validatedParams?: any;
  validatedQuery?: any;
}

// Generic body validator
export const validateBody = (schema: Schema): RequestHandler => {
  return (req: ValidatedRequest, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const errors = error.details.map((d) => d.message);
      res.status(400).json({ success: false, message: 'Validation error', errors });
      return;
    }

    req.body = value;
    req.validatedBody = value;
    next();
  };
};

// Generic params validator
export const validateParams = (schema: Schema): RequestHandler => {
  return (req: ValidatedRequest, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const errors = error.details.map((d) => d.message);
      res.status(400).json({ success: false, message: 'Parameter validation error', errors });
      return;
    }

    req.params = value;
    req.validatedParams = value;
    next();
  };
};

// Generic query validator (fixed: do not overwrite req.query)
export const validateQuery = (schema: Schema): RequestHandler => {
  return (req: ValidatedRequest, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const errors = error.details.map((d) => d.message);
      res.status(400).json({ success: false, message: 'Query validation error', errors });
      return;
    }

    // only set our own property—do not overwrite the built-in req.query
    req.validatedQuery = value;
    next();
  };
};

// Combined validator
export const validateRequest = (
  bodySchema: Schema,
  paramsSchema?: Schema,
  querySchema?: Schema
): RequestHandler => {
  return (req: ValidatedRequest, res: Response, next: NextFunction) => {
    // Body
    if (bodySchema) {
      const { error, value } = bodySchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        const errors = error.details.map((d) => d.message);
        res.status(400).json({ success: false, message: 'Body validation error', errors });
        return;
      }
      req.body = value;
      req.validatedBody = value;
    }

    // Params
    if (paramsSchema) {
      const { error, value } = paramsSchema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        const errors = error.details.map((d) => d.message);
        res.status(400).json({ success: false, message: 'Parameter validation error', errors });
        return;
      }
      req.params = value;
      req.validatedParams = value;
    }

    // Query (fixed: only set validatedQuery)
    if (querySchema) {
      const { error, value } = querySchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        const errors = error.details.map((d) => d.message);
        res.status(400).json({ success: false, message: 'Query validation error', errors });
        return;
      }
      req.validatedQuery = value;
    }

    next();
  };
};

// Specialized param validators
export const validateMongoId = (paramName = 'id'): RequestHandler => {
  const schema = Joi.object({
    [paramName]: Joi.string().hex().length(24).required(),
  });
  return validateParams(schema);
};

export const validateProductId = (paramName = 'productId'): RequestHandler => {
  const schema = Joi.object({
    [paramName]: Joi.string().hex().length(24).required(),
  });
  return validateParams(schema);
};

export const validateLocationId = (paramName = 'locationId'): RequestHandler => {
  const schema = Joi.object({
    [paramName]: Joi.string().hex().length(24).required(),
  });
  return validateParams(schema);
};

export const validateStockAdjustmentType = (paramName = 'type'): RequestHandler => {
  const schema = Joi.object({
    [paramName]: Joi.string().valid('addition', 'subtraction').required(),
  });
  return validateParams(schema);
};
