const BOM = require('../models/BOM');
const Part = require('../models/Part');
const Product = require('../models/Product');

// Get all BOMs
exports.getAllBOMs = async (req, res) => {
  try {
    const { page = 1, limit = 20, bom_id, status } = req.query;
    
    // Build filter
    const filter = {};
    if (bom_id) filter.bom_id = bom_id;
    if (status) filter.status = status;
    
    // Get BOMs with pagination and populate related data
    const boms = await BOM.find(filter)
      .populate('parts.part_id')
      .populate('product_id')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    // Get total count
    const total = await BOM.countDocuments(filter);
    
    res.json({
      boms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get BOM by ID
exports.getBOMById = async (req, res) => {
  try {
    const bom = await BOM.findById(req.params.id)
      .populate('parts.part_id')
      .populate('product_id');
    if (!bom) {
      return res.status(404).json({ error: 'BOM not found' });
    }
    res.json(bom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create BOM
exports.createBOM = async (req, res) => {
  try {
    // 根据需求定义状态逻辑
    const { bom_name, product_id, version, parts, product_line, status } = req.body;
    
    // 检查必填字段是否完整
    const hasMissingFields = !bom_name || !product_id || !version;
    const hasNoParts = !parts || parts.length === 0;
    
    // 根据需求定义状态逻辑：
    // 1. draft: 如果缺少一个值或以上，保存后status为draft
    // 2. inactive: 如果所有值已经选择，但Manipulation下拉值是inactive，保存后status为inactive
    // 3. active: 如果所有值已经选择，且Manipulation下拉值是active，保存后status为active
    let finalStatus = status || 'draft';
    
    // 如果缺少必填字段或没有零件，强制设置为draft状态
    if (hasMissingFields || hasNoParts) {
      finalStatus = 'draft';
    }
    // 如果所有字段完整，但用户选择的是inactive，保持inactive
    else if (status === 'inactive') {
      finalStatus = 'inactive';
    }
    // 如果所有字段完整，且用户选择的是active，保持active
    else if (status === 'active') {
      finalStatus = 'active';
    }
    // 如果所有字段完整，但用户选择的是draft，保持draft
    else if (status === 'draft') {
      finalStatus = 'draft';
    }
    
    // Ensure all fields are saved correctly, especially parts data
    const bomData = {
      ...req.body,
      status: finalStatus,
      push_status: finalStatus === 'active' ? 'push' : 'push', // Active状态可推送，其他状态显示Push但置灰
      // Ensure parts data format is correct, part_id is ObjectId
      parts: req.body.parts ? req.body.parts.map(part => ({
        part_id: part.part_id, // ObjectId reference
        quantity: part.quantity,
        position: part.position
      })) : []
    };
    
    const bom = new BOM(bomData);
    await bom.save();
    
    // Populate the saved BOM before returning
    const populatedBom = await BOM.findById(bom._id)
      .populate('parts.part_id')
      .populate('product_id');
    
    res.status(201).json(populatedBom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update BOM
exports.updateBOM = async (req, res) => {
  try {
    // Ensure all fields are saved correctly, especially parts data
    const updateData = {
      ...req.body,
      // Ensure parts data format is correct, part_id is ObjectId
      parts: req.body.parts ? req.body.parts.map(part => ({
        part_id: part.part_id, // ObjectId reference
        quantity: part.quantity,
        position: part.position
      })) : []
    };
    
    const bom = await BOM.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('parts.part_id')
      .populate('product_id');
      
    if (!bom) {
      return res.status(404).json({ error: 'BOM not found' });
    }
    res.json(bom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete BOM
exports.deleteBOM = async (req, res) => {
  try {
    const bom = await BOM.findByIdAndDelete(req.params.id);
    if (!bom) {
      return res.status(404).json({ error: 'BOM not found' });
    }
    res.json({ message: 'BOM deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete multiple BOMs (Batch delete)
exports.deleteBOMs = async (req, res) => {
  try {
    const { bomIds } = req.body;
    
    if (!bomIds || !Array.isArray(bomIds) || bomIds.length === 0) {
      return res.status(400).json({ error: 'bomIds array is required' });
    }
    
    const result = await BOM.deleteMany({ _id: { $in: bomIds } });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No BOMs found to delete' });
    }
    
    res.json({ 
      message: `${result.deletedCount} BOM(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Perform alignment
exports.performAlignment = async (req, res) => {
  try {
    const { bomId } = req.params;
    const { strategy } = req.body;
    
    // Find the BOM
    const bom = await BOM.findById(bomId).populate('parts.part_id');
    if (!bom) {
      return res.status(404).json({ error: 'BOM not found' });
    }
    
    // Simulate alignment process
    // In a real implementation, this would involve complex business logic
    const alignmentResult = {
      bomId: bom._id,
      strategy,
      status: 'completed',
      result: 'Alignment completed successfully',
      timestamp: new Date()
    };
    
    res.json(alignmentResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};