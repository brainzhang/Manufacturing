const express = require('express');
const SimpleTemplateGenerator = require('../utils/simpleTemplateGenerator');
const BOMTemplateChecker = require('../scripts/bomTemplateChecker');

const router = express.Router();

/**
 * 下载BOM导入模板（带下拉框功能）
 */
router.get('/bom-import-template', async (req, res) => {
  try {
    const templateGenerator = new SimpleTemplateGenerator();
    
    // 生成模板
    const buffer = await templateGenerator.generateTemplate();
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="BOM_Import_Template.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    
    // 发送文件
    res.send(Buffer.from(buffer));
    
    console.log('BOM import template generated successfully. Size:', buffer.length, 'bytes');
    
  } catch (error) {
    console.error('Error generating BOM import template:', error);
    
    // 尝试使用简单模板作为备用方案
    try {
      const templateGenerator = new SimpleTemplateGenerator();
      const buffer = await templateGenerator.generateSimpleTemplate();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="BOM_Import_Template_Simple.xlsx"');
      res.setHeader('Content-Length', buffer.length);
      res.send(Buffer.from(buffer));
      
      console.log('Simple BOM import template generated as fallback. Size:', buffer.length, 'bytes');
      
    } catch (fallbackError) {
      console.error('Fallback template generation also failed:', fallbackError);
      res.status(500).json({
        success: false,
        message: 'Failed to generate BOM import template',
        error: error.message
      });
    }
  }
});

/**
 * 检查BOM模板文件状态
 */
router.get('/bom-template-status', async (req, res) => {
  try {
    const templateChecker = new BOMTemplateChecker();
    
    const results = [];
    for (const templatePath of templateChecker.templatePaths) {
      const validation = await templateChecker.validateTemplateStructure(templatePath);
      results.push({
        path: templatePath,
        exists: require('fs').existsSync(templatePath),
        validation: validation
      });
    }
    
    res.json({
      success: true,
      results: results
    });
    
  } catch (error) {
    console.error('Error checking template status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check template status',
      error: error.message
    });
  }
});

/**
 * 下载增强版BOM导入模板（包含20条测试数据）
 */
router.get('/bom-import-template-enhanced', async (req, res) => {
  try {
    const templateGenerator = new SimpleTemplateGenerator();
    
    // 生成增强版模板
    const buffer = await templateGenerator.generateTemplate();
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="BOM_Import_Template_Enhanced.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    
    // 发送文件
    res.send(Buffer.from(buffer));
    
    console.log('Enhanced BOM import template generated successfully. Size:', buffer.length, 'bytes');
    
  } catch (error) {
    console.error('Error generating enhanced BOM import template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate enhanced BOM import template',
      error: error.message
    });
  }
});

module.exports = router;