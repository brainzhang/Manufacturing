import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Tree, 
  Button, 
  Space, 
  Tag, 
  Tooltip,
  message,
  Modal,
  Input,
  Select,
  InputNumber,
  Popconfirm,
  Divider,
  Alert,
  Statistic,
  Progress,
  Spin,
  Empty,
  Row,
  Col
} from 'antd';
import { 
  FileTextOutlined, 
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  SwapOutlined,
  StopOutlined,
  PlayCircleOutlined,
  BulbOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DragOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TreeNode } = Tree;

// 7层BOM结构常量
export const BOM_LEVELS = {
  L1: { name: '整机', level: 1, isParent: true, canHaveParts: false },
  L2: { name: '模块', level: 2, isParent: true, canHaveParts: false },
  L3: { name: '子模块', level: 3, isParent: true, canHaveParts: false },
  L4: { name: '族', level: 4, isParent: true, canHaveParts: false },
  L5: { name: '组', level: 5, isParent: true, canHaveParts: false },
  L6: { name: '主料', level: 6, isParent: false, canHaveParts: true },
  L7: { name: '替代料', level: 7, isParent: false, canHaveParts: true }
};

// 创建BOM节点
const createBOMNode = (config) => {
  const node = {
    key: config.key || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: config.title,
    level: config.level,
    parentId: config.parentId,
    position: config.position,
    children: config.children || []
  };
  
  // 根据层级设置节点类型
  if (config.level === BOM_LEVELS.L6.level) {
    node.nodeType = '主料';
  } else if (config.level === BOM_LEVELS.L7.level) {
    node.nodeType = '替代料';
  } else {
    node.nodeType = '父节点';
  }
  
  // 添加物料相关属性
  if (config.partId) {
    node.partId = config.partId;
    node.materialName = config.materialName;
    node.quantity = config.quantity;
    node.unit = config.unit;
    node.cost = config.cost;
    node.supplier = config.supplier;
    node.variance = config.variance;
    node.lifecycle = config.lifecycle;
    node.status = config.status;
  }
  
  // 替代料特有属性
  if (config.level === BOM_LEVELS.L7.level) {
    node.substituteGroup = config.substituteGroup;
  }
  
  return node;
};

// 生成默认BOM模板
const generateDefaultTemplate = () => {
  const rootNode = createBOMNode({
    level: 1,
    title: '笔记本电脑整机',
    position: '1'
  });

  // L2: 模块层
  const module1 = createBOMNode({
    level: 2,
    title: '主板模块',
    parentId: rootNode.id,
    position: '1.1'
  });

  const module2 = createBOMNode({
    level: 2,
    title: '电源模块',
    parentId: rootNode.id,
    position: '1.2'
  });

  // L3: 子模块层
  const subModule1 = createBOMNode({
    level: 3,
    title: 'CPU子系统',
    parentId: module1.id,
    position: '1.1.1'
  });

  const subModule2 = createBOMNode({
    level: 3,
    title: '内存子系统',
    parentId: module1.id,
    position: '1.1.2'
  });

  const subModule3 = createBOMNode({
    level: 3,
    title: '存储子系统',
    parentId: module1.id,
    position: '1.1.3'
  });

  // L4: 族层
  const family1 = createBOMNode({
    level: 4,
    title: 'Intel处理器族',
    parentId: subModule1.id,
    position: '1.1.1.1'
  });

  const family2 = createBOMNode({
    level: 4,
    title: 'DDR5内存族',
    parentId: subModule2.id,
    position: '1.1.2.1'
  });

  const family3 = createBOMNode({
    level: 4,
    title: 'NVMe固态硬盘族',
    parentId: subModule3.id,
    position: '1.1.3.1'
  });

  // L5: 组层
  const group1 = createBOMNode({
    level: 5,
    title: 'Core Ultra处理器组',
    parentId: family1.id,
    position: '1.1.1.1.1'
  });

  const group2 = createBOMNode({
    level: 5,
    title: 'LPDDR5X内存组',
    parentId: family2.id,
    position: '1.1.2.1.1'
  });

  const group3 = createBOMNode({
    level: 5,
    title: 'M.2固态硬盘组',
    parentId: family3.id,
    position: '1.1.3.1.1'
  });

  // L6: 主料层
  const mainPart1 = createBOMNode({
    level: 6,
    title: 'Intel Core Ultra 7 155H',
    nodeType: '主料',
    partId: 'CPU-001',
    materialName: 'Intel Core Ultra 7 155H',
    parentId: group1.id,
    position: 'U1.A',
    quantity: 1,
    unit: '个',
    cost: 4500,
    supplier: 'Intel',
    variance: 0,
    lifecycle: '量产',
    status: 'Active'
  });

  const mainPart2 = createBOMNode({
    level: 6,
    title: 'LPDDR5X 16GB',
    nodeType: '主料',
    partId: 'MEM-001',
    materialName: 'LPDDR5X 16GB内存条',
    parentId: group2.id,
    position: 'M1.A',
    quantity: 2,
    unit: '条',
    cost: 800,
    supplier: '三星',
    variance: 0,
    lifecycle: '量产',
    status: 'Active'
  });

  const mainPart3 = createBOMNode({
    level: 6,
    title: 'WD Black SN850X 2TB',
    nodeType: '主料',
    partId: 'SSD-001',
    materialName: 'WD Black SN850X 2TB NVMe固态硬盘',
    parentId: group3.id,
    position: 'S1.A',
    quantity: 1,
    unit: '块',
    cost: 1800,
    supplier: '西部数据',
    variance: 0,
    lifecycle: '量产',
    status: 'Active'
  });

  // L7: 替代料层
  const alternative1 = createBOMNode({
    level: 7,
    title: 'Intel Core Ultra 5 135H',
    nodeType: '替代料',
    partId: 'CPU-002',
    materialName: 'Intel Core Ultra 5 135H',
    parentId: group1.id,
    position: 'U1.A.1',
    quantity: 1,
    unit: '个',
    cost: 3800,
    supplier: 'Intel',
    variance: -15.6,
    lifecycle: '量产',
    status: 'Active',
    substituteGroup: 'A'
  });

  const alternative2 = createBOMNode({
    level: 7,
    title: 'AMD Ryzen 7 7840U',
    nodeType: '替代料',
    partId: 'CPU-003',
    materialName: 'AMD Ryzen 7 7840U',
    parentId: group1.id,
    position: 'U1.A.2',
    quantity: 1,
    unit: '个',
    cost: 4200,
    supplier: 'AMD',
    variance: -6.7,
    lifecycle: '量产',
    status: 'Active',
    substituteGroup: 'B'
  });

  const alternative3 = createBOMNode({
    level: 7,
    title: 'SK Hynix 16GB LPDDR5X',
    nodeType: '替代料',
    partId: 'MEM-002',
    materialName: 'SK Hynix 16GB LPDDR5X内存条',
    parentId: group2.id,
    position: 'M1.A.1',
    quantity: 2,
    unit: '条',
    cost: 750,
    supplier: 'SK海力士',
    variance: -6.3,
    lifecycle: '量产',
    status: 'Active',
    substituteGroup: 'A'
  });

  const alternative4 = createBOMNode({
    level: 7,
    title: 'Samsung 980 PRO 2TB',
    nodeType: '替代料',
    partId: 'SSD-002',
    materialName: 'Samsung 980 PRO 2TB NVMe固态硬盘',
    parentId: group3.id,
    position: 'S1.A.1',
    quantity: 1,
    unit: '块',
    cost: 1750,
    supplier: '三星',
    variance: -2.8,
    lifecycle: '量产',
    status: 'Active',
    substituteGroup: 'A'
  });

  // 构建树结构
  group1.children = [mainPart1, alternative1, alternative2];
  group2.children = [mainPart2, alternative3];
  group3.children = [mainPart3, alternative4];
  
  family1.children = [group1];
  family2.children = [group2];
  family3.children = [group3];
  
  subModule1.children = [family1];
  subModule2.children = [family2];
  subModule3.children = [family3];
  
  module1.children = [subModule1, subModule2, subModule3];
  module2.children = [];
  
  rootNode.children = [module1, module2];

  return [rootNode];
};

// BOM结构编辑器组件
const BOMStructureEditor = ({ onStructureChange }) => {
  const [bomTreeData, setBomTreeData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showAlternativeDrawer, setShowAlternativeDrawer] = useState(false);
  const [statistics, setStatistics] = useState({
    totalParts: 0,
    totalCost: 0,
    activeParts: 0,
    deprecatedParts: 0,
    alternativeParts: 0,
    supplierCount: 0,
    costPercentage: 0
  });
  const [previewData, setPreviewData] = useState([]);

  // 初始化加载默认模板
  useEffect(() => {
    loadDefaultTemplate();
  }, []);

  // 更新统计数据
  useEffect(() => {
    const stats = calculateStatistics();
    setStatistics(stats);
    
    // 更新预览数据
    setPreviewData(JSON.parse(JSON.stringify(bomTreeData)));
  }, [bomTreeData]);

  // 加载默认模板
  const loadDefaultTemplate = () => {
    setLoading(true);
    setTimeout(() => {
      const template = generateDefaultTemplate();
      setBomTreeData(template);
      
      // 自动展开所有节点
      const allKeys = getAllNodeKeys(template);
      setExpandedKeys(allKeys);
      
      // 计算初始总成本
      const initialCost = calculateInitialCost(template);
      
      setLoading(false);
      
      // 通知父组件
      if (onStructureChange) {
        onStructureChange({
          data: template,
          sourceType: 'platform',
          isValid: validateBOMStructure(template),
          totalCost: initialCost
        });
      }
    }, 500);
  };

  // 获取所有节点键
  const getAllNodeKeys = (nodes) => {
    let keys = [];
    
    const traverse = (nodeList) => {
      nodeList.forEach(node => {
        keys.push(node.key);
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    
    traverse(nodes);
    return keys;
  };

  // 验证BOM结构
const validateBOMStructure = (treeData) => {
  let hasL6Parts = false;
  
  const traverse = (nodes) => {
    nodes.forEach(node => {
      if (node.level === BOM_LEVELS.L6.level && node.status === 'Active') {
        hasL6Parts = true;
      }
      if (node.children) {
        traverse(node.children);
      }
    });
  };
  
  traverse(treeData);
  return hasL6Parts;
};

  // 计算BOM统计信息
  const calculateStatistics = () => {
    let totalParts = 0;
    let totalCost = 0;
    let activeParts = 0;
    let deprecatedParts = 0;
    let alternativeParts = 0;
    const supplierSet = new Set(); // 用于去重统计供应商

    const traverse = (nodes) => {
      nodes.forEach(node => {
        if (node.level >= BOM_LEVELS.L6.level) {
          totalParts++;
          
          // 只统计活跃状态的非替代料成本
          if (node.status === 'Active' && node.level !== BOM_LEVELS.L7.level) {
            activeParts++;
            totalCost += (node.cost || 0) * (node.quantity || 1);
            
            // 统计供应商（去重）
            if (node.supplier) {
              supplierSet.add(node.supplier);
            }
          } else if (node.status === 'Deprecated') {
            deprecatedParts++;
          }
          
          if (node.level === BOM_LEVELS.L7.level) {
            alternativeParts++;
          }
        }
        
        if (node.children) {
          traverse(node.children);
        }
      });
    };

    traverse(bomTreeData);
    
    return {
      totalParts,
      totalCost,
      activeParts,
      deprecatedParts,
      alternativeParts,
      supplierCount: supplierSet.size,
      costPercentage: totalParts > 0 ? (activeParts / totalParts) * 100 : 0
    };
  };

  // 计算BOM总成本
  const calculateInitialCost = (treeData) => {
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
    
    traverse(treeData);
    return totalCost;
  };

  // 弃用零件
  const handleDeprecate = useCallback((node) => {
    const updateNodeStatus = (nodes, targetKey) => {
      return nodes.map(node => {
        if (node.key === targetKey) {
          return {
            ...node,
            status: 'Deprecated',
            quantity: 0
          };
        }
        
        if (node.children) {
          return {
            ...node,
            children: updateNodeStatus(node.children, targetKey)
          };
        }
        
        return node;
      });
    };

    const newData = updateNodeStatus(bomTreeData, node.key);
    setBomTreeData(newData);
    
    message.success(`零件 ${node.title} 已弃用，数量置0并同步SAP`);
    
    if (onStructureChange) {
      // 计算新的总成本
      const newTotalCost = calculateInitialCost(newData);
      
      onStructureChange({
        data: newData,
        sourceType: 'platform',
        isValid: validateBOMStructure(newData),
        totalCost: newTotalCost
      });
    }
  }, [bomTreeData, onStructureChange]);

  // 启用零件
  const handleEnable = useCallback((node) => {
    const updateNodeStatus = (nodes, targetKey) => {
      return nodes.map(node => {
        if (node.key === targetKey) {
          return {
            ...node,
            status: 'Active',
            quantity: node.quantity || 1
          };
        }
        
        if (node.children) {
          return {
            ...node,
            children: updateNodeStatus(node.children, targetKey)
          };
        }
        
        return node;
      });
    };

    const newData = updateNodeStatus(bomTreeData, node.key);
    setBomTreeData(newData);
    
    message.success(`零件 ${node.title} 已启用，成本实时重算`);
    
    if (onStructureChange) {
      // 计算新的总成本
      const newTotalCost = calculateInitialCost(newData);
      
      onStructureChange({
        data: newData,
        sourceType: 'platform',
        isValid: validateBOMStructure(newData),
        totalCost: newTotalCost
      });
    }
  }, [bomTreeData, onStructureChange]);

  // 替换零件
  const handleReplace = useCallback((node, newPart) => {
    const replaceNode = (nodes, targetKey, replacement) => {
      return nodes.map(node => {
        if (node.key === targetKey) {
          // 标记旧零件为已替换
          const oldPart = {
            ...node,
            status: 'Replaced'
          };
          
          // 创建新零件
          const newPartNode = {
            ...replacement,
            parentId: node.parentId,
            position: node.position,
            key: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          
          return newPartNode;
        }
        
        if (node.children) {
          return {
            ...node,
            children: replaceNode(node.children, targetKey, replacement)
          };
        }
        
        return node;
      });
    };

    const newData = replaceNode(bomTreeData, node.key, newPart);
    setBomTreeData(newData);
    
    message.success(`零件 ${node.title} 已替换，位号不变，成本差异实时刷新`);
    
    if (onStructureChange) {
      // 计算新的总成本
      const newTotalCost = calculateInitialCost(newData);
      
      onStructureChange({
        data: newData,
        sourceType: 'platform',
        isValid: validateBOMStructure(newData),
        totalCost: newTotalCost
      });
    }
  }, [bomTreeData, onStructureChange]);

  // 打开替代料抽屉
  const handleShowAlternatives = useCallback((node) => {
    setSelectedNode(node);
    setShowAlternativeDrawer(true);
  }, []);

  // 获取层级颜色
const getLevelColor = (level) => {
  const colorMap = {
    [BOM_LEVELS.L1.level]: 'red',
    [BOM_LEVELS.L2.level]: 'orange',
    [BOM_LEVELS.L3.level]: 'gold',
    [BOM_LEVELS.L4.level]: 'green',
    [BOM_LEVELS.L5.level]: 'blue',
    [BOM_LEVELS.L6.level]: 'purple',
    [BOM_LEVELS.L7.level]: 'cyan'
  };
  return colorMap[level] || 'default';
};

  // 渲染节点标题
  const renderNodeTitle = (node) => {
    const isDeprecated = node.status === 'Deprecated';
    const isReplaced = node.status === 'Replaced';
    const isAlternative = node.level === BOM_LEVELS.L7.level;
    
    // L7替代料样式：灰色 + 删除线
    const textStyle = isAlternative ? {
      color: '#999',
      textDecoration: 'line-through'
    } : (isDeprecated || isReplaced) ? {
      opacity: 0.6,
      textDecoration: 'line-through'
    } : {
      opacity: 1,
      textDecoration: 'none'
    };
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%',
        ...textStyle
      }}>
        <Space>
          <span>{node.title}</span>
          <Tag color={getLevelColor(node.level)} size="small">
            {/* 层级标签已删除 */}
          </Tag>
          
          {/* 状态标签 */}
          {node.status === 'Deprecated' && (
            <Tag color="red" size="small">已弃用</Tag>
          )}
          {node.status === 'Replaced' && (
            <Tag color="orange" size="small">已替换</Tag>
          )}
          
          {/* L6及以上层级显示零件信息 */}
          {node.level >= BOM_LEVELS.L6.level && (
            <>
              <Tag color="blue" size="small">{node.position}</Tag>
              <Tag color="green" size="small">Qty: {node.quantity}</Tag>
              <Tag color="purple" size="small">¥{node.cost}</Tag>
              {node.supplier && (
                <Tag color="volcano" size="small">{node.supplier}</Tag>
              )}
            </>
          )}
        </Space>
        
        {/* 操作按钮 - 只有L6和L7层级有 */}
        {node.level >= BOM_LEVELS.L6.level && (
          <Space size="small" style={{ marginLeft: 'auto' }}>
            {node.status === 'Active' ? (
              <Tooltip title="弃用">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<StopOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeprecate(node);
                  }}
                  style={{ color: '#ff4d4f' }}
                />
              </Tooltip>
            ) : (
              <Tooltip title="启用">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<PlayCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnable(node);
                  }}
                  style={{ color: '#52c41a' }}
                  disabled={node.lifecycle === 'PhaseOut'}
                />
              </Tooltip>
            )}
            
            <Tooltip title="替换">
              <Button 
                type="text" 
                size="small" 
                icon={<SwapOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  // 这里可以打开替换零件的选择器
                  message.info('替换功能开发中...');
                }}
              />
            </Tooltip>
            
            <Tooltip title="查看详情">
              <Button 
                type="text" 
                size="small" 
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                  setShowDetailDrawer(true);
                }}
              />
            </Tooltip>
          </Space>
        )}
      </div>
    );
  };

  // 渲染右侧预览树
  const renderPreviewTree = (nodes, level = 0) => {
    return nodes.map(node => ({
      ...node,
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{node.title}</span>
          <Tag color={getLevelColor(node.level)} size="small">
            {/* 层级标签已删除 */}
          </Tag>
        </div>
      ),
      children: node.children && node.children.length > 0 ? renderPreviewTree(node.children, level + 1) : undefined
    }));
  };

  // 节点选择处理
  const onSelect = (selectedKeys, info) => {
    setSelectedKeys(selectedKeys);
    if (info.selected) {
      setSelectedNode(info.node);
    } else {
      setSelectedNode(null);
    }
  };

  return (
    <Row gutter={16}>
      {/* 左侧主编辑区 */}
      <Col span={18}>
        <Card title="BOM结构编辑器" extra={
          <Space>
            <Button 
              icon={<PlusOutlined />} 
              onClick={loadDefaultTemplate}
            >
              加载平台模板
            </Button>
          </Space>
        }>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" />
            </div>
          ) : bomTreeData.length > 0 ? (
            <Tree
              showLine
              treeData={bomTreeData}
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              onExpand={setExpandedKeys}
              onSelect={onSelect}
              titleRender={renderNodeTitle}
            />
          ) : (
            <Empty 
              description="暂无BOM数据，请点击上方'加载平台模板'按钮加载默认BOM结构" 
              style={{ padding: '50px 0' }}
            />
          )}
        </Card>
      </Col>
      
      {/* 右侧预览区 */}
      <Col span={6}>
        <Card title="BOM结构预览" size="small">
          <Tree
            showLine
            treeData={renderPreviewTree(previewData)}
            defaultExpandAll
          />
        </Card>
        
        {/* 统计信息 */}
        <Card title="统计信息" size="small" style={{ marginTop: '16px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic title="总零件数" value={statistics.totalParts} />
            </Col>
            <Col span={12}>
              <Statistic title="活跃零件" value={statistics.activeParts} />
            </Col>
            <Col span={12}>
              <Statistic title="替代料数" value={statistics.alternativeParts} />
            </Col>
            <Col span={12}>
              <Statistic title="供应商数" value={statistics.supplierCount} />
            </Col>
            <Col span={24}>
              <Statistic 
                title="总成本" 
                value={calculateInitialCost(bomTreeData)} 
                precision={2}
                prefix="¥" 
              />
            </Col>
          </Row>
          
          <Divider />
          
          <div style={{ marginTop: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span>活跃零件比例</span>
            </div>
            <Progress 
              percent={Math.round(statistics.costPercentage)} 
              status={statistics.costPercentage >= 90 ? 'success' : 
                      statistics.costPercentage >= 70 ? 'normal' : 'exception'} 
            />
          </div>
        </Card>
      </Col>
      
      {/* 节点详情抽屉 */}
      <Drawer
        title="BOM节点详情"
        placement="right"
        onClose={() => setShowDetailDrawer(false)}
        open={showDetailDrawer}
        width={600}
      >
        {selectedNode && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>基本信息</div>
                  <div>节点名称: {selectedNode.title}</div>
                  <div>层级: L{selectedNode.level} - {BOM_LEVELS[`L${selectedNode.level}`].name}</div>
                  <div>位号: {selectedNode.position || '-'}</div>
                  <div>零件名称: {selectedNode.materialName || '-'}</div>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>业务信息</div>
                  <div>供应商: {selectedNode.supplier || '-'}</div>
                  <div>生命周期: {selectedNode.lifecycle || '-'}</div>
                  <div>状态: {selectedNode.status || '-'}</div>
                </div>
              </Col>
              
              {selectedNode.level >= BOM_LEVELS.L6.level && (
                <>
                  <Col span={12}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>数量与成本</div>
                      <div>数量: {selectedNode.quantity} {selectedNode.unit}</div>
                      <div>单价: ¥{selectedNode.cost}</div>
                      <div>小计: ¥{(selectedNode.cost * selectedNode.quantity).toFixed(2)}</div>
                    </div>
                  </Col>
                  
                  <Col span={12}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>差异分析</div>
                      <div>成本差异: {selectedNode.variance ? `${selectedNode.variance}%` : '-'}</div>
                      {selectedNode.level === BOM_LEVELS.L7.level && (
                        <div style={{ color: '#999', marginTop: '8px' }}>
                          注: 替代料不计入总成本核算
                        </div>
                      )}
                    </div>
                  </Col>
                </>
              )}
            </Row>
          </div>
        )}
      </Drawer>
    </Row>
  );
};

export default BOMStructureEditor;