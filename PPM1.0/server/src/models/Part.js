const mongoose = require('mongoose');

// 生成Part ID (基于分类和编号)
const generatePartId = (category, index) => {
  const categoryAbbr = {
    'Resistors': 'RES',
    'Capacitors': 'CAP',
    'Inductors': 'IND',
    'Diodes': 'DIO',
    'Transistors': 'TRA',
    'Integrated Circuits': 'IC',
    'Voltage Regulators': 'VR',
    'Power Supplies': 'PS',
    'Temperature Sensors': 'TS',
    'Motion Sensors': 'MS',
    'Optical Sensors': 'OS',
    'Board Connectors': 'BC',
    'Cable Connectors': 'CC',
    'Crystal Oscillators': 'XO',
    'Crystals': 'XTAL'
  };
  
  const abbr = categoryAbbr[category] || 'PAR';
  const number = (index + 1).toString().padStart(4, '0');
  return `${abbr}${number}`;
};

const partSchema = new mongoose.Schema({
  part_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  part_no: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  vendor: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  position: {
    type: String,
    enum: ['Top Side', 'Bottom Side', 'Internal', 'External'],
    default: 'Top Side'
  },
  spec: {
    type: String,
    trim: true
  },
  product_id: {
    type: String,
    trim: true
  },
  product_name: {
    type: String,
    trim: true
  },
  version: {
    type: String,
    trim: true
  },
  product_line: {
    type: String,
    trim: true
  },
  source_bom_id: {
    type: String,
    trim: true
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
partSchema.index({ category: 1 });
partSchema.index({ name: 1 });

module.exports = mongoose.model('Part', partSchema);