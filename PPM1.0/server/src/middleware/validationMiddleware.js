const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

// User validation schema
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'product_manager', 'sales', 'procurement', 'finance').optional()
});

// Part validation schema
const partSchema = Joi.object({
  part_id: Joi.string().required(),
  category: Joi.string().required(),
  name: Joi.string().required(),
  spec: Joi.string().optional(),
  vendor: Joi.string().optional(),
  compatibility: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('active', 'inactive', 'discarded').optional()
});

// BOM validation schema
const bomSchema = Joi.object({
  model: Joi.string().required(),
  version: Joi.string().required(),
  product_line: Joi.string().optional(),
  parts: Joi.array().items(Joi.object({
    part_id: Joi.string().required(),
    quantity: Joi.number().min(1).required(),
    position: Joi.string().optional()
  })).optional(),
  status: Joi.string().valid('draft', 'active', 'inactive', 'discarded').optional()
});

// Validation schemas export
module.exports = {
  validate,
  userValidation: validate(userSchema),
  partValidation: validate(partSchema),
  bomValidation: validate(bomSchema)
};