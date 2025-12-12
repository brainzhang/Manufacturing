import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Row, Col, message, Tooltip, Space } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { BOM_LEVELS } from '../constants/bomConstants';
import PlatformTemplateTab from './tabs/PlatformTemplateTab';
import StatisticsPanel from './components/StatisticsPanel';
import { useBOMContext } from './context/BOMContext';

const BOMStructureStepNew = ({ 
  form, 
  currentStep, 
  onStepChange, 
  initialData = null,
  onStructureChange,
  checkMissingParts
}) => {
  // 不再需要currentTab状态，因为只有平台模板一个选项
  // BOM树数据状态
  const [bomTreeData, setBomTreeData] = useState([]);
  // 统计数据
  const [statistics, setStatistics] = useState({
    totalParts: 0,
    totalCost: 0,
    totalSuppliers: 0,
    totalAlternatives: 0,
    missingParts: 0,
    warningParts: 0
  });
  
  // 使用BOM上下文
  const { updateBOMStructure, validateBOMStructure } = useBOMContext();

  // 当有初始数据时，设置默认Tab（仅保留平台模板相关逻辑）
  useEffect(() => {
    // 设置默认tab为平台模板
    setCurrentTab('platform');
    
    // 如果有平台信息或产品型号信息，在控制台记录
    if (initialData && initialData.platform) {
      console.log('自动加载平台模板:', initialData.platform);
    } else if (initialData && initialData.productModel) {
      console.log('根据产品型号自动加载平台模板:', initialData.productModel);
    }
  }, [initialData]);

  // 当BOM树数据变化时，更新统计信息
  useEffect(() => {
    calculateStatistics();
  }, [bomTreeData]);

  // 不再需要Tab切换处理方法，因为只有平台模板一个选项

  // 当BOM结构变化时的回调（简化为只处理平台模板）
  const handleStructureUpdate = (newData) => {
    console.log('BOMStructureStepNew handleStructureUpdate:', newData);
    
    // 确保数据是有效的
    if (!newData || !Array.isArray(newData)) {
      console.error('无效的BOM结构数据:', newData);
      return;
    }
    
    // 创建新数组引用，确保React检测到变化
    const dataCopy = [...newData];
    setBomTreeData(dataCopy);
    
    // 计算总成本
    let totalCost = 0;
    const traverse = (nodes) => {
      nodes.forEach(node => {
        // 只计算L6层级的激活状态的主料成本
        if (node.level === BOM_LEVELS.L6.level && node.status === 'Active') {
          totalCost += (node.cost || 0) * (node.quantity || 1);
        }
        
        // 如果有子节点，递归遍历
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(dataCopy);
    
    // 通知父组件结构已变化
    if (onStructureChange) {
      console.log('调用onStructureChange回调');
      onStructureChange({
        data: dataCopy,
        sourceType: 'platform',
        isValid: validateBOMStructure(dataCopy),
        totalCost
      });
    }

    // 更新BOM上下文
    updateBOMStructure(dataCopy);
  };

  // 计算BOM统计信息
  const calculateStatistics = () => {
    let totalParts = 0;
    let totalCost = 0;
    const suppliers = new Set();
    let totalAlternatives = 0;
    let missingParts = 0;
    let warningParts = 0;

    const traverse = (nodes) => {
      if (!nodes || !Array.isArray(nodes)) return;
      
      nodes.forEach(node => {
        // 只统计L6和L7层的零件
        if (node.level >= BOM_LEVELS.L6.level) {
          if (node.isPart) {
            totalParts++;
            
            if (node.cost) {
              totalCost += parseFloat(node.cost) * (node.quantity || 1);
            }
            
            if (node.supplier) {
              suppliers.add(node.supplier);
            }

            // 统计替代料数量 (L7层)
            if (node.level === BOM_LEVELS.L7.level) {
              totalAlternatives++;
            }
            
            // 统计缺失件（用量为0或负数）
            if (node.quantity <= 0) {
              missingParts++;
            }
            
            // 统计警告件（生命周期为PhaseOut）
            if (node.lifecycle === 'PhaseOut') {
              warningParts++;
            }
          }
        }
        
        // 递归处理子节点
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };

    traverse(bomTreeData);
    
    setStatistics({
      totalParts,
      totalCost,
      totalSuppliers: suppliers.size,
      totalAlternatives,
      missingParts,
      warningParts
    });
  };

  // 下一步处理
  const handleNextStep = () => {
    // 保存当前结构数据，不再验证BOM结构完整性，允许随时保存模板
    form.setFieldsValue({
      bomStructure: {
        data: bomTreeData,
        sourceType: currentTab,
        statistics
      }
    });
    
    // 进入下一步
    if (onStepChange) {
      onStepChange(currentStep + 1);
    }
  };

  // Tab配置 - 仅保留平台模板
  const tabItems = [
    {
      key: 'platform',
      title: (
        <span>
          <FileTextOutlined style={{ fontSize: '19.2px', transform: 'scale(1.2)' }} />
          平台模板
        </span>
      ),
      description: '复用历史模板',
      tooltip: '7层BOM结构：整机→模块→子模块→族→组→主料→替代料，L6/L7层挂零件，位号自动生成，成本实时rollup',
      component: (
        <PlatformTemplateTab 
          initialPlatform={initialData?.platform}
          productModel={initialData?.productModel}
          productGen={initialData?.productGen}
          version={initialData?.version}
          onStructureLoad={handleStructureUpdate}
        />
      )
    }
  ];

  return (
    <div className="bom-structure-step" style={{ backgroundColor: '#f5f7fa', minHeight: '600px' }}>
      <Card className="step-header-card" style={{ marginBottom: '16px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>BOM结构搭建</h2>
            <p style={{ margin: '8px 0 0', color: '#666' }}>选择最适合的BOM创建方式，构建7层深度BOM树</p>
          </Col>
          <Col>
            {/* AI辅助按钮暂时移除 */}
          </Col>
        </Row>
      </Card>

      {/* Tab切换区域 - 移动到下方 */}
      <Card style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ minHeight: '400px', width: '100%' }}>
          {tabItems[0].component}
        </div>
      </Card>
    </div>
  );
};

export default BOMStructureStepNew;