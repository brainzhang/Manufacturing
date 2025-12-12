const mongoose = require('mongoose');

const productTargetPartSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  target_part_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TargetPart',
    required: true
  },
  required_quantity: {
    type: Number,
    required: true,
    min: 1
  },
  position: {
    type: String,
    trim: true
  },
  is_optional: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
productTargetPartSchema.index({ product_id: 1, target_part_id: 1 }, { unique: true });
productTargetPartSchema.index({ target_part_id: 1 });

module.exports = mongoose.model('ProductTargetPart', productTargetPartSchema);