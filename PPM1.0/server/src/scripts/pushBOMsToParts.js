const mongoose = require('mongoose');
const Part = require('../models/Part');
const BOM = require('../models/BOM');
const Product = require('../models/Product');

// 数据库连接配置
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/ppm3', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
};

// 根据部件名称获取供应商
const getVendorByPartName = (partName) => {
  const vendorMap = {
    '电阻': 'Panasonic',
    '电容': 'Murata',
    '传感器': 'Texas Instruments',
    '连接器': 'Molex',
    '晶体管': 'ON Semiconductor',
    'IC': 'Analog Devices',
    '电感': 'TDK',
    '二极管': 'Vishay',
    '振荡器': 'NDK',
    '变压器': 'Pulse'
  };

  for (const [keyword, vendor] of Object.entries(vendorMap)) {
    if (partName && partName.includes(keyword)) {
      return vendor;
    }
  }

  return 'Generic';
};

// 根据部件名称获取分类
const getCategoryByPartName = (partName) => {
  const categoryMap = {
    '电阻': 'Passive Components',
    '电容': 'Passive Components',
    '传感器': 'Sensors',
    '连接器': 'Connectors',
    '晶体管': 'Semiconductors',
    'IC': 'Semiconductors',
    '电感': 'Passive Components',
    '二极管': 'Semiconductors',
    '振荡器': 'Timing Devices',
    '变压器': 'Power Components'
  };

  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (partName && partName.includes(keyword)) {
      return category;
    }
  }

  return 'Other';
};

// 根据Part Name生成固定的Part ID缩写+数字编号
const generateFixedPartId = (partName, index) => {
  // Part Name缩写映射表
  const abbreviationMap = {
    '电阻': 'RES',
    '电容': 'CAP',
    '传感器': 'SEN',
    '连接器': 'CON',
    '晶体管': 'TRA',
    'IC': 'IC',
    '电感': 'IND',
    '二极管': 'DIO',
    '振荡器': 'OSC',
    '变压器': 'TRA',
    'Power Supply': 'PS',
    'Signal Processing': 'SP',
    'Interface': 'INT',
    'Control Circuit': 'CC'
  };

  // 查找匹配的关键词
  let abbreviation = 'PAR';
  for (const [keyword, abbr] of Object.entries(abbreviationMap)) {
    if (partName && partName.includes(keyword)) {
      abbreviation = abbr;
      break;
    }
  }

  // 生成4位数字编号，从0001开始
  const number = (index + 1).toString().padStart(4, '0');
  
  return `${abbreviation}${number}`;
};

// 推送BOMs到Parts
const pushBOMsToParts = async () => {
  try {
    console.log('开始推送BOMs到Parts...');

    // 清除现有的Parts数据
    await Part.deleteMany({});
    console.log('已清除所有Parts数据');

    // 获取所有已推送的BOMs数据（push_status为'pushed'）
    const boms = await BOM.find({ push_status: 'pushed' })
      .populate('parts.part_id')
      .populate('product_id');

    if (boms.length === 0) {
      console.log('未找到已推送的BOMs，将创建示例数据');
      
      // 创建示例Parts数据（基于您提供的实际数据）
      const sampleParts = [
        {
          part_id: 'PS0001',
          part_id: 'PN0001',
          name: 'Power Supply',
          spec: '',
          vendor: 'Generic',
          category: 'Other',
          product_id: 'PROD001',
          product_name: 'ThinkPad X1 Carbon',
          version: 'Gen 9',
          product_line: 'ThinkPad',
          quantity: 2,
          status: 'active'
        },
        {
          part_id: 'SP0002',
          part_id: 'PN0002',
          name: 'Signal Processing',
          spec: '',
          vendor: 'Generic',
          category: 'Other',
          product_id: 'PROD001',
          product_name: 'ThinkPad X1 Carbon',
          version: 'Gen 9',
          product_line: 'ThinkPad',
          quantity: 5,
          status: 'active'
        },
        {
          part_id: 'INT0004',
          part_id: 'PN0003',
          name: 'Interface',
          spec: '',
          vendor: 'Generic',
          category: 'Other',
          product_id: 'PROD001',
          product_name: 'ThinkPad X1 Carbon',
          version: 'Gen 9',
          product_line: 'ThinkPad',
          quantity: 1,
          status: 'active'
        },
        {
          part_id: 'CC0003',
          part_id: 'PN0004',
          name: 'Control Circuit',
          spec: '',
          vendor: 'Generic',
          category: 'Other',
          product_id: 'PROD001',
          product_name: 'ThinkPad X1 Carbon',
          version: 'Gen 9',
          product_line: 'ThinkPad',
          quantity: 1,
          status: 'active'
        }
      ];

      const createdParts = await Part.insertMany(sampleParts);
      console.log(`成功创建 ${createdParts.length} 个示例Parts数据`);
      return createdParts;
    }

    const partsToCreate = [];
    const partIdMap = new Map(); // 用于去重，避免重复创建相同的Part

    // 处理每个BOM的parts
    for (const bom of boms) {
      for (let i = 0; i < bom.parts.length; i++) {
        const bomPart = bom.parts[i];
        
        // 关键修复：Part Name 应该从 BOM 的 parts.position 字段获取
        const actualPartName = bomPart.position || bomPart.part_id?.name || bom.bom_name + ' Part';
        const actualQuantity = bomPart.quantity || 1;
        const actualSpec = bomPart.part_id?.spec || '';
        
        // 生成唯一的Part ID
        const partId = generateFixedPartId(actualPartName, partsToCreate.length);
        
        // 如果已经存在相同的Part Name，则合并数量
        if (partIdMap.has(actualPartName)) {
          const existingPart = partIdMap.get(actualPartName);
          existingPart.quantity += actualQuantity;
        } else {
          // 创建新的Part数据
          const partData = {
            part_id: partId,
            part_id: `PN${(partsToCreate.length + 1).toString().padStart(4, '0')}`,
            name: actualPartName,
            spec: actualSpec,
            vendor: getVendorByPartName(actualPartName),
            category: getCategoryByPartName(actualPartName),
            product_id: bom.product_id?.product_id || 'PROD001',
            product_name: bom.product_id?.model || 'ThinkPad X1 Carbon',
            version: bom.version || 'Gen 9',
            product_line: bom.product_line || 'ThinkPad',
            quantity: actualQuantity,
            status: 'active'
          };

          partsToCreate.push(partData);
          partIdMap.set(actualPartName, partData);
        }
      }
    }

    // 创建Parts
    const createdParts = await Part.insertMany(partsToCreate);
    console.log(`成功推送 ${createdParts.length} 个Parts数据`);

    return createdParts;
  } catch (error) {
    console.error('推送BOMs到Parts失败:', error);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    await connectDB();
    await pushBOMsToParts();
    console.log('推送完成！');
    process.exit(0);
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
};

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { pushBOMsToParts };