const mongoose = require('mongoose');

const partMappingSchema = new mongoose.Schema({
  part_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Part',
    required: true
  },
  target_part_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TargetPart',
    required: true
  },
  match_strength: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  compatibility: {
    type: String,
    enum: ['full', 'partial', 'conditional'],
    default: 'partial'
  },
  validation_status: {
    type: String,
    enum: ['pending', 'validated', 'rejected'],
    default: 'pending'
  },
  validation_notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
partMappingSchema.index({ part_id: 1, target_part_id: 1 }, { unique: true });
partMappingSchema.index({ target_part_id: 1 });
partMappingSchema.index({ match_strength: 1 });
partMappingSchema.index({ validation_status: 1 });

module.exports = mongoose.model('PartMapping', partMappingSchema);