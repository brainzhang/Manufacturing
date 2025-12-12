import { calculateBOMCost, flattenBOMTree, BOM_LEVELS } from './bomHelpers';

// 成本滚动计算引擎
export class CostCalculator {
  constructor() {
    this.cache = new Map(); // 缓存计算结果
  }

  // 清空缓存
  clearCache() {
    this.cache.clear();
  }

  // 计算BOM总成本
  calculateTotalCost(bomTreeData) {
    const cacheKey = JSON.stringify(bomTreeData);
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 扁平化树数据
    const flatData = flattenBOMTree(bomTreeData);
    
    // 计算成本
    const result = this.calculateCostByLevel(flatData);
    
    // 缓存结果
    this.cache.set(cacheKey, result);
    
    return result;
  }

  // 按层级计算成本
  calculateCostByLevel(flatData) {
    let totalCost = 0;
    let totalParts = 0;
    let activeParts = 0;
    const supplierSet = new Set();
    const costByLevel = {};
    const costBySupplier = {};
    
    // 初始化各层级成本
    for (let i = BOM_LEVELS.L1.level; i <= BOM_LEVELS.L7.level; i++) {
      costByLevel[`L${i}`] = {
        level: i,
        count: 0,
        cost: 0,
        activeCount: 0
      };
    }
    
    // 遍历所有节点
    flatData.forEach(item => {
      const levelKey = `L${item.level}`;
      
      // 统计各层级数量
      costByLevel[levelKey].count++;
      
      // 统计供应商
      if (item.supplier) {
        supplierSet.add(item.supplier);
        
        // 按供应商统计成本
        if (!costBySupplier[item.supplier]) {
          costBySupplier[item.supplier] = {
            name: item.supplier,
            parts: [],
            totalCost: 0
          };
        }
        
        costBySupplier[item.supplier].parts.push({
          title: item.title,
          cost: item.cost,
          quantity: item.quantity
        });
      }
      
      // 只有L6及以上的活跃主料才计入成本
      if (item.level >= BOM_LEVELS.L6.level) {
        totalParts++;
        
        if (item.status === 'Active') {
          activeParts++;
          
          // L7替代料不计入总成本
          if (item.level === BOM_LEVELS.L6.level) {
            const itemCost = (item.cost || 0) * (item.quantity || 1);
            costByLevel[levelKey].cost += itemCost;
            costByLevel[levelKey].activeCount++;
            
            totalCost += itemCost;
            
            // 按供应商统计成本
            if (item.supplier && costBySupplier[item.supplier]) {
              costBySupplier[item.supplier].totalCost += itemCost;
            }
          } else if (item.level === BOM_LEVELS.L7.level) {
            costByLevel[levelKey].activeCount++;
          }
        }
      }
    });
    
    // 计算成本占比
    const costByPercentage = {};
    Object.keys(costByLevel).forEach(level => {
      const levelData = costByLevel[level];
      costByPercentage[level] = {
        ...levelData,
        percentage: totalCost > 0 ? (levelData.cost / totalCost * 100).toFixed(2) : 0
      };
    });
    
    // 按成本排序供应商
    const sortedSuppliers = Object.values(costBySupplier).sort((a, b) => b.totalCost - a.totalCost);
    
    return {
      totalCost,
      totalParts,
      activeParts,
      deprecatedParts: totalParts - activeParts,
      alternativeParts: costByLevel.L7.count,
      supplierCount: supplierSet.size,
      costByLevel: costByPercentage,
      costBySupplier: sortedSuppliers,
      averageCostPerPart: totalParts > 0 ? (totalCost / activeParts).toFixed(2) : 0
    };
  }

  // 计算成本差异
  calculateCostDifference(originalCost, newCost) {
    const difference = newCost - originalCost;
    const percentage = originalCost > 0 ? ((difference / originalCost) * 100).toFixed(2) : 0;
    
    return {
      originalCost,
      newCost,
      difference,
      percentage: parseFloat(percentage),
      status: difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'equal'
    };
  }

  // 模拟成本变化
  simulateCostChange(bomTreeData, nodeKey, newCost, newQuantity) {
    // 查找节点
    const flatData = flattenBOMTree(bomTreeData);
    const targetNode = flatData.find(item => item.key === nodeKey);
    
    if (!targetNode) {
      throw new Error(`Node with key ${nodeKey} not found`);
    }
    
    // 只计算L6和L7节点的成本变化
    if (targetNode.level < BOM_LEVELS.L6.level) {
      return {
        impact: 0,
        newTotalCost: this.calculateTotalCost(bomTreeData).totalCost,
        message: 'L5及以下层级的变化不影响成本计算'
      };
    }
    
    // 计算原始成本
    const originalCost = (targetNode.cost || 0) * (targetNode.quantity || 1);
    
    // 计算新成本
    const updatedCost = (newCost || 0) * (newQuantity || 1);
    
    // 计算影响
    const impact = updatedCost - originalCost;
    
    // 应用变化
    const updatedBomTreeData = this.applyCostChange(bomTreeData, nodeKey, newCost, newQuantity);
    
    // 计算新的总成本
    const newTotalCost = this.calculateTotalCost(updatedBomTreeData).totalCost;
    
    return {
      impact,
      newTotalCost,
      nodeTitle: targetNode.title,
      originalNodeCost: originalCost,
      updatedNodeCost: updatedCost,
      message: `节点 ${targetNode.title} 的成本变化：¥${originalCost} → ¥${updatedCost}，总成本影响：¥${impact}`
    };
  }

  // 应用成本变化
  applyCostChange(nodes, nodeKey, newCost, newQuantity) {
    const updateNode = (nodeList) => {
      return nodeList.map(node => {
        if (node.key === nodeKey) {
          return {
            ...node,
            cost: newCost,
            quantity: newQuantity,
            variance: this.calculateVariance(newCost, node.cost) // 计算与原始成本的差异百分比
          };
        }
        
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: updateNode(node.children)
          };
        }
        
        return node;
      });
    };
    
    return updateNode(nodes);
  }

  // 计算与原始成本的差异百分比
  calculateVariance(newCost, originalCost) {
    if (!originalCost || originalCost === 0) return 0;
    return ((newCost - originalCost) / originalCost * 100).toFixed(2);
  }

  // 预警检查
  checkCostWarnings(bomTreeData, thresholds = {}) {
    const {
      maxTotalCost = 100000, // 默认最大总成本阈值
      maxCostPerPart = 10000, // 默认单件最大成本阈值
      maxAlternativeCount = 5, // 默认最大替代料数量阈值
      maxVariancePercentage = 20 // 默认最大成本差异百分比阈值
    } = thresholds;
    
    const costData = this.calculateTotalCost(bomTreeData);
    const flatData = flattenBOMTree(bomTreeData);
    const warnings = [];
    
    // 检查总成本
    if (costData.totalCost > maxTotalCost) {
      warnings.push({
        type: 'total_cost',
        level: 'error',
        message: `总成本 ¥${costData.totalCost.toFixed(2)} 超过阈值 ¥${maxTotalCost}`
      });
    }
    
    // 检查单件成本
    const expensiveParts = flatData.filter(item => 
      item.level === BOM_LEVELS.L6.level && 
      item.status === 'Active' && 
      (item.cost || 0) * (item.quantity || 1) > maxCostPerPart
    );
    
    if (expensiveParts.length > 0) {
      warnings.push({
        type: 'expensive_part',
        level: 'warning',
        message: `发现 ${expensiveParts.length} 个高成本零件，超过阈值 ¥${maxCostPerPart}`,
        details: expensiveParts.map(part => `${part.title}: ¥${part.cost}`)
      });
    }
    
    // 检查替代料数量
    if (costData.alternativeParts > maxAlternativeCount) {
      warnings.push({
        type: 'too_many_alternatives',
        level: 'info',
        message: `替代料数量 ${costData.alternativeParts} 超过建议值 ${maxAlternativeCount}`
      });
    }
    
    // 检查成本差异
    const highVarianceParts = flatData.filter(item => 
      item.level >= BOM_LEVELS.L6.level && 
      Math.abs(parseFloat(item.variance || 0)) > maxVariancePercentage
    );
    
    if (highVarianceParts.length > 0) {
      warnings.push({
        type: 'high_variance',
        level: 'warning',
        message: `发现 ${highVarianceParts.length} 个高差异零件，超过阈值 ${maxVariancePercentage}%`,
        details: highVarianceParts.map(part => `${part.title}: ${part.variance}%`)
      });
    }
    
    return {
      warnings,
      hasErrors: warnings.some(w => w.level === 'error'),
      hasWarnings: warnings.some(w => w.level === 'warning'),
      summary: {
        total: warnings.length,
        errors: warnings.filter(w => w.level === 'error').length,
        warnings: warnings.filter(w => w.level === 'warning').length,
        info: warnings.filter(w => w.level === 'info').length
      }
    };
  }

  // 生成成本报告
  generateCostReport(bomTreeData) {
    const costData = this.calculateTotalCost(bomTreeData);
    const warnings = this.checkCostWarnings(bomTreeData);
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalCost: costData.totalCost,
        totalParts: costData.totalParts,
        activeParts: costData.activeParts,
        alternativeParts: costData.alternativeParts,
        supplierCount: costData.supplierCount,
        averageCostPerPart: costData.averageCostPerPart
      },
      breakdown: {
        byLevel: costData.costByLevel,
        bySupplier: costData.costBySupplier
      },
      warnings: warnings.warnings,
      healthScore: this.calculateHealthScore(costData, warnings)
    };
  }

  // 计算健康度分数
  calculateHealthScore(costData, warnings) {
    let score = 100; // 满分100
    
    // 根据错误数量扣分
    score -= warnings.summary.errors * 20; // 每个错误扣20分
    
    // 根据警告数量扣分
    score -= warnings.summary.warnings * 10; // 每个警告扣10分
    
    // 根据信息数量轻微扣分
    score -= warnings.summary.info * 5; // 每个信息扣5分
    
    // 根据替代料比例扣分
    const alternativeRatio = costData.alternativeParts / costData.totalParts;
    if (alternativeRatio > 0.3) { // 替代料超过30%
      score -= 10;
    }
    
    // 根据供应商集中度扣分
    if (costData.supplierCount < 3) { // 供应商少于3家
      score -= 5;
    }
    
    // 确保分数在0-100范围内
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      grade: this.getGradeFromScore(score),
      details: {
        warningsDeduction: warnings.summary.errors * 20 + warnings.summary.warnings * 10 + warnings.summary.info * 5,
        alternativeRatioDeduction: alternativeRatio > 0.3 ? 10 : 0,
        supplierDiversityDeduction: costData.supplierCount < 3 ? 5 : 0
      }
    };
  }

  // 根据分数获取等级
  getGradeFromScore(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

// 创建默认实例
export const costCalculator = new CostCalculator();