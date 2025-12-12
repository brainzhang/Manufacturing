const Part = require('../models/Part');
const mongoose = require('mongoose');

// Get all parts
exports.getAllParts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status } = req.query;
    
    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    // Get parts with pagination
    const parts = await Part.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    // Get total count
    const total = await Part.countDocuments(filter);
    
    res.json({
      parts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get part by ID
exports.getPartById = async (req, res) => {
  try {
    const part = await Part.findById(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }
    res.json(part);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create part
exports.createPart = async (req, res) => {
  try {
    const part = new Part(req.body);
    await part.save();
    res.status(201).json(part);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update part
exports.updatePart = async (req, res) => {
  try {
    const part = await Part.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }
    res.json(part);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete part
exports.deletePart = async (req, res) => {
  try {
    const part = await Part.findById(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }
    
    // 在删除Part之前，先找到所有包含该Part的BOM
    // 关键修复：确保使用有效的ObjectId来查找BOM
    const BOM = require('../models/BOM');
    const bomsWithThisPart = await BOM.find({
      'parts.part_id': part._id
    });
    
    // 删除Part
    await Part.findByIdAndDelete(req.params.id);
    
    // 同步更新BOMs状态：无论BOM的当前状态是什么，都设置为push，表示需要重新推送
    if (bomsWithThisPart.length > 0) {
      const bomIds = bomsWithThisPart.map(bom => bom._id);
      
      // 调试日志：显示找到的BOMs和它们的当前状态
      console.log(`找到 ${bomIds.length} 个包含被删除Part的BOMs`);
      console.log(`BOM IDs: ${bomIds.join(', ')}`);
      
      // 强制更新所有相关BOMs的状态为push
      const updateResult = await BOM.updateMany(
        { 
          _id: { $in: bomIds }
        },
        { 
          $set: { push_status: 'push' } 
        }
      );
      
      console.log(`Part删除后，同步更新了 ${updateResult.modifiedCount} 个BOM的状态为push`);
      console.log(`匹配的BOM数量: ${updateResult.matchedCount}`);
    } else {
      console.log('没有找到包含被删除Part的BOMs');
    }
    
    res.json({ 
      message: 'Part deleted successfully',
      updatedBOMs: bomsWithThisPart.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Batch delete parts
exports.deleteParts = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No part IDs provided for deletion' });
    }
    
    // 关键修复：用户提供的是字符串形式的part_id（如"PS0001"），不是ObjectId
    // 先根据part_id字符串找到对应的Part记录
    const partsToDelete = await Part.find({ part_id: { $in: ids } });
    
    if (partsToDelete.length === 0) {
      return res.status(404).json({ error: 'No parts found with the provided part IDs' });
    }
    
    // 获取这些Parts的_id（ObjectId格式）
    const partObjectIds = partsToDelete.map(part => part._id);
    
    // 在批量删除Parts之前，先找到所有包含这些Parts的BOM
    const BOM = require('../models/BOM');
    
    // 关键修复：BOM.parts.part_id存储的是Part的ObjectId，所以使用partObjectIds查找
    console.log(`正在查找包含以下Part ObjectIds的BOMs: ${partObjectIds.join(', ')}`);
    
    const bomsWithTheseParts = await BOM.find({
      'parts.part_id': { $in: partObjectIds }
    });
    
    // 详细调试信息
    console.log(`查询条件: {'parts.part_id': { $in: [${partObjectIds.join(', ')}] }}`);
    console.log(`找到 ${bomsWithTheseParts.length} 个包含被删除Parts的BOMs`);
    
    if (bomsWithTheseParts.length > 0) {
      console.log('找到的BOMs详情:');
      bomsWithTheseParts.forEach(bom => {
        console.log(`BOM ID: ${bom.bom_id}, 包含Parts: ${bom.parts.map(p => p.part_id).join(', ')}`);
      });
    }
    
    // 删除Parts
    const result = await Part.deleteMany({ _id: { $in: partObjectIds } });
    
    // 同步更新BOMs状态：无论BOM的当前状态是什么，都设置为push，表示需要重新推送
    if (bomsWithTheseParts.length > 0) {
      const bomIds = bomsWithTheseParts.map(bom => bom._id);
      
      // 调试日志：显示找到的BOMs和它们的当前状态
      console.log(`找到 ${bomIds.length} 个包含被删除Parts的BOMs`);
      console.log(`BOM IDs: ${bomIds.join(', ')}`);
      
      // 强制更新所有相关BOMs的状态为push
      const updateResult = await BOM.updateMany(
        { 
          _id: { $in: bomIds }
        },
        { 
          $set: { push_status: 'push' } 
        }
      );
      
      console.log(`批量删除Parts后，同步更新了 ${updateResult.modifiedCount} 个BOM的状态为push`);
      console.log(`匹配的BOM数量: ${updateResult.matchedCount}`);
    } else {
      console.log('没有找到包含被删除Parts的BOMs');
      console.log('可能的原因:');
      console.log('1. 这些Parts没有被任何BOM使用');
      console.log('2. BOM.parts.part_id字段存储的不是Part的ObjectId');
      console.log('3. 数据库连接问题');
    }
    
    res.json({ 
      message: `Successfully deleted ${result.deletedCount} parts`,
      deletedCount: result.deletedCount,
      updatedBOMs: bomsWithTheseParts.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete all parts
exports.deleteAllParts = async (req, res) => {
  try {
    // Confirm deletion with a safety check
    const { confirm } = req.query;
    
    if (confirm !== 'true') {
      return res.status(400).json({ 
        error: 'Safety check failed. Please add ?confirm=true to confirm deletion of all parts.' 
      });
    }
    
    // Get count before deletion for reporting
    const countBefore = await Part.countDocuments();
    
    if (countBefore === 0) {
      return res.json({ 
        message: 'No parts to delete',
        deletedCount: 0
      });
    }
    
    // 先获取所有Parts的_id（ObjectId）
    const allParts = await Part.find({});
    const allPartObjectIds = allParts.map(part => part._id);
    
    // 在删除所有Parts之前，先找到所有包含这些Parts的BOM
    const BOM = require('../models/BOM');
    const allBomsWithParts = await BOM.find({
      'parts.part_id': { $in: allPartObjectIds }
    });
    
    // Delete all parts
    const result = await Part.deleteMany({});
    
    // 同步更新所有BOMs状态：无论BOM的当前状态是什么，都设置为push，表示需要重新推送
    if (allBomsWithParts.length > 0) {
      const bomIds = allBomsWithParts.map(bom => bom._id);
      
      // 调试日志：显示找到的BOMs和它们的当前状态
      console.log(`找到 ${bomIds.length} 个包含被删除Parts的BOMs`);
      console.log(`BOM IDs: ${bomIds.join(', ')}`);
      
      // 强制更新所有相关BOMs的状态为push
      const updateResult = await BOM.updateMany(
        { 
          _id: { $in: bomIds }
        },
        { 
          $set: { push_status: 'push' } 
        }
      );
      
      console.log(`删除所有Parts后，同步更新了 ${updateResult.modifiedCount} 个BOM的状态为push`);
      console.log(`匹配的BOM数量: ${updateResult.matchedCount}`);
    } else {
      console.log('没有找到包含被删除Parts的BOMs');
    }
    
    res.json({ 
      message: `Successfully deleted all ${result.deletedCount} parts`,
      deletedCount: result.deletedCount,
      updatedBOMs: allBomsWithParts.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};