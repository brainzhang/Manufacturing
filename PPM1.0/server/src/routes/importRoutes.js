const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const Part = require('../models/Part');
const BOM = require('../models/BOM');
const PNMapping = require('../models/PNMap');
const Alignment = require('../models/Alignment');

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

// Import parts from CSV/Excel
router.post('/parts', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const importedParts = [];
    const errors = [];

    if (req.file.mimetype.includes('csv')) {
      // Process CSV
      const results = await processCSV(req.file.buffer);
      for (const [index, row] of results.entries()) {
        try {
          const part = await createPartFromRow(row);
          importedParts.push(part);
        } catch (error) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }
    } else {
      // Process Excel
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      for (const [index, row] of data.entries()) {
        try {
          const part = await createPartFromRow(row);
          importedParts.push(part);
        } catch (error) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }
    }

    // Bulk insert
    if (importedParts.length > 0) {
      await Part.insertMany(importedParts, { ordered: false });
    }

    res.json({
      success: true,
      imported: importedParts.length,
      errors: errors,
      message: `Successfully imported ${importedParts.length} parts`
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      error: 'Import failed', 
      message: error.message 
    });
  }
});

// Import BOMs from CSV/Excel
router.post('/boms', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const importedBOMs = [];
    const errors = [];

    if (req.file.mimetype.includes('csv')) {
      const results = await processCSV(req.file.buffer);
      for (const [index, row] of results.entries()) {
        try {
          const bom = await createBOMFromRow(row);
          importedBOMs.push(bom);
        } catch (error) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }
    } else {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      for (const [index, row] of data.entries()) {
        try {
          const bom = await createBOMFromRow(row);
          importedBOMs.push(bom);
        } catch (error) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }
    }

    if (importedBOMs.length > 0) {
      await BOM.insertMany(importedBOMs, { ordered: false });
    }

    res.json({
      success: true,
      imported: importedBOMs.length,
      errors: errors,
      message: `Successfully imported ${importedBOMs.length} BOMs`
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      error: 'Import failed', 
      message: error.message 
    });
  }
});

// Import PN Mappings from CSV/Excel
router.post('/pn-mappings', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const importedMappings = [];
    const errors = [];

    if (req.file.mimetype.includes('csv')) {
      const results = await processCSV(req.file.buffer);
      for (const [index, row] of results.entries()) {
        try {
          const mapping = await createPNMappingFromRow(row);
          importedMappings.push(mapping);
        } catch (error) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }
    } else {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      for (const [index, row] of data.entries()) {
        try {
          const mapping = await createPNMappingFromRow(row);
          importedMappings.push(mapping);
        } catch (error) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }
    }

    if (importedMappings.length > 0) {
      await PNMapping.insertMany(importedMappings, { ordered: false });
    }

    res.json({
      success: true,
      imported: importedMappings.length,
      errors: errors,
      message: `Successfully imported ${importedMappings.length} PN mappings`
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      error: 'Import failed', 
      message: error.message 
    });
  }
});

// Import Alignments from CSV/Excel
router.post('/alignments', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const importedAlignments = [];
    const errors = [];

    if (req.file.mimetype.includes('csv')) {
      const results = await processCSV(req.file.buffer);
      for (const [index, row] of results.entries()) {
        try {
          const alignment = await createAlignmentFromRow(row);
          importedAlignments.push(alignment);
        } catch (error) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }
    } else {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      for (const [index, row] of data.entries()) {
        try {
          const alignment = await createAlignmentFromRow(row);
          importedAlignments.push(alignment);
        } catch (error) {
          errors.push(`Row ${index + 1}: ${error.message}`);
        }
      }
    }

    if (importedAlignments.length > 0) {
      await Alignment.insertMany(importedAlignments, { ordered: false });
    }

    res.json({
      success: true,
      imported: importedAlignments.length,
      errors: errors,
      message: `Successfully imported ${importedAlignments.length} alignments`
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      error: 'Import failed', 
      message: error.message 
    });
  }
});

// Helper functions
function processCSV(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    bufferStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function createPartFromRow(row) {
  const required = ['part_id', 'name', 'category'];
  for (const field of required) {
    if (!row[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return {
    part_id: row.part_id,
    name: row.name,
    category: row.category,
    spec: row.spec || '',
    vendor: row.vendor || '',
    status: row.status || 'active'
  };
}

async function createBOMFromRow(row) {
  console.log('Processing row:', row);
  
  // 根据模板文件的实际列头进行字段映射
  // 检查模板文件的实际列名 - 处理 __EMPTY_1 到 __EMPTY_10 格式
  const bom_id = row['BOM ID'] || row['BOM ID'] || row.bom_id || row['__EMPTY_1'] || '';
  const bom_name = row['BOM Name'] || row['BOM Name'] || row.bom_name || row['__EMPTY_2'] || '';
  const version = row.Version || row.Version || row.version || row['__EMPTY_7'] || 'Gen1';
  const product_line = row['Product Line'] || row['Product Line'] || row.product_line || row['__EMPTY_8'] || '';
  const status = row.Status || row.Status || row.status || row['__EMPTY_9'] || 'draft';
  const actions = row.Actions || row.Actions || row.actions || row['__EMPTY_10'] || 'push';
  
  // 如果所有字段都为空，跳过这一行（可能是空行或标题行）
  if (!bom_id && !bom_name && !version && !product_line && !status && !actions) {
    throw new Error('Empty row, skipping');
  }
  
  // 必需字段验证 - 如果bom_name为空，使用默认值
  const required = ['bom_name', 'version'];
  const values = [bom_name || 'Default BOM', version || 'Gen1'];
  
  for (let i = 0; i < required.length; i++) {
    if (!values[i]) {
      throw new Error(`Missing required field: ${required[i]}`);
    }
  }
  
  // 转换状态值为小写以匹配模型枚举
  const normalizedStatus = status.toLowerCase();
  const normalizedPushStatus = actions.toLowerCase();
  
  // 验证状态值
  const validStatuses = ['draft', 'active', 'inactive'];
  const validPushStatuses = ['push', 'pushed'];
  
  if (!validStatuses.includes(normalizedStatus)) {
    throw new Error(`Invalid status value: ${status}. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  if (!validPushStatuses.includes(normalizedPushStatus)) {
    throw new Error(`Invalid push status value: ${actions}. Must be one of: ${validPushStatuses.join(', ')}`);
  }
  
  // 修复product_id字段问题 - 查找或创建有效的Product引用
  let productId;
  try {
    // 首先尝试查找现有的Product
    const Product = require('../models/Product');
    const existingProduct = await Product.findOne({ product_line: product_line || 'default' });
    
    if (existingProduct) {
      productId = existingProduct._id;
    } else {
      // 如果没有找到Product，创建一个新的
      const newProduct = new Product({
        product_id: `PROD${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        model: bom_name || 'Default Model',
        product_line: product_line || 'default',
        status: 'production'
      });
      await newProduct.save();
      productId = newProduct._id;
    }
  } catch (error) {
    console.error('Error handling product reference:', error);
    // 如果Product处理失败，使用默认的ObjectId
    productId = new mongoose.Types.ObjectId();
  }
  
  // 创建BOM记录
  const bomData = {
    bom_id: bom_id || undefined, // 如果为空则使用默认生成
    bom_name: bom_name,
    product_id: productId,
    version: version,
    product_line: product_line,
    parts: [], // 零件信息需要单独处理
    status: normalizedStatus,
    push_status: normalizedPushStatus
  };
  
  console.log('Created BOM data:', bomData);
  return bomData;
}

async function createPNMappingFromRow(row) {
  const required = ['part_id', 'target_pn'];
  for (const field of required) {
    if (!row[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return {
    part_id: row.part_id,
    target_pn: row.target_pn,
    match_strength: row.match_strength || 'medium',
    source: row.source || 'manual',
    status: row.status || 'active'
  };
}

async function createAlignmentFromRow(row) {
  const required = ['part_number', 'status'];
  for (const field of required) {
    if (!row[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return {
    part_number: row.part_number,
    status: row.status,
    source_system: row.source_system || '',
    target_system: row.target_system || '',
    alignment_data: row.alignment_data || {}
  };
}

module.exports = router;