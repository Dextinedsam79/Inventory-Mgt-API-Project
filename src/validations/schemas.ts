import Joi from 'joi';

// Location
export const createLocationSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zip: Joi.number().required(),
});

// in validations/schemas.ts
export const updateLocationSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  address: Joi.string().max(500).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  zip: Joi.string().max(20).optional(),
}).min(1); // require at least one key be present


// Product
export const createProductSchema = Joi.object({
  name: Joi.string().max(255).required(),
  sku: Joi.string().max(50).uppercase().required(),
  description: Joi.string().max(1000).optional(),
  category: Joi.string().max(100).optional(),
  unitOfMeasurement: Joi.string().max(20).optional(),
  price: Joi.number().min(0).required(),
  isActive: Joi.boolean().optional(),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().max(255),
  sku: Joi.string().max(50).uppercase(),
  description: Joi.string().max(1000),
  category: Joi.string().max(100),
  unitOfMeasurement: Joi.string().max(20),
  price: Joi.number().min(0),
  isActive: Joi.boolean(),
}).min(1); // require at least one key be present

// Stock
export const lowStockQuerySchema = Joi.object({
  threshold: Joi.number().integer().min(0).required(),
});

export const mongoIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24),
  productId: Joi.string().hex().length(24),
});
export const productIdParamSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
});
export const locationIdParamSchema = Joi.object({
  locationId: Joi.string().hex().length(24).required()
});


export const initialStockLevelSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  locationId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(0).required(),
});

export const stockAdjustmentSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  locationId: Joi.string().hex().length(24).required(),
  type: Joi.string().valid('add', 'remove', 'damage', 'loss', 'initial').required(),
  quantityChange: Joi.number().integer().required(),
  reason: Joi.string().optional(),
  adjustedBy: Joi.string().optional()
});

export const stockTransferSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  fromLocationId: Joi.string().hex().length(24).required(),
  toLocationId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().positive().required(),
});
