import React from 'react';
import BOMStructureNew from './BOMStructureNew';

const BOMStructureStep = ({ 
  currentStep, 
  onStepChange, 
  data,
  onChange,
  addLog
}) => {
  // 包装onChange回调以添加调试日志
  const handleStructureChange = (newData) => {
    console.log('BOMStructureStep收到结构更新:', {
      treeData: newData.treeData ? `节点数: ${newData.treeData.length}` : '空',
      parts: newData.parts ? `零件数: ${newData.parts.length}` : '空',
      totalCost: newData.totalCost || 0,
      hasTotalCost: newData.totalCost !== undefined,
      fullData: newData
    });
    
    // 调用原始的onChange回调
    if (onChange) {
      onChange(newData);
    }
  };

  return (
    <BOMStructureNew
      currentStep={currentStep}
      onStepChange={onStepChange}
      initialData={data}
      onStructureChange={handleStructureChange}
      addLog={addLog}
    />
  );
};

export default BOMStructureStep;