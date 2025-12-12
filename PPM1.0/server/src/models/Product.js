const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  product_line: {
    type: String,
    required: true,
    trim: true
  },
  platform: {
    type: String,
    enum: ['desktop', 'laptop', 'server', 'embedded', 'mobile'],
    default: 'desktop'
  },
  family: {
    type: String,
    enum: ['intel_core', 'intel_xeon', 'amd_ryzen', 'amd_epyc', 'arm_cortex', 'qualcomm_snapdragon', 'nvidia_tegra'],
    default: 'intel_core'
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['development', 'production', 'end_of_life'],
    default: 'development'
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ product_id: 1 });
productSchema.index({ model: 1 });
productSchema.index({ product_line: 1 });
productSchema.index({ status: 1 });

module.exports = mongoose.model('Product', productSchema);