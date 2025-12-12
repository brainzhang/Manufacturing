const express = require('express');
const router = express.Router();
const { pushBOMsToParts, syncBOMStatusOnPartDelete } = require('../services/pushService');

// 推送BOMs到Parts
router.post('/push-boms-to-parts', async (req, res) => {
  try {
    // 从前端接收BOM IDs和目标状态
    const { bomIds, targetStatus = 'pushed' } = req.body;
    
    if (!bomIds || !Array.isArray(bomIds) || bomIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的BOM IDs'
      });
    }

    const result = await pushBOMsToParts(bomIds, targetStatus);
    
    res.json({
      success: true,
      message: `成功推送 ${result.length} 个Parts数据`,
      data: result
    });
  } catch (error) {
    console.error('推送BOMs到Parts失败:', error);
    res.status(500).json({
      success: false,
      message: '推送失败: ' + error.message
    });
  }
});

// Parts删除时同步更新BOM状态
router.post('/sync-bom-status-on-part-delete', async (req, res) => {
  try {
    // 从前端接收Part IDs
    const { partIds } = req.body;
    
    if (!partIds || !Array.isArray(partIds) || partIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的Part IDs'
      });
    }

    const result = await syncBOMStatusOnPartDelete(partIds);
    
    res.json({
      success: true,
      message: `成功更新 ${result.updatedCount} 个BOM的状态为push`,
      data: result
    });
  } catch (error) {
    console.error('Parts删除时同步更新BOM状态失败:', error);
    res.status(500).json({
      success: false,
      message: '同步失败: ' + error.message
    });
  }
});

module.exports = router;