const mongoose = require('mongoose');

const alignmentSchema = new mongoose.Schema({
  bom_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BOM',
    required: true
  },
  pn_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PNMap',
    required: true
  },
  target_pn: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  result: {
    type: String,
    trim: true
  },
  error_message: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
alignmentSchema.index({ bom_id: 1 });
alignmentSchema.index({ pn_id: 1 });
alignmentSchema.index({ status: 1 });

module.exports = mongoose.model('Alignment', alignmentSchema);