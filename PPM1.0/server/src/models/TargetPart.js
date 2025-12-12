const mongoose = require('mongoose');

const targetPartSchema = new mongoose.Schema({
  target_part_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  function_description: {
    type: String,
    required: true,
    trim: true
  },
  technical_requirements: {
    type: String,
    trim: true
  },
  interface_spec: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  level1_category: {
    type: String,
    trim: true,
    required: true
  },
  level2_category: {
    type: String,
    trim: true,
    required: true
  },
  physical_parameters: {
    voltage_range: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 }
    },
    current_range: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 10 }
    },
    power_range: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 }
    },
    frequency_range: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 1000 }
    },
    temperature_range: {
      min: { type: Number, default: -40 },
      max: { type: Number, default: 125 }
    },
    package_type: {
      type: String,
      enum: ['SMD', 'THT', 'BGA', 'QFP', 'SOT', 'DIP', 'TO-220', 'TO-92', 'Other'],
      default: 'SMD'
    },
    pin_count: {
      type: Number,
      default: 8
    }
  },
  auto_generation_rules: {
    enabled: {
      type: Boolean,
      default: false
    },
    priority_level: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    default_parameters: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discarded'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
targetPartSchema.index({ target_part_id: 1 });
targetPartSchema.index({ category: 1 });
targetPartSchema.index({ status: 1 });

module.exports = mongoose.model('TargetPart', targetPartSchema);