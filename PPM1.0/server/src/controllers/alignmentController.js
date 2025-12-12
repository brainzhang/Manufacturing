const Alignment = require('../models/Alignment');
const BOM = require('../models/BOM');
const PNMap = require('../models/PNMap');

// @desc    Get all alignments
// @route   GET /api/v1/alignments
// @access  Public
exports.getAllAlignments = async (req, res, next) => {
  try {
    const alignments = await Alignment.find().populate('bom_id pn_id');
    res.status(200).json({
      success: true,
      count: alignments.length,
      data: alignments
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single alignment
// @route   GET /api/v1/alignments/:id
// @access  Public
exports.getAlignmentById = async (req, res, next) => {
  try {
    const alignment = await Alignment.findById(req.params.id).populate('bom_id pn_id');
    
    if (!alignment) {
      return res.status(404).json({
        success: false,
        error: 'Alignment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: alignment
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Perform new alignment
// @route   POST /api/v1/alignments
// @access  Public
exports.performAlignment = async (req, res, next) => {
  try {
    const alignment = await Alignment.create(req.body);
    res.status(201).json({
      success: true,
      data: alignment
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// @desc    Update alignment
// @route   PUT /api/v1/alignments/:id
// @access  Public
exports.updateAlignment = async (req, res, next) => {
  try {
    const alignment = await Alignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!alignment) {
      return res.status(404).json({
        success: false,
        error: 'Alignment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: alignment
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};