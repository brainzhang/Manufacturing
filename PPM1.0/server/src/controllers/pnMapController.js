const PNMap = require('../models/PNMap');
const Part = require('../models/Part');

// @desc    Get all PN maps
// @route   GET /api/v1/pn-maps
// @access  Public
exports.getAllPNMaps = async (req, res, next) => {
  try {
    const pnMaps = await PNMap.find().populate('part_id');
    res.status(200).json({
      success: true,
      count: pnMaps.length,
      data: pnMaps
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single PN map
// @route   GET /api/v1/pn-maps/:id
// @access  Public
exports.getPNMapById = async (req, res, next) => {
  try {
    const pnMap = await PNMap.findById(req.params.id).populate('part_id');
    
    if (!pnMap) {
      return res.status(404).json({
        success: false,
        error: 'PN Map not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: pnMap
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new PN map
// @route   POST /api/v1/pn-maps
// @access  Public
exports.createPNMap = async (req, res, next) => {
  try {
    const pnMap = await PNMap.create(req.body);
    res.status(201).json({
      success: true,
      data: pnMap
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

// @desc    Update PN map
// @route   PUT /api/v1/pn-maps/:id
// @access  Public
exports.updatePNMap = async (req, res, next) => {
  try {
    const pnMap = await PNMap.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!pnMap) {
      return res.status(404).json({
        success: false,
        error: 'PN Map not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: pnMap
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

// @desc    Delete PN map
// @route   DELETE /api/v1/pn-maps/:id
// @access  Public
exports.deletePNMap = async (req, res, next) => {
  try {
    const pnMap = await PNMap.findByIdAndDelete(req.params.id);
    
    if (!pnMap) {
      return res.status(404).json({
        success: false,
        error: 'PN Map not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};