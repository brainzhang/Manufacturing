const mongoose = require('mongoose');

const pnMapSchema = new mongoose.Schema({
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
  target_pn: {
    type: String,
    required: true,
    trim: true
  },
  match_strength: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  source: {
    type: String,
    enum: ['manual', 'auto_generated', 'imported'],
    default: 'manual'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_review'],
    default: 'active'
  },
  audit_trail: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'approved', 'rejected'],
      required: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    comments: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Indexes
pnMapSchema.index({ part_id: 1 });
pnMapSchema.index({ target_part_id: 1 });
pnMapSchema.index({ target_pn: 1 });
pnMapSchema.index({ status: 1 });
pnMapSchema.index({ part_id: 1, target_part_id: 1 }, { unique: true });

module.exports = mongoose.model('PNMap', pnMapSchema);