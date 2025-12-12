import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  Tree, 
  Button, 
  Alert, 
  Spin, 
  Empty,
  Typography,
  Space,
  Tag,
  Divider,
  List,
  Tooltip,
  message,
  Modal,
  Statistic,
  Table,
  InputNumber,
  Drawer,
  Badge,
  FloatButton,
  Switch
} from 'antd';
import { 
  FolderOutlined, 
  FileOutlined, 
  CheckCircleOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  StopOutlined,
  PlayCircleOutlined,
  BulbOutlined,
  SwapOutlined,
  RobotOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { BOM_LEVELS } from '../../constants/bomConstants';
import { bom7LayerTemplate } from '../bom7LayerTemplate';
import templateService from "../../services/templateService";
import { calculateStatistics, checkMissingParts as checkMissingPartsFromBomUtils } from '../../utils/bomUtils';
import { 
  getAlternativeParts, 
  checkMissingPartsWarning, 
  getLowCostSuggestions as getLowCostSuggestionsFromAiUtils, 
  validateBOMStructure,
  generatePosition
} from '../../utils/aiUtils';

const { Option } = Select;
const { Title, Text } = Typography;
const { DirectoryTree } = Tree;

// 产品平台数据
const productPlatforms = [
  {
    id: 'laptop',
    name: '笔记本平台',
    description: 'ThinkPad系列笔记本电脑',
    versions: ['X1 Carbon', 'T14', 'P1'],
    image: '/placeholder/laptop.jpg'
  },
  {
    id: 'desktop',
    name: '桌面平台',
    description: 'ThinkStation系列工作站',
    versions: ['P360', 'P340', 'P720'],
    image: '/placeholder/desktop.jpg'
  },
  {
    id: 'server',
    name: '服务器平台',
    description: 'ThinkSystem系列服务器',
    versions: ['SR650', 'SR630', 'SR850'],
    image: '/placeholder/server.jpg'
  },
  {
    id: 'mobile',
    name: '移动平台',
    description: 'ThinkPad系列移动设备',
    versions: ['X12', 'X13', 'X1 Fold'],
    image: '/placeholder/mobile.jpg'
  },
  {
    id: 'embedded',
    name: '嵌入式平台',
    description: 'ThinkEdge系列边缘计算设备',
    versions: ['SE30', 'SE50', 'SE450'],
    image: '/placeholder/embedded.jpg'
  }
];

// 平台到模板的映射关系
const platformTemplateMap = {
  'laptop': 'ThinkPad X1 Carbon Gen12',
  'desktop': 'ThinkStation P360',
  'server': 'ThinkSystem SR650',
  'mobile': 'ThinkPad X12 Detachable',
  'embedded': 'ThinkEdge SE30'
};

// 平台模板数据
const platformTemplates = [
  {
    id: 'laptop_v1',
    platform: 'laptop',
    version: 'X1 Carbon',
    name: 'ThinkPad X1 Carbon Gen12',
    template: bom7LayerTemplate['ThinkPad X1 Carbon Gen12']
  },
  {
    id: 'desktop_v1',
    platform: 'desktop',
    version: 'P360',
    name: 'ThinkStation P360',
    template: bom7LayerTemplate['ThinkStation P360'] || bom7LayerTemplate['ThinkPad X1 Carbon Gen12'] // 使用默认模板
  },
  {
    id: 'server_v1',
    platform: 'server',
    version: 'SR650',
    name: 'ThinkSystem SR650',
    template: bom7LayerTemplate['ThinkSystem SR650'] || bom7LayerTemplate['ThinkPad X1 Carbon Gen12'] // 使用默认模板
  },
  {
    id: 'mobile_v1',
    platform: 'mobile',
    version: 'X12',
    name: 'ThinkPad X12 Detachable',
    template: bom7LayerTemplate['ThinkPad X12 Detachable'] || bom7LayerTemplate['ThinkPad X1 Carbon Gen12'] // 使用默认模板
  },
  {
    id: 'embedded_v1',
    platform: 'embedded',
    version: 'SE30',
    name: 'ThinkEdge SE30',
    template: bom7LayerTemplate['ThinkEdge SE30'] || bom7LayerTemplate['ThinkPad X1 Carbon Gen12'] // 使用默认模板
  }
];

const PlatformTemplateTab = ({ onStructureLoad, initialPlatform, productModel, productGen, version }) => {
  // 状态管理
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [templateData, setTemplateData] = useState(null);
  // 模板历史记录
  const [templateHistory, setTemplateHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  // BOM统计信息
  const [statistics, setStatistics] = useState({
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
  });
  
  // 总成本状态
  const [totalCost, setTotalCost] = useState(0);
  
  // 自动填充位号状态
  const [autoFillPosition, setAutoFillPosition] = useState(true);
  
  // BOM数据状态
  const [bomData, setBomData] = useState([]);
  
  // BOM树结构视图相关状态
  const [viewMode, setViewMode] = useState('tree'); // 'tree' 或 'table'
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAlternativeDrawer, setShowAlternativeDrawer] = useState(false);
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [lowCostAlternatives, setLowCostAlternatives] = useState([]);
  const [missingPartsWarning, setMissingPartsWarning] = useState(false);
  const [missingPartsDetails, setMissingPartsDetails] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [positionAutoComplete, setPositionAutoComplete] = useState(true);
  
  // 自动加载标志
  const [autoLoaded, setAutoLoaded] = useState(false);
  
  // 获取同组FFF零件替代料
  const getAlternativePartsFromUtils = useCallback((node) => {
    // 使用从aiUtils.js导入的getAlternativeParts函数
    return getAlternativeParts(node);
  }, []);

  // 验证BOM结构
  const validateBOMStructureFromUtils = useCallback((treeData) => {
    // 使用从aiUtils.js导入的validateBOMStructure函数
    return validateBOMStructure(treeData);
  }, []);

  // 计算BOM总成本（考虑L6主料和L7替代料的情况）
  const calculateInitialCost = useCallback((treeData) => {
    let totalCost = 0;
    let l6Groups = new Map(); // 存储L6主料及其对应的L7替代料
    
    // 遍历树结构，收集L6和L7节点信息
    const traverse = (nodes) => {
      nodes.forEach(node => {
        if (node.level === BOM_LEVELS.L6.level && (node.itemStatus === 'Active' || node.itemStatus === 'Inactive')) {
          // 存储L6主料信息（包括Active和Inactive状态）
          l6Groups.set(node.key, {
            l6Node: node,
            hasActiveL7: false,
            l7Cost: 0
          });
        } else if (node.level === BOM_LEVELS.L7.level && node.itemStatus === 'Active') {
          // 查找对应的L6主料
          let l6Key = null;
          if (node.parentId) {
            // 如果有parentId，直接查找
            l6Key = node.parentId;
          } else {
            // 否则通过position匹配（L6和L7的position应该相同）
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
          }
        }
        
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    
    traverse(treeData);
    
    // 计算总成本：如果L6有激活的L7替代料，则只计算L7成本；否则计算L6成本（仅当L6为Active状态时）
    l6Groups.forEach(group => {
      if (group.hasActiveL7) {
        totalCost += group.l7Cost;
      } else if (group.l6Node.itemStatus === 'Active') {
        // 只有L6主料是Active状态时才计算成本
        totalCost += (group.l6Node.cost || 0) * (group.l6Node.quantity || 1);
      }
      // Inactive和Deprecated状态的L6主料不计算成本
    });
    
    return parseFloat(totalCost.toFixed(2));
  }, []);

  // 获取总零件数
  const getTotalPartsCount = useCallback((treeData) => {
    let count = 0;
    const traverse = (nodes) => {
      nodes.forEach(node => {
        if (node.level >= BOM_LEVELS.L6.level) {
          count++;
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(treeData);
    return count;
  }, []);

  // 获取低成本替代建议
  const getLowCostSuggestionsFromUtils = useCallback((alternatives, limit = 3) => {
    // 使用从aiUtils.js导入的getLowCostSuggestions函数
    return getLowCostSuggestionsFromAiUtils(alternatives, limit);
  }, []);

  // 检查缺失件
  const checkMissingPartsFromUtils = useCallback((treeData) => {
    // 使用从bomUtils.js导入的checkMissingParts函数
    return checkMissingPartsFromBomUtils(treeData);
  }, []);

  // 检查缺失件预警
  const checkMissingPartsWarningFromUtils = useCallback((treeData) => {
    // 使用从aiUtils.js导入的checkMissingPartsWarning函数
    const result = checkMissingPartsWarning(treeData);
    if (result && result.count > 0) {
      setMissingPartsWarning({
        count: result.count,
        percentage: result.differencePercentage || result.percentage,
        details: result.details
      });
    } else {
      setMissingPartsWarning(null);
    }
  }, []);

  // 获取所有节点键
  const getAllNodeKeys = useCallback((nodes) => {
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
  }, []);

  // 获取零件列表
  const getPartsList = useCallback((treeData) => {
    const parts = [];
    
    const traverse = (nodes) => {
        nodes.forEach(node => {
          if (node.level >= BOM_LEVELS.L6.level) {
            parts.push({
              key: node.key,
              position: node.position,
              partName: node.partName || node.title,
              quantity: node.quantity,
              unit: node.unit,
              cost: node.cost,
              supplier: node.supplier,
              variance: node.variance,
              lifecycle: node.lifecycle,
              itemStatus: node.itemStatus,
              level: node.level,
              nodeType: node.nodeType,
              parentId: node.parentId  // 添加parentId字段，用于L7替代料关联L6主料
            });
          }
          
          if (node.children) {
            traverse(node.children);
          }
        });
      };
    
    traverse(treeData);
    return parts;
  }, []);

  // 计算BOM零件列表的总成本
  const calculatePartsListCost = useCallback((parts) => {
    if (!parts || !Array.isArray(parts)) {
      return 0;
    }
    
    // 检查是否有激活的L7替代料
    const hasActiveAlternative = parts.some(part => part.level === BOM_LEVELS.L7.level && part.itemStatus === 'Active');
    
    let totalCost = 0;
    
    if (hasActiveAlternative) {
      // 有激活的L7替代料，只计算激活的L7替代料成本
      parts.forEach(part => {
        if (part.level === BOM_LEVELS.L7.level && part.itemStatus === 'Active') {
          totalCost += (part.cost || 0) * (part.quantity || 1);
        }
      });
    } else {
      // 没有激活的L7替代料，计算激活的L6主料成本
      parts.forEach(part => {
        if (part.level === BOM_LEVELS.L6.level && part.itemStatus === 'Active') {
          totalCost += (part.cost || 0) * (part.quantity || 1);
        }
      });
    }
    
    return totalCost;
  }, []);

  // 获取层级颜色
  const getLevelColor = useCallback((level) => {
    const colors = {
      [BOM_LEVELS.L1.level]: 'blue',
      [BOM_LEVELS.L2.level]: 'green',
      [BOM_LEVELS.L3.level]: 'orange',
      [BOM_LEVELS.L4.level]: 'purple',
      [BOM_LEVELS.L5.level]: 'cyan',
      [BOM_LEVELS.L6.level]: 'red',
      [BOM_LEVELS.L7.level]: 'magenta'
    };
    return colors[level] || 'default';
  }, []);

  // 渲染节点标题
  const renderNodeTitle = useCallback((node) => {
    const isDeprecated = node.itemStatus === 'Deprecated';
    const isInactive = node.itemStatus === 'Inactive';
    const isReplaced = node.itemStatus === 'Replaced';
    const isAlternative = node.level === BOM_LEVELS.L7.level; // L{BOM_LEVELS.L7.level}层替代料
    const isInactiveAlternative = isAlternative && node.itemStatus === 'Inactive'; // L{BOM_LEVELS.L7.level}层未激活的替代料
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%',
        opacity: isDeprecated || isReplaced || isInactiveAlternative || isInactive ? 0.4 : 1,
        textDecoration: isDeprecated || isInactiveAlternative || isInactive ? 'line-through' : 'none',
        cursor: isInactiveAlternative || isInactive ? 'not-allowed' : 'default'
      }}>
        <Space>
          <span style={{ 
            color: isInactiveAlternative || isInactive ? '#bfbfbf' : 'inherit',
            fontStyle: isInactiveAlternative || isInactive ? 'italic' : 'normal'
          }}>{node.title}</span>
          
          {/* 层级标签 */}
          <Tag color={getLevelColor(node.level)} size="small">
            {/* 层级标签已删除 */}
          </Tag>
          
          {/* 状态标签 */}
          {node.itemStatus === 'Deprecated' && (
            <Tag color="red" size="small">已弃用</Tag>
          )}
          {node.itemStatus === 'Inactive' && (
            <Tag color="orange" size="small">未激活</Tag>
          )}
          {node.itemStatus === 'Replaced' && (
            <Tag color="gray" size="small">已替换</Tag>
          )}
          {isAlternative && (
            <Tag color={isInactiveAlternative ? 'default' : 'cyan'} size="small">
              {isInactiveAlternative ? '未激活替代料' : '替代料'}
            </Tag>
          )}
          
          {/* 生命周期标签 */}
          {node.lifecycle === 'PhaseOut' && (
            <Tag color="orange" size="small">即将停产</Tag>
          )}
          {node.lifecycle === 'Obsolete' && (
            <Tag color="red" size="small">已停产</Tag>
          )}
          
          {/* 零件信息 - 仅L{BOM_LEVELS.L6.level}和L{BOM_LEVELS.L7.level}层显示 */}
          {node.level >= BOM_LEVELS.L6.level && (
            <>
              <Tag color="blue" size="small">{node.position}</Tag>
              {node.quantity > 0 && (
                <Tag color="green" size="small">Qty: {node.quantity}</Tag>
              )}
              {node.cost > 0 && (
                <Tag color="purple" size="small">¥{node.cost}</Tag>
              )}
              {node.supplier && (
                <Tag color="geekblue" size="small">{node.supplier}</Tag>
              )}
            </>
          )}
        </Space>
        
        {/* 操作按钮 - 仅L6主料显示 */}
        {node.level === BOM_LEVELS.L6.level && (
          <Space size="small" style={{ marginLeft: 'auto' }}>
            <Tooltip title="禁用">
              <Button 
                type="text" 
                size="small" 
                icon={<StopOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  message.info(`禁用零件: ${node.title}`);
                }}
                style={{ color: '#ff4d4f' }}
              >
                禁用
              </Button>
            </Tooltip>
            
            {isInactive && (
              <Tooltip title="启用">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<PlayCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    message.info(`启用零件: ${node.title}`);
                  }}
                  style={{ color: '#52c41a' }}
                >
                  启用
                </Button>
              </Tooltip>
            )}
            
            <Tooltip title="替代料（同组FFF零件）">
              <Button 
                type="text" 
                size="small" 
                icon={<BulbOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  // 直接在这里处理替代料显示
                  setSelectedNode(node);
                  
                  // 模拟生成替代料数据
                  const alternatives = [
                    {
                      id: `alt-${node.key}-1`,
                      title: `${node.title} 替代方案A`,
                      cost: (node.cost || 0) * 0.9,
                      supplier: '供应商A',
                      costReduction: 10,
                      lifecycle: 'Active'
                    },
                    {
                      id: `alt-${node.key}-2`,
                      title: `${node.title} 替代方案B`,
                      cost: (node.cost || 0) * 0.85,
                      supplier: '供应商B',
                      costReduction: 15,
                      lifecycle: 'Active'
                    },
                    {
                      id: `alt-${node.key}-3`,
                      title: `${node.title} 替代方案C`,
                      cost: (node.cost || 0) * 0.95,
                      supplier: '供应商C',
                      costReduction: 5,
                      lifecycle: 'PhaseOut'
                    }
                  ];
                  setLowCostAlternatives(alternatives);
                  setShowAlternativeDrawer(true);
                }}
              >
                替代料
              </Button>
            </Tooltip>
          </Space>
        )}
      </div>
    );
  }, [getLevelColor]);

  // 获取所有节点键
  // 转换树数据格式
  const convertToTreeData = useCallback((nodes) => {
    return nodes.map(node => ({
      key: node.key,
      title: renderNodeTitle(node),
      data: node,
      children: node.children && node.children.length > 0 ? convertToTreeData(node.children) : undefined
    }));
  }, [renderNodeTitle]);

  // 添加新零件
  const handleAddPart = (parentNode, partType) => {
    if (!parentNode || parentNode.level < BOM_LEVELS.L5.level) {
      message.warning(`只能在L${BOM_LEVELS.L5.level}及以上层级添加零件`);
      return;
    }
    
    // 生成新零件数据
    const newPart = {
      key: `part-${Date.now()}`,
      title: `新零件-${Date.now()}`,
      level: parentNode.level + 1,
      position: autoFillPosition ? generatePositionFromUtils(parentNode) : '',
      quantity: 1,
      unit: '个',
      cost: 0,
      supplier: '',
      variance: 0,
      lifecycle: 'Active',
      itemStatus: 'Active',
      nodeType: partType || '标准零件',
      parentId: parentNode.key,
      children: []
    };
    
    // 更新BOM结构
    const updatedBOM = addNodeToBOM(bomData, parentNode.key, newPart);
    setBomData(updatedBOM);
    
    // 重新计算统计信息
    const newStatistics = bomStatistics;
    setStatistics(newStatistics);
    
    // 检查缺失件
    checkMissingPartsWarningFromUtils(updatedBOM);
    
    message.success('零件添加成功');
  };

  // 编辑零件信息
  const handleEditPart = (node, field, value) => {
    const updatedBOM = updateNodeInBOM(bomData, node.key, field, value);
    setBomData(updatedBOM);
    
    // 重新计算统计信息
    const newStatistics = bomStatistics;
    setStatistics(newStatistics);
    
    // 检查缺失件
    checkMissingPartsWarningFromUtils(updatedBOM);
    
    // 如果是成本或数量变更，需要重新计算总成本
    if (field === 'cost' || field === 'quantity') {
      const newTotalCost = calculateInitialCost(updatedBOM);
      setTotalCost(newTotalCost);
    }
  };

  // 删除零件
  const handleDeletePart = (node) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除零件 ${node.title} 吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        const updatedBOM = removeNodeFromBOM(bomData, node.key);
        setBomData(updatedBOM);
        
        // 重新计算统计信息
        const newStatistics = bomStatistics;
        setStatistics(newStatistics);
        
        // 检查缺失件
        checkMissingPartsWarningFromUtils(updatedBOM);
        
        message.success('零件删除成功');
      }
    });
  };

  // 生成位号
  const generatePositionFromUtils = (parentNode) => {
    // 使用从aiUtils.js导入的generatePosition函数
    // 需要提供level、parentPosition、index和isAlternative参数
    const level = parentNode ? parentNode.level + 1 : 1;
    const parentPosition = parentNode ? parentNode.position : '';
    const index = 1; // 默认索引为1
    const isAlternative = false; // 默认不是替代料
    
    return generatePosition(level, parentPosition, index, isAlternative);
  };

  // 添加节点到BOM结构
  const addNodeToBOM = (nodes, parentKey, newNode) => {
    if (!nodes || !Array.isArray(nodes)) return nodes;
    
    return nodes.map(node => {
      if (node.key === parentKey) {
        // 找到父节点，添加新节点
        return {
          ...node,
          children: [...(node.children || []), newNode]
        };
      } else if (node.children && node.children.length > 0) {
        // 递归查找子节点
        return {
          ...node,
          children: addNodeToBOM(node.children, parentKey, newNode)
        };
      }
      return node;
    });
  };

  // 更新BOM结构中的节点
  const updateNodeInBOM = (nodes, nodeKey, field, value) => {
    if (!nodes || !Array.isArray(nodes)) return nodes;
    
    return nodes.map(node => {
      if (node.key === nodeKey) {
        // 找到目标节点，更新字段
        return {
          ...node,
          [field]: value
        };
      } else if (node.children && node.children.length > 0) {
        // 递归查找子节点
        return {
          ...node,
          children: updateNodeInBOM(node.children, nodeKey, field, value)
        };
      }
      return node;
    });
  };

  // 从BOM结构中删除节点
  const removeNodeFromBOM = (nodes, nodeKey) => {
    if (!nodes || !Array.isArray(nodes)) return nodes;
    
    return nodes.reduce((acc, node) => {
      if (node.key === nodeKey) {
        // 找到目标节点，直接跳过（删除）
        return acc;
      } else if (node.children && node.children.length > 0) {
        // 递归查找子节点
        return [
          ...acc,
          {
            ...node,
            children: removeNodeFromBOM(node.children, nodeKey)
          }
        ];
      }
      return [...acc, node];
    }, []);
  };

  // 批量操作零件
  const handleBatchOperation = (operation, selectedKeys) => {
    if (!selectedKeys || selectedKeys.length === 0) {
      message.warning('请选择要操作的零件');
      return;
    }
    
    let updatedBOM = [...bomData];
    
    switch (operation) {
      case 'activate':
        selectedKeys.forEach(key => {
          updatedBOM = updateNodeInBOM(updatedBOM, key, 'itemStatus', 'Active');
        });
        message.success(`已激活 ${selectedKeys.length} 个零件`);
        break;
        
      case 'deprecate':
        selectedKeys.forEach(key => {
          updatedBOM = updateNodeInBOM(updatedBOM, key, 'itemStatus', 'Deprecated');
        });
        message.success(`已弃用 ${selectedKeys.length} 个零件`);
        break;
        
      case 'delete':
        Modal.confirm({
          title: '批量删除确认',
          content: `确定要删除选中的 ${selectedKeys.length} 个零件吗？此操作不可恢复。`,
          okText: '确认',
          cancelText: '取消',
          onOk: () => {
            selectedKeys.forEach(key => {
              updatedBOM = removeNodeFromBOM(updatedBOM, key);
            });
            setBomData(updatedBOM);
            const newStatistics = bomStatistics;
            setStatistics(newStatistics);
            checkMissingPartsWarningFromUtils(updatedBOM);
            message.success(`已删除 ${selectedKeys.length} 个零件`);
          }
        });
        return;
        
      default:
        message.warning('未知操作');
        return;
    }
    
    setBomData(updatedBOM);
    const newStatistics = bomStatistics;
    setStatistics(newStatistics);
    checkMissingPartsWarningFromUtils(updatedBOM);
  };

  // 导出BOM数据
  const handleExportBOM = () => {
    if (!bomData || bomData.length === 0) {
      message.warning('没有可导出的BOM数据');
      return;
    }
    
    // 获取零件列表
    const partsList = getPartsList(bomData);
    
    // 转换为CSV格式
    const csvContent = [
      ['位号', '零件名称', '用量', '单位', '成本', '供应商', '差异', '生命周期', '状态'].join(','),
      ...partsList.map(part => [
        part.position,
        part.partName,
        part.quantity,
        part.unit,
        part.cost,
        part.supplier,
        part.variance,
        part.lifecycle,
        part.itemStatus
      ].join(','))
    ].join('\n');
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BOM_${selectedPlatform?.name}_${selectedVersion}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('BOM数据导出成功');
  };

  // 当有初始平台信息或产品型号时，自动加载对应模板
  useEffect(() => {
    // 如果已经自动加载过，则不再重复加载
    if (autoLoaded) return;
    
    let targetPlatform = null;
    let targetVersion = '';
    
    // 优先使用产品型号来确定平台
    if (productModel) {
      console.log('根据产品型号自动加载平台模板:', productModel);
      // 根据产品型号关键词确定平台
      if (productModel.includes('X1') || productModel.includes('T') || productModel.includes('P')) {
        targetPlatform = productPlatforms.find(p => p.id === 'laptop');
      } else if (productModel.includes('ThinkStation')) {
        targetPlatform = productPlatforms.find(p => p.id === 'desktop');
      } else if (productModel.includes('ThinkSystem')) {
        targetPlatform = productPlatforms.find(p => p.id === 'server');
      } else if (productModel.includes('X12') || productModel.includes('X13')) {
        targetPlatform = productPlatforms.find(p => p.id === 'mobile');
      } else if (productModel.includes('ThinkEdge')) {
        targetPlatform = productPlatforms.find(p => p.id === 'embedded');
      }
      
      // 根据产品型号确定版本
      if (targetPlatform) {
        if (productModel.includes('X1 Carbon')) {
          targetVersion = 'X1 Carbon';
        } else if (productModel.includes('T14')) {
          targetVersion = 'T14';
        } else if (productModel.includes('P1')) {
          targetVersion = 'P1';
        } else {
          // 默认选择第一个版本
          targetVersion = targetPlatform.versions[0];
        }
      }
    } else if (initialPlatform) {
      // 如果没有产品型号，但有初始平台信息
      console.log('自动加载平台模板:', initialPlatform);
      targetPlatform = productPlatforms.find(p => p.id === initialPlatform);
      if (targetPlatform) {
        targetVersion = targetPlatform.versions[0];
      }
    }
    
    if (targetPlatform) {
      setSelectedPlatform(targetPlatform);
      setSelectedVersion(targetVersion);
      setAutoLoaded(true); // 标记已自动加载
      
      // 获取模板ID并加载模板
      const templateId = platformTemplateMap[targetPlatform.id];
      if (templateId) {
        setLoading(true);
        templateService.getTemplate(templateId)
          .then(template => {
            setTemplateData(template);
            
            // 自动展开所有节点
            const allKeys = getAllNodeKeys(template);
            setExpandedKeys(allKeys);
            
            const stats = calculateStatistics([template]); // 计算统计信息
            setStatistics(stats);
            return templateService.getTemplateHistory(templateId);
          })
          .then(history => {
            setTemplateHistory(history);
            if (history.length > 0) {
              setSelectedHistory(history[history.length - 1]);
            }
            // 自动应用模板
            handleApplyTemplate(true);
          })
          .catch(error => {
            console.error('自动加载模板失败:', error);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [initialPlatform, productModel, autoLoaded]);
  
  // 处理平台选择
  const handlePlatformChange = async (platformId) => {
    const platform = productPlatforms.find(p => p.id === platformId);
    setSelectedPlatform(platform);
    
    // 重置版本选择
    const defaultVersion = platform?.versions[0] || '';
    setSelectedVersion(defaultVersion);
    setTemplateData(null);
    setTemplateHistory([]);
    
    // 自动加载默认版本的模板数据
    if (platform && defaultVersion) {
      await handleVersionChange(defaultVersion);
    }
  };
  
  // 处理版本选择
  const handleVersionChange = async (version) => {
    setSelectedVersion(version);
    
    if (!selectedPlatform) return;
    
    // 获取模板ID
    const templateId = platformTemplateMap[selectedPlatform.id];
    
    if (!templateId) {
      console.error('找不到对应的模板');
      return;
    }
    
    setLoading(true);
    try {
      // 加载模板数据
      const template = await templateService.getTemplate(templateId);
      setTemplateData(template);
      
      // 自动展开所有节点
      if (template) {
        const allKeys = getAllNodeKeys(template);
        setExpandedKeys(allKeys);
        
        // 计算统计信息
        const stats = calculateStatistics([template]);
        setStatistics(stats);
      }
      
      // 加载模板历史记录
      const history = await templateService.getTemplateHistory(templateId);
      setTemplateHistory(history);
      
      // 默认选择最新版本
      if (history.length > 0) {
        setSelectedHistory(history[history.length - 1]);
      }
    } catch (error) {
      console.error('加载模板失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 应用模板
  const handleApplyTemplate = (isAutoLoad = false) => {
    if (!templateData) return;
    
    // 如果不是自动加载，则显示确认对话框
    if (!isAutoLoad) {
      Modal.confirm({
        title: '确认应用模板',
        content: `确定要应用 ${selectedPlatform?.name} - ${selectedVersion} 的模板吗？这将替换当前的BOM结构。`,
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
          applyTemplateData();
        }
      });
    } else {
      // 自动加载模式下直接应用模板
      applyTemplateData();
    }
    
    function applyTemplateData() {
      console.log('应用模板:', templateData, isAutoLoad ? '(自动加载)' : '(手动应用)');
      
      // 标记模板为只读状态
      const readOnlyTemplate = JSON.parse(JSON.stringify(templateData));
      markAsReadOnly(readOnlyTemplate);
      
      // 计算统计信息
      const stats = calculateStatistics([readOnlyTemplate]);
      setStatistics(stats);
      
      // 回调函数通知父组件
      if (onStructureLoad) {
        console.log('调用onStructureLoad回调');
        // 如果是自动加载，使用setTimeout确保在下一个事件循环中执行
        if (isAutoLoad) {
          setTimeout(() => {
            onStructureLoad(readOnlyTemplate);
          }, 0);
        } else {
          onStructureLoad(readOnlyTemplate);
        }
      } else {
        console.error('onStructureLoad回调未定义');
      }
    }
  };
  
  // 递归标记节点为只读
  const markAsReadOnly = (nodes) => {
    if (!nodes || !Array.isArray(nodes)) return;
    
    nodes.forEach(node => {
      node.readOnly = true;
      
      // 标记层级
      const levelInfo = Object.values(BOM_LEVELS).find(l => l.level === node.level);
      if (levelInfo) {
        node.levelName = levelInfo.name;
      }
      
      if (node.children) {
        markAsReadOnly(node.children);
      }
    });
  };

  // 使用useMemo优化计算密集型操作
  const partsList = useMemo(() => {
    return getPartsList(bomData);
  }, [bomData]);
  
  const bomStatistics = useMemo(() => {
    return calculateStatistics(bomData);
  }, [bomData]);
  
  const bomTotalCost = useMemo(() => {
    return calculatePartsListCost(partsList);
  }, [partsList]);
  
  const allNodeKeys = useMemo(() => {
    return getAllNodeKeys(bomData);
  }, [bomData]);
  
  const treeData = useMemo(() => {
    return convertToTreeData(bomData);
  }, [bomData]);

  // 表格列定义
  const partColumns = [
    {
      title: '位号',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      render: (text) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{text}</span>
    },
    {
      title: '零件名称',
      dataIndex: 'partName',
      key: 'partName',
      width: 200,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.level === BOM_LEVELS.L6.level ? '主料' : '替代料'} | {record.nodeType}
          </div>
        </div>
      )
    },
    {
      title: '用量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (text, record) => {
        const isDeprecated = record.itemStatus === 'Deprecated';
        const isInactive = record.itemStatus === 'Inactive';
        const isAlternative = record.level === BOM_LEVELS.L7.level;
        
        return (
          <InputNumber
            min={isDeprecated || isInactive ? 0 : 0.001}
            max={999}
            step={1}
            precision={0}
            value={text || 0}
            disabled={true} // 模板模式下禁用编辑
            style={{ 
              width: '80px',
              backgroundColor: text <= 0 ? '#fff2f0' : 'transparent',
              borderColor: text <= 0 ? '#ff4d4f' : '#d9d9d9'
            }}
            size="small"
          />
        );
      }
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      render: (text) => (
        <Select
          value={text || '个'}
          disabled={true} // 模板模式下禁用编辑
          size="small"
          style={{ width: '70px' }}
          options={[
            { value: '个', label: '个' },
            { value: '条', label: '条' },
            { value: '块', label: '块' },
            { value: '套', label: '套' },
            { value: '台', label: '台' },
            { value: '米', label: '米' },
            { value: '克', label: '克' }
          ]}
        />
      )
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (text) => <span style={{ color: '#cf1322', fontWeight: 'bold' }}>¥{text || 0}</span>
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 150,
      render: (text) => <span>{text || '-'}</span>
    },
    {
      title: '差异',
      dataIndex: 'variance',
      key: 'variance',
      width: 80,
      render: (text) => (
        <span style={{ 
          color: text > 0 ? '#cf1322' : text < 0 ? '#52c41a' : '#666',
          fontWeight: 'bold'
        }}>
          {text > 0 ? '+' : ''}{text || 0}%
        </span>
      )
    },
    {
      title: '生命周期',
      dataIndex: 'lifecycle',
      key: 'lifecycle',
      width: 100,
      render: (text) => {
        const colors = {
          'Active': 'green',
          'PhaseOut': 'orange',
          'Obsolete': 'red'
        };
        return <Tag color={colors[text] || 'default'}>{text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'itemStatus',
      key: 'itemStatus',
      width: 80,
      render: (text) => {
        const colors = {
          'Active': 'green',
          'Deprecated': 'red',
          'Inactive': 'orange',
          'Replaced': 'gray'
        };
        return <Tag color={colors[text] || 'default'}>{text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => {
        const isAlternative = record.level === BOM_LEVELS.L7.level;
        const isL6 = record.level === BOM_LEVELS.L6.level;
        
        return (
          <Space size="small">
            {/* L7替代料：显示查看按钮 */}
            {isAlternative && (
              <Button 
                type="link" 
                size="small" 
                icon={<InfoCircleOutlined />}
                onClick={() => {
                  message.info(`查看替代料: ${record.partName}`);
                }}
              >
                查看
              </Button>
            )}
            
            {/* L6主料：查看详情按钮 */}
            {!isAlternative && (
              <Button 
                type="link" 
                size="small" 
                icon={<InfoCircleOutlined />}
                onClick={() => {
                  message.info(`查看主料: ${record.partName}`);
                }}
              >
                详情
              </Button>
            )}
          </Space>
        );
      }
    }
  ];

  // 处理节点选择
  const handleSelect = (selectedKeys, { node, selected }) => {
    setSelectedKeys(selectedKeys);
    if (selected) {
      setSelectedNode(node.data);
    }
  };

  // 处理节点展开
  const handleExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
  };

  // 显示替代料
  const handleShowAlternatives = (node) => {
    setSelectedNode(node);
    
    // 模拟生成替代料数据
    const alternatives = [
      {
        id: `alt-${node.key}-1`,
        title: `${node.title} 替代方案A`,
        cost: (node.cost || 0) * 0.9,
        supplier: '供应商A',
        costReduction: 10,
        lifecycle: 'Active'
      },
      {
        id: `alt-${node.key}-2`,
        title: `${node.title} 替代方案B`,
        cost: (node.cost || 0) * 0.85,
        supplier: '供应商B',
        costReduction: 15,
        lifecycle: 'Active'
      },
      {
        id: `alt-${node.key}-3`,
        title: `${node.title} 替代方案C`,
        cost: (node.cost || 0) * 0.95,
        supplier: '供应商C',
        costReduction: 5,
        lifecycle: 'PhaseOut'
      }
    ];
    
    setLowCostAlternatives(alternatives);
    setShowAlternativeDrawer(true);
  };

  // 显示AI辅助抽屉
  const handleShowAIDrawer = () => {
    setShowAIDrawer(true);
  };
  
  // 渲染BOM结构视图
  const renderBOMStructureView = () => {
    // 获取当前选中平台的模板数据
    const currentTemplate = platformTemplates.find(t => t.platform === selectedPlatform && t.version === selectedVersion);
    const bomTreeData = currentTemplate ? currentTemplate.template : [];
    
    // 获取零件列表
    const partsList = getPartsList(bomTreeData);
    
    // 获取缺失件列表
    const missingParts = checkMissingPartsFromBomUtils(bomTreeData) || [];
    
    return (
      <Card
        title="BOM结构模板"
        extra={
          <Space>
            <Space.Compact>
              <Button 
                type={viewMode === 'tree' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('tree')}
              >
                树形视图
              </Button>
              <Button 
                type={viewMode === 'table' ? 'primary' : 'default'}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('table')}
              >
                表格视图
              </Button>
            </Space.Compact>
              
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                message.info('重新加载模板');
              }}
            >
              重新加载
            </Button>
          </Space>
        }
        style={{ marginTop: '16px' }}
      >
        
        
        {/* 缺失件预警 */}
        {missingParts.length > 0 && (
          <Alert
            message="缺失件预警"
            description={`发现 ${missingParts.length} 个缺失件，请及时补充`}
            type="warning"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
          />
        )}
        
        {/* BOM结构视图 */}
        {viewMode === 'tree' ? (
          <Tree
            showLine
            treeData={convertToTreeData(bomTreeData)}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            onExpand={handleExpand}
            onSelect={handleSelect}
            height={600}
          />
        ) : (
          <Table
            columns={partColumns}
            dataSource={partsList}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            scroll={{ x: 1200, y: 500 }}
            summary={() => {
              const totalCost = calculatePartsListCost(partsList);
              const activeParts = partsList.filter(part => part.itemStatus === 'Active').length;
              const deprecatedParts = partsList.filter(part => part.itemStatus === 'Deprecated').length;
              
              return (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <strong>汇总</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <strong>激活: {activeParts}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}></Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <strong>¥{totalCost.toFixed(2)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5}>
                      <strong>弃用: {deprecatedParts}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6}></Table.Summary.Cell>
                    <Table.Summary.Cell index={7}></Table.Summary.Cell>
                    <Table.Summary.Cell index={8}></Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        )}
        
        {/* AI辅助悬浮按钮 */}
        <FloatButton
          icon={<BulbOutlined />}
          type="primary"
          style={{ right: 24 }}
          tooltip="AI辅助"
          onClick={handleShowAIDrawer}
        />
        
        {/* 替代料抽屉 */}
        <Drawer
          title={`替代料推荐 - ${selectedNode?.title || ''}`}
          placement="right"
          onClose={() => setShowAlternativeDrawer(false)}
          open={showAlternativeDrawer}
          width={600}
        >
          <List
            dataSource={lowCostAlternatives}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => {
                      message.info(`应用替代料: ${item.title}`);
                      setShowAlternativeDrawer(false);
                    }}
                  >
                    应用
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{item.title}</span>
                      <Tag color="green">成本降幅: {item.costReduction}%</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <div>供应商: {item.supplier}</div>
                      <div>成本: ¥{item.cost}</div>
                      <div>生命周期: <Tag color={item.lifecycle === 'Active' ? 'green' : 'orange'}>{item.lifecycle}</Tag></div>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Drawer>
        
        {/* AI辅助抽屉 */}
        <Drawer
          title="AI辅助"
          placement="right"
          onClose={() => setShowAIDrawer(false)}
          open={showAIDrawer}
          width={600}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* 实时校验结果 */}
            <Card title="实时校验结果" size="small">
              <List
                dataSource={[
                  { id: 1, message: 'BOM结构完整，无缺失件', type: 'success' },
                  { id: 2, message: '成本在预算范围内', type: 'success' },
                  { id: 3, message: '发现3个即将停产的零件', type: 'warning' },
                  { id: 4, message: '建议更新5个零件的供应商', type: 'info' }
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      {item.type === 'success' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                      {item.type === 'warning' && <ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                      {item.type === 'info' && <InfoCircleOutlined style={{ color: '#1890ff' }} />}
                      <span>{item.message}</span>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
            
            {/* 缺失件预警 */}
            <Card title="缺失件预警" size="small">
              <List
                dataSource={missingParts}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                      <span>{item.position} - {item.partName}</span>
                      <Tag color="orange">缺失</Tag>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
            
            {/* 自动补全位号 */}
            <Card title="自动补全位号" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Space>
                    <Switch 
                      checked={autoFillPosition}
                      onChange={setAutoFillPosition}
                    />
                    <span>启用自动补全位号</span>
                  </Space>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  启用后，系统将自动为新增零件生成符合规范的位号
                </div>
              </Space>
            </Card>
            
            {/* 低成本替代建议 */}
            <Card title="低成本替代建议" size="small">
              <List
                dataSource={lowCostAlternatives}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => {
                          message.info(`应用替代料: ${item.title}`);
                        }}
                      >
                        应用
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{item.title}</span>
                          <Tag color="green">成本降幅: {item.costReduction}%</Tag>
                        </Space>
                      }
                      description={`供应商: ${item.supplier} | 成本: ¥${item.cost}`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        </Drawer>
      </Card>
    );
  };

  // 渲染平台卡片
  const renderPlatformCards = () => {
    // 如果已经自动加载过模板，则不显示平台选择卡片
    if (autoLoaded) return null;
    
    return (
      <Row gutter={[16, 16]}>
        {productPlatforms.map(platform => (
          <Col xs={24} sm={12} md={8} key={platform.id}>
            <Card
              hoverable
              className={`platform-card ${selectedPlatform?.id === platform.id ? 'selected' : ''}`}
              onClick={() => handlePlatformChange(platform.id)}
              cover={
                <div className="platform-card-cover">
                  <img 
                    src={platform.image} 
                    alt={platform.name}
                    onError={(e) => {
                      e.target.src = 'https://picsum.photos/seed/' + platform.id + '/300/200.jpg';
                    }}
                  />
                </div>
              }
              actions={[
                <Space>
                  <TeamOutlined key="platform" />
                  <span>{platform.versions.length} 个版本</span>
                </Space>
              ]}
            >
              <Card.Meta
                title={platform.name}
                description={platform.description}
              />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };
  
  // 渲染模板树
  const renderTemplateTree = () => {
    if (loading) {
      return <Spin size="large" />;
    }
    
    if (!templateData) {
      return (
        <Empty 
          description="请选择产品平台和版本" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    
    // 递归生成树节点数据
    const generateTreeData = (nodes) => {
      if (!nodes || !Array.isArray(nodes)) return [];
      
      return nodes.map(node => {
        const levelInfo = Object.values(BOM_LEVELS).find(l => l.level === node.level);
        
        const treeNode = {
          title: (
            <div className="tree-node-title">
              <Space>
                {levelInfo?.isParent ? <FolderOutlined /> : <FileOutlined />}
                <span>{node.title}</span>
                {node.level >= BOM_LEVELS.L6.level && (
                  <Tag color={node.level === BOM_LEVELS.L6.level ? 'blue' : 'green'}>
                    {levelInfo?.name}
                  </Tag>
                )}
              </Space>
              
              {/* L{BOM_LEVELS.L6.level}/L{BOM_LEVELS.L7.level}层零件信息 */}
              {node.isPart && (
                <div className="part-info" style={{ marginLeft: 20, fontSize: 12, color: '#666' }}>
                  <span>位号: {node.position || '-'}</span>
                  {node.quantity && <span style={{ marginLeft: 8 }}>用量: {node.quantity}</span>}
                  {node.cost && <span style={{ marginLeft: 8 }}>成本: ¥{node.cost}</span>}
                  {node.supplier && <span style={{ marginLeft: 8 }}>供应商: {node.supplier}</span>}
                </div>
              )}
            </div>
          ),
          key: node.key,
          children: node.children ? generateTreeData(node.children) : undefined
        };
        
        return treeNode;
      });
    };
    
    const treeData = generateTreeData([templateData]);
    
    return (
      <div>
        <div style={{ marginBottom: 8 }}>
          <Alert
            message="模板预览"
            description="以下是基于所选产品平台和版本的标准BOM结构模板。模板为只读模式，应用后可以进行修改。"
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            size="small"
            style={{ fontSize: '12px' }}
          />
        </div>
        
        <DirectoryTree
          defaultExpandAll
          treeData={treeData}
          style={{ background: '#f5f7fa', borderRadius: 4, padding: 4, fontSize: '12px' }}
        />
        
        <Divider style={{ margin: '8px 0' }} />
        
        <div style={{ textAlign: 'center' }}>
          {autoLoaded ? (
            <div style={{ padding: '8px 0' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14, marginRight: 6 }} />
              <span style={{ color: '#52c41a', fontSize: '12px' }}>模板已自动应用</span>
            </div>
          ) : (
            <Button 
              type="primary" 
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={handleApplyTemplate}
            >
              应用模板
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  // 渲染版本选择
  const renderVersionSelector = () => {
    if (!selectedPlatform) return null;
    
    return (
      <div style={{ marginBottom: 8 }}>
        <Title level={5} style={{ fontSize: '14px', marginBottom: 8 }}>选择版本</Title>
        {autoLoaded ? (
          <div style={{ padding: '6px 8px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <Space size="small">
              <span style={{ fontSize: '12px' }}>{selectedVersion}</span>
              <Tag color="blue" style={{ fontSize: '10px', padding: '1px 4px' }}>已自动匹配</Tag>
            </Space>
          </div>
        ) : (
          <Select
            style={{ width: '100%' }}
            value={selectedVersion}
            onChange={handleVersionChange}
            placeholder="请选择版本"
            size="small"
          >
            {selectedPlatform.versions.map(version => (
              <Option key={version} value={version}>
                {version}
              </Option>
            ))}
          </Select>
        )}
      </div>
    );
  };
  
  // 渲染模板历史
  const renderTemplateHistory = () => {
    if (templateHistory.length === 0) return null;
    
    return (
      <Card title="模板历史记录" size="small" style={{ marginTop: 8 }} styles={{ header: { fontSize: '14px', padding: '8px 12px' }, body: { padding: '8px' } }}>
        <List
          size="small"
          dataSource={templateHistory}
          renderItem={item => (
            <List.Item
              className={selectedHistory?.id === item.id ? 'selected-history' : ''}
              onClick={() => setSelectedHistory(item)}
              style={{ cursor: 'pointer', padding: '6px 8px' }}
            >
              <List.Item.Meta
                title={
                  <Space size="small">
                    <span style={{ fontSize: '12px' }}>{item.version}</span>
                    <Tag color="blue" style={{ fontSize: '10px', padding: '1px 4px' }}>{item.date}</Tag>
                  </Space>
                }
                description={
                  <Space size="small" direction="vertical">
                    <span style={{ fontSize: '11px' }}>修改人: {item.modifier}</span>
                    <span style={{ fontSize: '11px' }}>{item.changes}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };
  
  return (
    <div className="platform-template-tab" style={{ padding: 12 }}>
      
      
      {/* 平台选择 */}
      {!selectedPlatform ? (
        <div>
          <Title level={4} style={{ fontSize: '14px', marginBottom: 8 }}>选择产品平台</Title>
          {renderPlatformCards()}
        </div>
      ) : (
        <Row gutter={12}>
          <Col span={5}>
            {/* 版本选择 */}
            {renderVersionSelector()}
            
            {/* 模板历史记录 */}
            {renderTemplateHistory()}
          </Col>
          
          <Col span={19}>
            {/* BOM结构预览 */}
            {templateData ? (
              <>
                {/* BOM树结构显示 - 从BOMStructureNew.jsx复制 */}
                <Card style={{ marginBottom: '16px' }} styles={{ body: { padding: '8px' } }}>
                  <Tree
                    showLine
                    treeData={convertToTreeData([templateData])}
                    expandedKeys={expandedKeys}
                    onExpand={(keys) => setExpandedKeys(keys)}
                    style={{ minHeight: '300px' }}
                  />
                </Card>
                
                
              </>
            ) : (
              <Card size="small" styles={{ body: { padding: '12px' } }}>
                <Empty 
                  description="请选择产品平台和版本" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  styles={{ image: { height: 60, width: 60 } }}
                />
              </Card>
            )}
          </Col>
        </Row>
      )}
      
      {/* BOM结构视图 */}
      {selectedPlatform && selectedVersion && renderBOMStructureView()}
      
      <style>{`
        .platform-card {
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .platform-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .platform-card.selected {
          border-color: #1890ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
        
        .platform-card-cover {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background-color: #f5f5f5;
        }
        
        .platform-card-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .tree-node-title {
          width: 100%;
          font-size: 12px;
        }
        
        .selected-history {
          background-color: #e6f7ff;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default PlatformTemplateTab;