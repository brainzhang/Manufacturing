/**
 * AI辅助功能工具集
 * 包含替代料推荐、缺失件预警等功能
 */
import { BOM_LEVELS } from './bomHelpers.js';

/**
 * 获取替代料数据
 * @param {Object} node - 当前选中的节点
 * @returns {Array} 替代料列表
 */
export const getAlternativeParts = (node) => {
  // 根据零件类型返回不同的替代料数据
  const partType = node.title || '';
  
  if (partType.includes('CPU') || partType.includes('处理器')) {
    return [
      {
        id: 'cpu-alt-1',
        title: 'Intel Core Ultra 5 135H',
        cost: 3800,
        costReduction: 5,
        supplier: 'Intel Corporation',
        matchScore: 95,
        substituteGroup: 'A',
        lifecycle: 'Active',
        quantity: 1,
        variance: 5
      },
      {
        id: 'cpu-alt-2',
        title: 'AMD Ryzen 7 7840U',
        cost: 4200,
        costReduction: -5,
        supplier: 'AMD',
        matchScore: 92,
        substituteGroup: 'A',
        lifecycle: 'Active',
        quantity: 1,
        variance: -5
      },
      {
        id: 'cpu-alt-3',
        title: 'Intel Core i7-1360P',
        cost: 3600,
        costReduction: 10,
        supplier: 'Intel Corporation',
        matchScore: 88,
        substituteGroup: 'B',
        lifecycle: 'Active',
        quantity: 1,
        variance: 10
      }
    ];
  } else if (partType.includes('内存') || partType.includes('RAM') || partType.includes('DDR')) {
    return [
      {
        id: 'mem-alt-1',
        title: '16GB DDR5 5600MHz',
        cost: 750,
        costReduction: 6.25,
        supplier: 'Samsung Electronics',
        matchScore: 96,
        substituteGroup: 'A',
        lifecycle: 'Active',
        quantity: 2,
        variance: 6.25
      },
      {
        id: 'mem-alt-2',
        title: '16GB DDR4 3200MHz',
        cost: 600,
        costReduction: 25,
        supplier: 'SK Hynix',
        matchScore: 85,
        substituteGroup: 'B',
        lifecycle: 'Active',
        quantity: 2,
        variance: 25
      },
      {
        id: 'mem-alt-3',
        title: '32GB DDR5 4800MHz',
        cost: 1400,
        costReduction: -12.5,
        supplier: 'Corsair',
        matchScore: 91,
        substituteGroup: 'C',
        lifecycle: 'Active',
        quantity: 1,
        variance: -12.5
      }
    ];
  } else if (partType.includes('硬盘') || partType.includes('SSD') || partType.includes('存储')) {
    return [
      {
        id: 'ssd-alt-1',
        title: '1TB NVMe PCIe 3.0 SSD',
        cost: 500,
        costReduction: 16.67,
        supplier: 'Crucial',
        matchScore: 93,
        substituteGroup: 'A',
        lifecycle: 'Active',
        quantity: 1,
        variance: 16.67
      },
      {
        id: 'ssd-alt-2',
        title: '2TB SATA SSD',
        cost: 800,
        costReduction: -33.33,
        supplier: 'Western Digital',
        matchScore: 87,
        substituteGroup: 'B',
        lifecycle: 'Active',
        quantity: 1,
        variance: -33.33
      },
      {
        id: 'ssd-alt-3',
        title: '512GB NVMe PCIe 4.0 SSD',
        cost: 350,
        costReduction: 41.67,
        supplier: 'Kingston',
        matchScore: 89,
        substituteGroup: 'C',
        lifecycle: 'Active',
        quantity: 1,
        variance: 41.67
      }
    ];
  } else if (partType.includes('显卡') || partType.includes('GPU')) {
    return [
      {
        id: 'gpu-alt-1',
        title: 'NVIDIA RTX 4050',
        cost: 2800,
        costReduction: 12.5,
        supplier: 'NVIDIA Corporation',
        matchScore: 90,
        substituteGroup: 'A',
        lifecycle: 'Active',
        quantity: 1,
        variance: 12.5
      },
      {
        id: 'gpu-alt-2',
        title: 'AMD Radeon RX 7600',
        cost: 2500,
        costReduction: 21.88,
        supplier: 'AMD',
        matchScore: 85,
        substituteGroup: 'B',
        lifecycle: 'Active',
        quantity: 1,
        variance: 21.88
      },
      {
        id: 'gpu-alt-3',
        title: 'Intel Arc A770',
        cost: 2200,
        costReduction: 31.25,
        supplier: 'Intel Corporation',
        matchScore: 82,
        substituteGroup: 'C',
        lifecycle: 'Active',
        quantity: 1,
        variance: 31.25
      }
    ];
  } else if (partType.includes('机壳') || partType.includes('外壳')) {
    return [
      {
        id: 'case-alt-1',
        title: '14英寸碳纤维机壳',
        cost: 1500,
        costReduction: 6.25,
        supplier: 'CarbonTech',
        matchScore: 94,
        substituteGroup: 'A',
        lifecycle: 'Active',
        quantity: 1,
        variance: 6.25
      },
      {
        id: 'case-alt-2',
        title: '14英寸铝合金机壳',
        cost: 1200,
        costReduction: 25,
        supplier: 'AluCorp',
        matchScore: 88,
        substituteGroup: 'B',
        lifecycle: 'Active',
        quantity: 1,
        variance: 25
      },
      {
        id: 'case-alt-3',
        title: '14英寸镁合金机壳',
        cost: 1100,
        costReduction: 31.25,
        supplier: 'MgTech',
        matchScore: 86,
        substituteGroup: 'C',
        lifecycle: 'Active',
        quantity: 1,
        variance: 31.25
      }
    ];
  } else if (partType.includes('屏幕') || partType.includes('显示器')) {
    return [
      {
        id: 'screen-alt-1',
        title: '14英寸FHD IPS屏幕',
        cost: 1200,
        costReduction: 33.33,
        supplier: 'BOE',
        matchScore: 85,
        substituteGroup: 'A',
        lifecycle: 'Active',
        quantity: 1,
        variance: 33.33
      },
      {
        id: 'screen-alt-2',
        title: '14英寸OLED屏幕',
        cost: 2200,
        costReduction: -22.22,
        supplier: 'Samsung Display',
        matchScore: 92,
        substituteGroup: 'B',
        lifecycle: 'Active',
        quantity: 1,
        variance: -22.22
      },
      {
        id: 'screen-alt-3',
        title: '14.5英寸2.5K IPS屏幕',
        cost: 1900,
        costReduction: -5.56,
        supplier: 'LG Display',
        matchScore: 89,
        substituteGroup: 'C',
        lifecycle: 'Active',
        quantity: 1,
        variance: -5.56
      }
    ];
  } else {
    // 默认替代料
    return [
      {
        id: 'default-alt-1',
        title: `${partType} 替代方案 A`,
        cost: Math.floor((node.cost || 1000) * 0.9),
        costReduction: 10,
        supplier: '替代供应商A',
        matchScore: 90,
        substituteGroup: 'A',
        lifecycle: 'Active',
        quantity: node.quantity || 1,
        variance: 10
      },
      {
        id: 'default-alt-2',
        title: `${partType} 替代方案 B`,
        cost: Math.floor((node.cost || 1000) * 0.8),
        costReduction: 20,
        supplier: '替代供应商B',
        matchScore: 85,
        substituteGroup: 'B',
        lifecycle: 'Active',
        quantity: node.quantity || 1,
        variance: 20
      },
      {
        id: 'default-alt-3',
        title: `${partType} 替代方案 C`,
        cost: Math.floor((node.cost || 1000) * 0.7),
        costReduction: 30,
        supplier: '替代供应商C',
        matchScore: 80,
        substituteGroup: 'C',
        lifecycle: 'Active',
        quantity: node.quantity || 1,
        variance: 30
      }
    ];
  }
};

/**
 * 检查缺失件预警
 * @param {Array} treeData - BOM树数据
 * @returns {Object} 包含预警状态和缺失件详情的对象
 */
export const checkMissingPartsWarning = (treeData) => {
  // 获取当前BOM中的所有L6主料
  const currentParts = [];
  const traverse = (nodes) => {
    if (!nodes || !Array.isArray(nodes)) return;
    
    nodes.forEach(node => {
      if (node.level === BOM_LEVELS.L6.level && node.itemStatus === 'Active') {
        currentParts.push({
          key: node.key,
          title: node.title,
          position: node.position,
          partId: node.partId,
          cost: node.cost,
          supplier: node.supplier,
          lifecycle: node.lifecycle,
          itemStatus: node.itemStatus
        });
      }
      
      if (node.children) {
        traverse(node.children);
      }
    });
  };
  
  traverse(treeData);
  
  // 模拟模板数据 - 在实际应用中，这应该从API获取
  const templateParts = [
    { key: 'template-1', title: 'CPU处理器', position: 'M1.U2.S1.F1.G1.P1', required: true },
    { key: 'template-2', title: '主板芯片组', position: 'M1.U2.S1.F1.G1.P2', required: true },
    { key: 'template-3', title: '内存条', position: 'M1.U4.S1.F1.G1.P1', required: true },
    { key: 'template-4', title: '固态硬盘', position: 'M1.U4.S1.F1.F1.G1.P1', required: true },
    { key: 'template-5', title: '显示屏', position: 'M1.U5.S1.F1.G1.P1', required: true },
    { key: 'template-6', title: '电池', position: 'M1.U3.S1.F1.G1.P1', required: true },
    { key: 'template-7', title: '键盘', position: 'M1.U1.S1.F1.G1.P1', required: true },
    { key: 'template-8', title: '触摸板', position: 'M1.U1.S1.F1.G1.P2', required: true }
  ];
  
  // 检查缺失的零件
  const missingParts = [];
  templateParts.forEach(templatePart => {
    const isPresent = currentParts.some(currentPart => 
      currentPart.title === templatePart.title || 
      currentPart.partId === templatePart.partId
    );
    
    if (!isPresent && templatePart.required) {
      missingParts.push({
        ...templatePart,
        reason: '模板中必需的零件未在当前BOM中找到'
      });
    }
  });
  
  // 计算差异百分比
  const totalTemplateParts = templateParts.filter(p => p.required).length;
  const missingCount = missingParts.length;
  const differencePercentage = totalTemplateParts > 0 ? (missingCount / totalTemplateParts) * 100 : 0;
  
  const warningThreshold = 5; // 5%差异阈值
  const hasWarning = differencePercentage > warningThreshold;
  
  return {
    hasWarning,
    missingParts,
    differencePercentage,
    count: missingCount,
    details: missingParts
  };
};

/**
 * 获取低成本替代建议
 * @param {Array} alternatives - 替代料列表
 * @param {number} limit - 返回的建议数量限制
 * @returns {Array} 低成本替代建议列表
 */
export const getLowCostSuggestions = (alternatives, limit = 3) => {
  if (!alternatives || !Array.isArray(alternatives)) {
    return [];
  }
  
  // 按成本降幅排序，返回前N个
  return alternatives
    .filter(item => item.costReduction > 0) // 只保留有成本降幅的
    .sort((a, b) => b.costReduction - a.costReduction) // 按降幅从高到低排序
    .slice(0, limit);
};

/**
 * 验证BOM结构
 * @param {Array} treeData - BOM树数据
 * @returns {Array} 验证错误列表
 */
export const validateBOMStructure = (treeData) => {
  const errors = [];
  
  const traverse = (nodes, parentKey = null) => {
    if (!nodes || !Array.isArray(nodes)) return;
    
    nodes.forEach(node => {
      // 检查L6主料是否有必要的属性
      if (node.level === BOM_LEVELS.L6.level) {
        if (!node.title || node.title.trim() === '') {
          errors.push({
            nodeKey: node.key || parentKey,
            message: 'L6主料缺少标题',
            severity: 'error'
          });
        }
        
        if (!node.partId || node.partId.trim() === '') {
          errors.push({
            nodeKey: node.key || parentKey,
            message: 'L6主料缺少零件ID',
            severity: 'error'
          });
        }
        
        if (!node.position || node.position.trim() === '') {
          errors.push({
            nodeKey: node.key || parentKey,
            message: 'L6主料缺少位号',
            severity: 'error'
          });
        }
        
        if (!node.cost || node.cost <= 0) {
          errors.push({
            nodeKey: node.key || parentKey,
            message: 'L6主料成本无效',
            severity: 'warning'
          });
        }
      }
      
      // 检查L7替代料
      if (node.level === BOM_LEVELS.L7.level) {
        if (!node.parentId || node.parentId.trim() === '') {
          errors.push({
            nodeKey: node.key || parentKey,
            message: 'L7替代料缺少父节点ID',
            severity: 'error'
          });
        }
        
        if (!node.cost || node.cost <= 0) {
          errors.push({
            nodeKey: node.key || parentKey,
            message: 'L7替代料成本无效',
            severity: 'warning'
          });
        }
      }
      
      if (node.children) {
        traverse(node.children, node.key);
      }
    });
  };
  
  traverse(treeData);
  return errors;
};

/**
 * 生成位号
 * @param {number} level - 层级
 * @param {string} parentPosition - 父节点位号
 * @param {number} index - 当前节点在同层中的索引
 * @param {boolean} isAlternative - 是否为替代料
 * @returns {string} 生成的位号
 */
export const generatePosition = (level, parentPosition = '', index = 1, isAlternative = false) => {
  if (level === BOM_LEVELS.L1.level) {
    return 'M1'; // 主板
  } else if (level === BOM_LEVELS.L2.level) {
    return `${parentPosition}.U${index}`; // 单元
  } else if (level === BOM_LEVELS.L3.level) {
    return `${parentPosition}.S${index}`; // 子单元
  } else if (level === BOM_LEVELS.L4.level) {
    return `${parentPosition}.F${index}`; // 功能组
  } else if (level === BOM_LEVELS.L5.level) {
    return `${parentPosition}.G${index}`; // 组
  } else if (level === BOM_LEVELS.L6.level) {
    return `${parentPosition}.P${index}`; // 零件
  } else if (level === BOM_LEVELS.L7.level) {
    // L7替代料使用字母标识
    const alternativeChar = String.fromCharCode(64 + index); // A, B, C...
    return `${parentPosition.replace(/\.P\d+$/, '')}.A${alternativeChar}`;
  }
  
  return '';
};