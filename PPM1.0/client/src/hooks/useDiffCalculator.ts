import { useState } from 'react';

interface BOMItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  cost: number;
  supplier?: string;
  complianceStatus?: 'compliant' | 'warning' | 'violation';
}

interface BOMData {
  id: string;
  name: string;
  items: BOMItem[];
}

interface Difference {
  id: string;
  partNumber: string;
  description: string;
  changeType: 'added' | 'removed' | 'modified';
  affectedDimensions: string[];
  baselineValue?: any;
  compareValue?: any;
  details: {
    dimension: string;
    baseline: any;
    compare: any;
    diff: number;
  }[];
}

interface DiffResult {
  differences: Difference[];
  totalDifferences: number;
  structureDifferences: number;
  costDifferences: number;
  complianceDifferences: number;
  supplierDifferences: number;
}

const useDiffCalculator = (selectedBOMIds: string[], baselineIndex: number, compareDimensions: string[]) => {
  const [diffData, setDiffData] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 模拟获取BOM数据
  const fetchBOMData = async (bomIds: string[]): Promise<BOMData[]> => {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 返回模拟数据
    return bomIds.map((id, index) => ({
      id,
      name: `BOM ${id}`,
      items: [
        { id: `${id}-1`, partNumber: 'CPU-001', description: '处理器', quantity: 1, cost: 350 + index * 10 },
        { id: `${id}-2`, partNumber: 'RAM-002', description: '内存', quantity: 2, cost: 150 + index * 5, supplier: `供应商${index + 1}` },
        { id: `${id}-3`, partNumber: 'SSD-003', description: '固态硬盘', quantity: 1, cost: 200 + index * 8, complianceStatus: 'compliant' },
        { id: `${id}-4`, partNumber: 'MB-004', description: '主板', quantity: 1, cost: 250 + index * 12, complianceStatus: index % 2 === 0 ? 'compliant' : 'warning' },
        ...(index > 0 ? [{ id: `${id}-5`, partNumber: 'GPU-005', description: '显卡', quantity: 1, cost: 450 }] : [])
      ]
    }));
  };

  // 计算差异
  const calculateDiff = async (): Promise<void> => {
    setLoading(true);
    try {
      // 获取BOM数据
      const boms = await fetchBOMData(selectedBOMIds);
      
      if (boms.length < 2 || baselineIndex >= boms.length) {
        throw new Error('BOM数据不足或基线索引无效');
      }

      const baselineBOM = boms[baselineIndex];
      const differences: Difference[] = [];
      
      // 创建基线BOM项的Map便于查找
      const baselineItemsMap = new Map(baselineBOM.items.map(item => [item.partNumber, item]));
      
      // 遍历每个比较BOM
      boms.forEach((compareBOM, compareIndex) => {
        if (compareIndex === baselineIndex) return; // 跳过基线本身

        // 创建比较BOM项的Map
        const compareItemsMap = new Map(compareBOM.items.map(item => [item.partNumber, item]));
        
        // 检查基线中存在但比较BOM中不存在的项（删除项）
        if (compareDimensions.includes('structure')) {
          baselineItemsMap.forEach((baselineItem, partNumber) => {
            if (!compareItemsMap.has(partNumber)) {
              differences.push({
                id: `diff-removed-${partNumber}`,
                partNumber,
                description: baselineItem.description,
                changeType: 'removed',
                affectedDimensions: ['structure'],
                baselineValue: baselineItem,
                details: [{
                  dimension: 'structure',
                  baseline: '存在',
                  compare: '不存在',
                  diff: -1
                }]
              });
            }
          });

          // 检查比较BOM中存在但基线中不存在的项（新增项）
          compareItemsMap.forEach((compareItem, partNumber) => {
            if (!baselineItemsMap.has(partNumber)) {
              differences.push({
                id: `diff-added-${partNumber}`,
                partNumber,
                description: compareItem.description,
                changeType: 'added',
                affectedDimensions: ['structure'],
                compareValue: compareItem,
                details: [{
                  dimension: 'structure',
                  baseline: '不存在',
                  compare: '存在',
                  diff: 1
                }]
              });
            }
          });
        }

        // 检查共同项的变更
        baselineItemsMap.forEach((baselineItem, partNumber) => {
          const compareItem = compareItemsMap.get(partNumber);
          if (compareItem) {
            const affectedDims: string[] = [];
            const itemDetails: any[] = [];

            // 检查成本变更
            if (compareDimensions.includes('cost') && baselineItem.cost !== compareItem.cost) {
              affectedDims.push('cost');
              itemDetails.push({
                dimension: 'cost',
                baseline: baselineItem.cost,
                compare: compareItem.cost,
                diff: compareItem.cost - baselineItem.cost
              });
            }

            // 检查合规状态变更
            if (compareDimensions.includes('compliance') && 
                baselineItem.complianceStatus !== compareItem.complianceStatus) {
              affectedDims.push('compliance');
              itemDetails.push({
                dimension: 'compliance',
                baseline: baselineItem.complianceStatus || '未定义',
                compare: compareItem.complianceStatus || '未定义',
                diff: baselineItem.complianceStatus !== compareItem.complianceStatus ? 1 : 0
              });
            }

            // 检查供应商变更
            if (compareDimensions.includes('supplier') && 
                baselineItem.supplier !== compareItem.supplier) {
              affectedDims.push('supplier');
              itemDetails.push({
                dimension: 'supplier',
                baseline: baselineItem.supplier || '未定义',
                compare: compareItem.supplier || '未定义',
                diff: 1
              });
            }

            // 如果有变更，添加差异记录
            if (affectedDims.length > 0) {
              differences.push({
                id: `diff-modified-${partNumber}-${compareIndex}`,
                partNumber,
                description: baselineItem.description,
                changeType: 'modified',
                affectedDimensions: affectedDims,
                baselineValue: baselineItem,
                compareValue: compareItem,
                details: itemDetails
              });
            }
          }
        });
      });

      // 计算各维度的差异数量
      const structureDifferences = differences.filter(diff => diff.affectedDimensions.includes('structure')).length;
      const costDifferences = differences.filter(diff => diff.affectedDimensions.includes('cost')).length;
      const complianceDifferences = differences.filter(diff => diff.affectedDimensions.includes('compliance')).length;
      const supplierDifferences = differences.filter(diff => diff.affectedDimensions.includes('supplier')).length;

      // 设置差异结果
      setDiffData({
        differences,
        totalDifferences: differences.length,
        structureDifferences,
        costDifferences,
        complianceDifferences,
        supplierDifferences
      });
    } catch (error) {
      console.error('计算差异时出错:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    calculateDiff,
    diffData,
    loading
  };
};

export default useDiffCalculator;