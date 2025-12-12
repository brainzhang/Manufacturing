const mongoose = require('mongoose');

// 生成BOM ID (BOM + 4位数字)
const generateBOMId = () => {
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BOM${randomNum}`;
};

// 生成Part ID (PART + 4位数字)
const generatePartId = (index = 0) => {
  const number = (index + 1).toString().padStart(4, '0');
  return `PART${number}`;
};

// 生成Product ID (PROD + 4位数字)
const generateProductId = () => {
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PROD${randomNum}`;
};

const bomSchema = new mongoose.Schema({
  bom_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: generateBOMId
  },
  bom_name: {
    type: String,
    required: true,
    trim: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  parts: [{
    part_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Part',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    position: {
      type: String,
      trim: true
    }
  }],
  version: {
    type: String,
    required: true,
    trim: true
  },
  product_line: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive'],
    default: 'draft'
  },
  push_status: {
    type: String,
    enum: ['push', 'pushed'],
    default: 'push'
  }
}, {
  timestamps: true
});

// Indexes
bomSchema.index({ bom_id: 1 });
bomSchema.index({ bom_name: 1 });
bomSchema.index({ part_id: 1 });
bomSchema.index({ product_id: 1 });
bomSchema.index({ version: 1 });
bomSchema.index({ product_line: 1 });
bomSchema.index({ status: 1 });

module.exports = mongoose.model('BOM', bomSchema);