const Part = require('../models/Part');
const BOM = require('../models/BOM');



// 生成唯一的零件ID
const generateUniquePartId = async () => {
  // 获取当前最大的part_id
  const lastPart = await Part.findOne().sort({ part_id: -1 });
  let nextNumber = 1;
  
  if (lastPart && lastPart.part_id) {
    const match = lastPart.part_id.match(/PT(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }
  
  return `PT${nextNumber.toString().padStart(4, '0')}`;
};

// 根据Part Name生成固定的Part ID缩写+数字编号
const generatePartId = (partName, index = 0) => {
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
    'power supply': 'PS',
    'cpu': 'CPU',
    'memory': 'MEM',
    'storage': 'STR',
    'motherboard': 'MB',
    'gpu': 'GPU',
    'case': 'CAS',
    'cooling': 'COO',
    'display': 'DIS',
    'keyboard': 'KB',
    'mouse': 'MOU',
    'signal processing': 'SP',
    'control circuit': 'CC',
    'interface': 'INT',
    'sensor': 'SEN',
    'oscillator': 'OSC',
    'filter': 'FIL'
  };

  // 查找匹配的关键词
  let abbreviation = 'PAR';
  for (const [keyword, abbr] of Object.entries(abbreviationMap)) {
    if (partName && partName.toLowerCase().includes(keyword.toLowerCase())) {
      abbreviation = abbr;
      break;
    }
  }

  // 生成4位数字编号，从0001开始
  const number = (index + 1).toString().padStart(4, '0');
  
  return `${abbreviation}${number}`;
};

// 推送BOM数据到Parts
const pushBOMsToParts = async (bomIds, targetStatus = 'pushed') => {
  try {
    console.log('开始推送BOMs到Parts，BOM IDs:', bomIds);

    // 获取指定的BOMs数据，包含parts和product_id的详细信息
    const boms = await BOM.find({ bom_id: { $in: bomIds } })
      .populate('parts.part_id')
      .populate('product_id');

    console.log('找到的BOMs数量:', boms.length);

    if (boms.length === 0) {
      throw new Error('未找到指定的BOMs');
    }

    // 如果目标状态是'push'，只是更新BOM状态，不创建Parts数据
    if (targetStatus === 'push') {
      console.log('目标状态为push，只更新BOM状态，不创建Parts数据');
      
      // 更新BOM的push_status为目标状态
      await BOM.updateMany(
        { bom_id: { $in: bomIds } },
        { push_status: targetStatus }
      );

      return []; // 返回空数组表示没有创建Parts数据
    }

    // 使用数组来存储所有Part数据
    const partsToCreate = [];

    // 处理每个BOM的parts
    for (const bom of boms) {
      console.log('处理BOM:', bom.bom_id, '包含parts数量:', bom.parts.length);
      
      // 检查parts数据
      if (!bom.parts || bom.parts.length === 0) {
        console.log('BOM', bom.bom_id, '没有parts数据，跳过');
        continue;
      }
      
      // 处理每个BOM的parts - 直接复制BOM数据到Parts表
      for (let i = 0; i < bom.parts.length; i++) {
        const bomPart = bom.parts[i];
        
        // 使用正确的Part ID生成逻辑
        const correctPartId = generatePartId(bomPart.part_id?.name || bomPart.position || 'Part ' + (i + 1), i);
        
        const partData = {
          part_id: correctPartId, // 使用正确的Part ID
          part_no: correctPartId, // 设置part_no字段
          name: bomPart.part_id?.name || bomPart.position || 'Part ' + (i + 1),
          spec: bomPart.part_id?.spec || '',
          quantity: bomPart.quantity || 1,
          vendor: '', // 按照用户要求，vendor字段为空
          category: 'General', // 提供默认分类值，避免验证错误
          // 直接使用BOM中的产品信息
          product_id: bom.product_id?.product_id || bom.product_id || 'N/A',
          product_name: bom.product_id?.model || bom.product_name || 'N/A',
          version: bom.version || 'N/A',
          product_line: bom.product_id?.product_line || bom.product_line || 'ThinkPad',
          source_bom_id: bom.bom_id, // 记录来源BOM ID
          status: bom.status === 'active' ? 'active' : 'inactive'
        };
        
        partsToCreate.push(partData);
        console.log('创建Part数据:', partData.part_id, partData.name, partData.quantity, '来自BOM:', bom.bom_id);
      }
    }

    if (partsToCreate.length === 0) {
      throw new Error('BOMs中没有有效的parts数据');
    }

    // 创建Parts - 使用upsert操作，避免Part ID冲突
    const createdParts = [];
    for (const partData of partsToCreate) {
      try {
        // 使用upsert操作，如果Part ID已存在则更新，不存在则创建
        const result = await Part.findOneAndUpdate(
          { part_id: partData.part_id },
          {
            ...partData,
            // 添加BOM相关信息以便追踪
            source_bom_id: partData.source_bom_id, // 使用正确的source_bom_id
            updated_at: new Date()
          },
          {
            upsert: true, // 如果不存在则创建
            new: true,    // 返回更新后的文档
            setDefaultsOnInsert: true // 插入时设置默认值
          }
        );
        createdParts.push(result);
        console.log(`成功创建/更新Part: ${partData.part_id}`);
      } catch (error) {
        console.error(`创建/更新Part数据失败 (${partData.part_id}):`, error);
        throw error;
      }
    }
    
    console.log(`成功推送 ${createdParts.length} 个Parts数据`);

    // 更新BOM的push_status为目标状态
    await BOM.updateMany(
      { bom_id: { $in: bomIds } },
      { push_status: targetStatus }
    );

    return createdParts;
  } catch (error) {
    console.error('推送BOMs到Parts失败:', error);
    throw error;
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

  if (!partName) return 'Generic';

  for (const [keyword, vendor] of Object.entries(vendorMap)) {
    if (partName.includes(keyword)) {
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

  if (!partName) return 'Other';

  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (partName.includes(keyword)) {
      return category;
    }
  }

  return 'Other';
};

// Parts删除时同步更新BOM状态为push
const syncBOMStatusOnPartDelete = async (partIds) => {
  try {
    console.log('Parts删除时同步更新BOM状态，Part IDs:', partIds);

    // 查找包含这些Part IDs的BOMs
    const boms = await BOM.find({ 
      'parts.part_id': { $in: partIds } 
    });

    console.log('找到需要更新状态的BOMs数量:', boms.length);

    if (boms.length === 0) {
      console.log('没有找到包含这些Part IDs的BOMs');
      return { updatedCount: 0 };
    }

    // 获取BOM IDs
    const bomIds = boms.map(bom => bom.bom_id);

    // 更新BOM的push_status为'push'
    const updateResult = await BOM.updateMany(
      { bom_id: { $in: bomIds } },
      { push_status: 'push' }
    );

    console.log(`成功更新 ${updateResult.modifiedCount} 个BOM的状态为push`);

    return {
      updatedCount: updateResult.modifiedCount,
      bomIds: bomIds
    };
  } catch (error) {
    console.error('Parts删除时同步更新BOM状态失败:', error);
    throw error;
  }
};

module.exports = {
  pushBOMsToParts,
  syncBOMStatusOnPartDelete
};