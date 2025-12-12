// BOM统计和验证工具函数
import { BOM_LEVELS } from '../components/BOMStructureEditor';

/**
 * 计算BOM统计信息
 * @param {Array} bomData - BOM数据
 * @returns {Object} 统计信息对象
 */
export const calculateStatistics = (bomData) => {
  if (!bomData || bomData.length === 0) {
    return {
      totalParts: 0,
      totalCost: 0,
      activeParts: 0,
      deprecatedParts: 0,
      inactiveParts: 0,
      alternativeParts: 0,
      activeAlternativeParts: 0,
      supplierCount: 0,
      costPercentage: 0,
      effectiveParts: 0,
      hasActiveAlternative: false,
      averageVariance: 0
    };
  }

  let totalParts = 0;
  let totalCost = 0;
  let activeParts = 0;
  let deprecatedParts = 0;
  let inactiveParts = 0;
  let alternativeParts = 0;
  let activeAlternativeParts = 0;
  let supplierCount = new Set();
  let totalVariance = 0;
  let varianceCount = 0;
  let l6Groups = new Map();

  const traverse = (nodes) => {
    nodes.forEach(node => {
      if (node.level >= BOM_LEVELS.L6.level) {
        totalParts++;
        
        if (node.level === BOM_LEVELS.L6.level) {
          // L6主料统计
          if (node.itemStatus === 'Active') {
            activeParts++;
            
            // 存储L6主料信息
            l6Groups.set(node.key, {
              l6Node: node,
              hasActiveL7: false,
              l7Cost: 0,
              l7Supplier: null,
              l7Variance: 0,
              l6Variance: node.variance || 0
            });
            
            // 统计供应商（如果没有激活的L7替代料）
            if (node.supplier && node.supplier.trim() !== '') {
              supplierCount.add(node.supplier);
            }
          } else if (node.itemStatus === 'Deprecated') {
            deprecatedParts++;
          } else if (node.itemStatus === 'Inactive') {
            inactiveParts++;
          }
        } else if (node.level === BOM_LEVELS.L7.level) {
          // L7替代料统计
          alternativeParts++;
          if (node.itemStatus === 'Active') {
            activeAlternativeParts++;
            
            // 查找对应的L6主料
            let l6Key = null;
            if (node.parentId) {
              l6Key = node.parentId;
            } else {
              for (const [key, value] of l6Groups.entries()) {
                if (value.l6Node.position === node.position) {
                  l6Key = key;
                  break;
                }
              }
            }
            
            if (l6Key && l6Groups.has(l6Key)) {
              const group = l6Groups.get(l6Key);
              group.hasActiveL7 = true;
              group.l7Cost = (node.cost || 0) * (node.quantity || 1);
              group.l7Supplier = node.supplier;
              group.l7Variance = node.variance || 0;
            }
          }
        }
      }
      
      if (node.children) {
        traverse(node.children);
      }
    });
  };

  traverse(bomData);
  
  // 计算总成本：如果L6有激活的L7替代料，则只计算L7成本；否则计算L6成本
  l6Groups.forEach(group => {
    if (group.hasActiveL7) {
      totalCost += group.l7Cost;
      if (group.l7Supplier && group.l7Supplier.trim() !== '') {
        supplierCount.add(group.l7Supplier);
      }
      totalVariance += group.l7Variance;
      varianceCount++;
    } else if (group.l6Node.itemStatus === 'Active') {
      totalCost += (group.l6Node.cost || 0) * (group.l6Node.quantity || 1);
      totalVariance += group.l6Variance;
      varianceCount++;
    }
  });
  
  // 计算有效零件数量（激活的L6主料 + 激活的L7替代料）
  const effectiveParts = activeParts + activeAlternativeParts;
  
  // 计算平均差异
  const averageVariance = varianceCount > 0 ? (totalVariance / varianceCount) : 0;
  
  return {
    totalParts,
    totalCost,
    activeParts,
    deprecatedParts,
    inactiveParts,
    alternativeParts,
    activeAlternativeParts,
    supplierCount: supplierCount.size,
    costPercentage: totalParts > 0 ? (effectiveParts / totalParts) * 100 : 0,
    effectiveParts,
    hasActiveAlternative: activeAlternativeParts > 0,
    averageVariance
  };
};

/**
 * 检查缺失件预警
 * @param {Array} treeData - BOM树数据
 * @returns {Array} 缺失件列表
 */
export const checkMissingParts = (treeData) => {
  let missingParts = [];
  let totalParts = 0;
  let activeParts = 0;
  
  const traverse = (nodes) => {
    nodes.forEach(node => {
      if (node.level >= BOM_LEVELS.L6.level) {
        totalParts++;
        if (node.itemStatus === 'Active') {
          activeParts++;
        }
        
        // 检查关键零件是否缺失
        if (node.level === BOM_LEVELS.L6.level && node.itemStatus !== 'Active') {
          // 检查是否有激活的L7替代料
          let hasActiveL7 = false;
          if (node.children) {
            hasActiveL7 = node.children.some(child => 
              child.level === BOM_LEVELS.L7.level && child.itemStatus === 'Active'
            );
          }
          
          if (!hasActiveL7) {
            missingParts.push({
              position: node.position,
              title: node.title,
              level: node.level,
              status: node.itemStatus
            });
          }
        }
      }
      
      if (node.children) {
        traverse(node.children);
      }
    });
  };
  
  traverse(treeData);
  
  // 计算差异百分比
  const variancePercentage = totalParts > 0 ? 
    ((missingParts.length / totalParts) * 100).toFixed(1) : 0;
  
  return {
    count: missingParts.length,
    percentage: variancePercentage,
    details: missingParts
  };
};