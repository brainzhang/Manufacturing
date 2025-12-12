import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Table, 
  Tree, 
  Tag, 
  Space, 
  Button, 
  Select,
  Input,
  Row,
  Col,
  Divider,
  Typography,
  Empty,
  Statistic,
  Modal,
  Upload,
  message,
  Typography as AntTypography,
  Form,
  Steps,
  Progress,
  Alert,
  Spin,
  Result,
  Descriptions
} from 'antd';
import styles from './BOMGenerator.module.css';
import {
  DownOutlined,
  SearchOutlined,
  ExportOutlined,
  ImportOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  StopOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  RocketOutlined,
  FileTextOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import { bom7LayerTemplate } from './bom7LayerTemplate';
import * as XLSX from 'xlsx';
import CostComplianceStep from './CostComplianceStep';
import PublishCheckStep from './PublishCheckStep';
import ReleaseToSAPStep from './ReleaseToSAPStep';

const { Title, Text } = Typography;
const { Title: AntTitle, Paragraph } = AntTypography;
const { Option } = Select;
const { Search } = Input;

// 7层BOM结构常量
const BOM_LEVELS = {
  L1: { name: '整机', level: 1, color: 'red' },
  L2: { name: '模块', level: 2, color: 'orange' },
  L3: { name: '子模块', level: 3, color: 'gold' },
  L4: { name: '族', level: 4, color: 'green' },
  L5: { name: '组', level: 5, color: 'blue' },
  L6: { name: '主料', level: 6, color: 'purple' },
  L7: { name: '替代料', level: 7, color: 'cyan' }
};

// 将树形数据转换为表格数据
const flattenTreeData = (data, parentKey = '', level = 0, parentStatus = '激活') => {
  let result = [];
  
  data.forEach(item => {
    const key = parentKey ? `${parentKey}-${item.key}` : item.key;
    const { children, ...rest } = item;
    
    // 为L7层级添加parentStatus
    const itemWithStatus = level === 6 ? { ...rest, parentStatus } : rest;
    
    // 为所有层级添加默认状态
    let itemWithDefaultStatus = {
      ...itemWithStatus,
      status: itemWithStatus.status || '激活'
    };
    
    // L7层级默认状态为未激活，使其初始化时完全置灰带删除线
    if (level === 6) {
      itemWithDefaultStatus = {
        ...itemWithDefaultStatus,
        status: '未激活'
      };
    }
    
    result.push({
      ...itemWithDefaultStatus,
      key,
      level,
      hasChildren: children && children.length > 0
    });
    
    if (children && children.length > 0) {
      // 传递当前项的状态给子项
      const currentStatus = itemWithDefaultStatus.status || '激活';
      result = result.concat(flattenTreeData(children, key, level + 1, currentStatus));
    }
  });
  
  return result;
};

// 表格列定义
const getTableColumns = (onEditL6Item, onToggleL6Status, onReplaceL6WithL7, onDeleteL7Item) => [
  {
    title: '层级',
    dataIndex: 'level',
    key: 'level',
    width: 80,
    render: (level) => {
      const levelInfo = Object.values(BOM_LEVELS).find(l => l.level === level + 1);
      return (
        <Tag color={levelInfo?.color || 'default'}>
          L{level + 1}
        </Tag>
      );
    }
  },
  {
    title: '层级名称',
    dataIndex: 'title',
    key: 'title',
    width: 200,
    ellipsis: true,
  },
  {
    title: '物料编码',
    dataIndex: 'partId',
    key: 'partId',
    width: 150,
    ellipsis: true,
    render: (text) => text || '-'
  },
  {
    title: '位号',
    dataIndex: 'position',
    key: 'position',
    width: 120,
    render: (text) => text || '-'
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 80,
    align: 'right',
    render: (text) => text || '-'
  },
  {
    title: '单位',
    dataIndex: 'unit',
    key: 'unit',
    width: 80,
    render: (text) => text || '-'
  },
  {
    title: '成本',
    dataIndex: 'cost',
    key: 'cost',
    width: 100,
    align: 'right',
    render: (text) => text ? `¥${text.toLocaleString()}` : '-'
  },
  {
    title: '供应商',
    dataIndex: 'supplier',
    key: 'supplier',
    width: 150,
    ellipsis: true,
    render: (text) => text || '-'
  },
  {
    title: '生命周期',
    dataIndex: 'lifecycle',
    key: 'lifecycle',
    width: 100,
    render: (text) => {
      if (!text) return '-';
      // 将值映射为中文显示
      const displayText = text === '量产' ? '量产' : 
                         text === '停产' ? '停产' : 
                         text === '研发' ? '研发' : 
                         text === '逐步淘汰' ? '逐步淘汰' : 
                         '-'; // 未知值显示为横线
      const color = text === '量产' ? 'green' : 
                   text === '停产' ? 'red' : 
                   text === '逐步淘汰' ? 'orange' : 
                   text === '研发' ? 'blue' : 'default';
      return <Tag color={color}>{displayText}</Tag>;
    }
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status) => {
      const isActive = status !== '未激活';
      return <Tag color={isActive ? 'green' : 'red'}>{isActive ? '激活' : '未激活'}</Tag>;
    }
  },
  {
    title: '类型',
    key: 'nodeType',
    width: 100,
    render: (_, record) => {
      if (record.level === 5) return <Tag color="purple">主料</Tag>; // level 5对应L6
      if (record.level === 6) return <Tag color="cyan">替代料</Tag>; // level 6对应L7
      return null; // L1-L5不显示类型
    }
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    render: (_, record) => {
      // L1-L5层级不显示操作按钮
      if (record.level < 5) return null;
      
      // L6层级 (level 5)
      if (record.level === 5) {
        const isActive = record.status !== '未激活';
        return (
          <Space size="small">
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => onEditL6Item && onEditL6Item(record)}
            />
            <Button 
              type="link" 
              size="small" 
              icon={isActive ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={() => onToggleL6Status && onToggleL6Status(record)}
            >
              {isActive ? '弃用' : '启用'}
            </Button>
          </Space>
        );
      }
      
      // L7层级 (level 6)
      if (record.level === 6) {
        // L7层级在状态为未激活且父级为激活时操作不可触发
        // 当L6弃用时，L7状态变为激活，此时替代按钮应该可用
        const isDisabled = record.status === '未激活' && record.parentStatus === '激活';
        
        return (
          <Space size="small">
            <Button 
              type="link" 
              size="small" 
              icon={<SwapOutlined />}
              onClick={() => onReplaceL6WithL7 && onReplaceL6WithL7(record)}
              disabled={isDisabled}
            >
              替代
            </Button>
          </Space>
        );
      }
      
      return null;
    }
  }
];

// 树形组件渲染
const renderTreeNodes = (data) => {
  return data.map(item => {
    const levelInfo = Object.values(BOM_LEVELS).find(l => l.level === item.level);
    const tagColor = levelInfo?.color || 'default';
    
    // 生命周期中文映射，只有L6和L7层级显示生命周期标签
    const getLifecycleText = (lifecycle, level) => {
      // L5及以下层级不显示生命周期标签
      if (level < 5) return null;
      
      if (!lifecycle) return null;
      const displayText = lifecycle === '量产' ? '量产' : 
                         lifecycle === '停产' ? '停产' : 
                         lifecycle === '研发' ? '研发' : 
                         lifecycle === '逐步淘汰' ? '逐步淘汰' : 
                         null;
      const color = lifecycle === '量产' ? 'green' : 
                   lifecycle === '停产' ? 'red' : 
                   lifecycle === '逐步淘汰' ? 'orange' : 
                   lifecycle === '研发' ? 'blue' : 'default';
      return displayText ? <Tag color={color}>{displayText}</Tag> : null;
    };
    
    // 状态标签映射，只有L6和L7组件显示状态标签
    const getStatusText = (status, level) => {
      if (level === 5) { // L6组件
        const isActive = status !== '未激活';
        return <Tag color={isActive ? 'green' : 'red'}>{isActive ? '激活' : '未激活'}</Tag>;
      }
      // L5及以下层级不显示状态标签
      return null;
    };
    
    // 根据状态添加样式
    const nodeStyle = {};
    // 规则3：L6弃用时置灰带删除线
    if (item.level === 5 && item.status === '未激活') {
      nodeStyle.color = '#999';
      nodeStyle.textDecoration = 'line-through';
    }
    // L7状态为未激活且父级状态为激活时置灰带删除线
    // 当L7状态为激活时不被置灰不带删除线
    if (item.level === 6 && item.status === '未激活' && item.parentStatus === '激活') {
      nodeStyle.color = '#999';
      nodeStyle.textDecoration = 'line-through';
    }
    
    return (
      <Tree.TreeNode
        key={item.key}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...nodeStyle }}>
            {/* L5层级不显示任何标签 */}
            {item.level === 4 ? (
              <>
                <span>L{item.level}</span>
                <span>{item.title}</span>
                {item.partId && <Text type="secondary">({item.partId})</Text>}
              </>
            ) : (
              <>
                <Tag color={tagColor}>L{item.level}</Tag>
                <span>{item.title}</span>
                {item.partId && <Text type="secondary">({item.partId})</Text>}
                {item.isAlternative && <Tag color="cyan">替代料</Tag>}
                {getLifecycleText(item.lifecycle, item.level)}
                {getStatusText(item.status, item.level)}
              </>
            )}
          </div>
        }
        dataRef={item}
      >
        {item.children && item.children.length > 0 ? renderTreeNodes(item.children) : null}
      </Tree.TreeNode>
    );
  });
};

const BOMGenerator = () => {
  const [selectedProduct, setSelectedProduct] = useState('ThinkPad X1 Carbon Gen12');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'tree'
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [bomData, setBomData] = useState(null);
  
  // 新增步骤相关状态
  const [currentStep, setCurrentStep] = useState(0); // 0: BOM生成, 1: 成本与合规, 2: 发布前检查, 3: 一键同步SAP
  const [costSummary, setCostSummary] = useState(null);
  const [complianceResults, setComplianceResults] = useState(null);
  const [publishStatus, setPublishStatus] = useState(null);
  const [sapReleaseResult, setSapReleaseResult] = useState(null);
  
  // 创建组件引用
  const costComplianceRef = useRef(null);
  
  // 初始化bomData
  useEffect(() => {
    if (!bomData && selectedProduct && bom7LayerTemplate[selectedProduct]) {
      setBomData(bom7LayerTemplate[selectedProduct]);
      // 重置步骤到第一步
      setCurrentStep(0);
      setCostSummary(null);
      setComplianceResults(null);
      setPublishStatus(null);
      setSapReleaseResult(null);
    }
  }, [selectedProduct]);
  
  // 当进入成本与合规步骤时，计算成本和合规性
  useEffect(() => {
    if (currentStep === 1 && bomData) {
      // 模拟计算成本和合规性
      setTimeout(() => {
        const mockCostSummary = {
          totalCost: bomData.totalCost || 15000,
          materialCost: bomData.totalCost * 0.8 || 12000,
          laborCost: bomData.totalCost * 0.13 || 2000,
          overheadCost: bomData.totalCost * 0.07 || 1000
        };
        
        const mockComplianceResults = {
          rohsCompliance: true,
          rohsComplianceRate: 0.95,
          rohsNonCompliantCount: 2,
          ceCertification: true,
          ceExpiryDate: '2025-12-31',
          fccCompliance: true,
          fccReportAvailable: true,
          energyStarCompliance: true,
          energyStarLevel: '5'
        };
        
        setCostSummary(mockCostSummary);
        setComplianceResults(mockComplianceResults);
      }, 1000);
    }
  }, [currentStep, bomData]);
  
  // 当进入发布前检查步骤时，执行检查
  useEffect(() => {
    if (currentStep === 2) {
      performPublishChecks();
    }
  }, [currentStep]);
  
  // 执行发布前检查
  const performPublishChecks = () => {
    setLoading(true);
    
    // 模拟异步检查过程
    setTimeout(() => {
      setPublishStatus({
        status: 'ready',
        passedChecks: 8,
        totalChecks: 10,
        issues: [
          {
            id: 1,
            type: 'warning',
            title: '部分物料RoHS合规率未达100%',
            description: '有2个替代物料的RoHS合规状态需要确认'
          }
        ]
      });
      setLoading(false);
    }, 1500);
  };
  
  // 处理SAP发布
  const handleSAPRelease = () => {
    setLoading(true);
    
    // 模拟SAP发布过程
    setTimeout(() => {
      setSapReleaseResult({
        status: 'success',
        sapDocId: 'SAP-55000123',
        releaseDate: new Date().toLocaleString(),
        message: 'BOM已成功发布到SAP系统'
      });
      setLoading(false);
    }, 2000);
  };
  
  // 处理步骤切换
  const handleStepChange = (step) => {
    setCurrentStep(step);
  };
  
  // 进入下一个步骤
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // 返回上一个步骤
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const [form] = Form.useForm();
  
  // 处理L6项目编辑
  const handleEditL6Item = (record) => {
    setCurrentEditItem(record);
    // 正确设置表单初始值，确保所有字段都有值
    form.setFieldsValue({
      partName: record.partId,
      quantity: record.quantity,
      unit: record.unit,
      lifecycle: record.lifecycle || '量产' // 设置lifecycle的默认值
    });
    setEditModalVisible(true);
  };
  
  // 处理L6状态切换
  const handleToggleL6Status = (record) => {
    const newStatus = record.status === '未激活' ? '激活' : '未激活';
    
    // 递归更新BOM结构中的状态
    const updateItemStatus = (items, key, newStatus) => {
      return items.map(item => {
        // 如果是L6项目，更新其所有L7子项的parentStatus和状态
        if (item.key === key && item.children) {
          return {
            ...item,
            status: newStatus,
            children: item.children.map(child => ({
              ...child,
              parentStatus: newStatus,
              // 规则3：当L6弃用时，L7状态变为激活（不被置灰不带删除线）
              // 当L6启用时，L7状态变为未激活（置灰带删除线）
              status: newStatus === '未激活' ? '激活' : '未激活'
            }))
          };
        }
        
        // 递归处理子项
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: updateItemStatus(item.children, key, newStatus)
          };
        }
        
        return item;
      });
    };
    
    const updatedStructure = updateItemStatus(
      bomData.structure,
      record.key,
      newStatus
    );
    
    setBomData({
      ...bomData,
      structure: updatedStructure
    });
    
    message.success(`已${newStatus === '未激活' ? '弃用' : '启用'}该零件`);
  };
  
  // 处理L7删除
  const handleDeleteL7Item = (record) => {
    // 找到L6父项并删除对应的L7子项
    const deleteL7Item = (items, l7Key) => {
      return items.map(item => {
        if (item.children && item.children.some(child => child.key === l7Key)) {
          // 只保留除了要删除的L7项之外的其他子项
          // 注意：根据需求，我们允许每个L6下只保留一条L7数据
          const remainingChildren = item.children.filter(child => child.key !== l7Key);
          return {
            ...item,
            children: remainingChildren
          };
        }
        
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: deleteL7Item(item.children, l7Key)
          };
        }
        
        return item;
      });
    };
    
    const updatedStructure = deleteL7Item(bomData.structure, record.key);
    
    // 重新计算总成本
    const calculateTotalCost = (items) => {
      let total = 0;
      items.forEach(item => {
        // 计算L6和L7层级的成本（对应level 5和6）
        if (item.level >= 5 && item.status !== '未激活') {
          total += (item.cost || 0) * (item.quantity || 1);
        }
        // 递归处理子项
        if (item.children && item.children.length > 0) {
          total += calculateTotalCost(item.children);
        }
      });
      return total;
    };
    
    const newTotalCost = calculateTotalCost(updatedStructure);
    
    setBomData({
      ...bomData,
      structure: updatedStructure,
      totalCost: newTotalCost
    });
    
    message.success(`已删除替代料 ${record.title}`);
  };
  
  // 处理L7替代L6
  const handleReplaceL6WithL7 = (record) => {
    // 找到L6父项
    const findL6Parent = (items, l7Key) => {
      for (const item of items) {
        if (item.children && item.children.some(child => child.key === l7Key)) {
          return item;
        }
        if (item.children && item.children.length > 0) {
          const found = findL6Parent(item.children, l7Key);
          if (found) return found;
        }
      }
      return null;
    };
    
    const l6Parent = findL6Parent(bomData.structure, record.key);
    if (!l6Parent) return;
    
    // 验证物料编码分类是否一致
    // 获取L6物料编码的前缀（分类）
    const getPartCategory = (partId) => {
      if (!partId) return '';
      const parts = partId.split('-');
      return parts.length > 0 ? parts[0] : '';
    };
    
    const l6Category = getPartCategory(l6Parent.partId);
    const l7Category = getPartCategory(record.partId);
    
    // 如果分类不一致，不允许替代
    if (l6Category !== l7Category) {
      message.error(`替代失败：物料分类不一致。主料分类为"${l6Category}"，替代料分类为"${l7Category}"，请选择同一分类的替代料。`);
      return;
    }
    
    // 创建新的L6项，使用L7的数据
    const newL6Item = {
      ...l6Parent,
      partId: record.partId,
      title: record.title,
      cost: record.cost,
      quantity: record.quantity,
      unit: record.unit,
      supplier: record.supplier,
      lifecycle: record.lifecycle
    };
    
    // 更新BOM数据
    const updateL6Item = (items, l6Key, newItem) => {
      return items.map(item => {
        if (item.key === l6Key) {
          return newItem;
        }
        
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: updateL6Item(item.children, l6Key, newItem)
          };
        }
        
        return item;
      });
    };
    
    const updatedStructure = updateL6Item(
      bomData.structure,
      l6Parent.key,
      newL6Item
    );
    
    // 规则3：点击L7的替代按钮时更新成本并同步总成本
    // 计算新的总成本
    const calculateTotalCost = (items) => {
      let total = 0;
      items.forEach(item => {
        // 只计算L6层级的成本
        if (item.level === 6) {
          total += (item.cost || 0) * (item.quantity || 1);
        }
        // 递归处理子项
        if (item.children && item.children.length > 0) {
          total += calculateTotalCost(item.children);
        }
      });
      return total;
    };
    
    const newTotalCost = calculateTotalCost(updatedStructure);
    
    setBomData({
      ...bomData,
      structure: updatedStructure,
      totalCost: newTotalCost
    });
    
    message.success(`已使用${record.title}替换主料，成本已更新`);
  };
  
  // 处理编辑表单提交
  const handleEditSubmit = () => {
    form.validateFields().then(values => {
      // 验证物料编码分类是否一致
      // 获取L6物料编码的前缀（分类）
      const getPartCategory = (partId) => {
        if (!partId) return '';
        const parts = partId.split('-');
        return parts.length > 0 ? parts[0] : '';
      };
      
      const originalCategory = getPartCategory(currentEditItem.partId);
      const newCategory = getPartCategory(values.partName);
      
      // 如果分类不一致，不允许更新
      if (originalCategory !== newCategory) {
        message.error(`更新失败：物料分类不一致。原物料分类为"${originalCategory}"，新物料分类为"${newCategory}"，请选择同一分类的物料。`);
        return;
      }
      
      // 更新BOM数据
      const updateL6Item = (items, key, values) => {
        return items.map(item => {
          if (item.key === key) {
            // 根据新的物料编码查找对应的标题和成本
            const findPartInfo = (partId) => {
              // 从所有产品模板中查找匹配的物料
              for (const product of Object.values(bom7LayerTemplate)) {
                const traverse = (node) => {
                  if (node.partId === partId) {
                    return {
                      title: node.title,
                      cost: node.cost
                    };
                  }
                  
                  if (node.children && node.children.length > 0) {
                    for (const child of node.children) {
                      const result = traverse(child);
                      if (result) return result;
                    }
                  }
                  return null;
                };
                
                for (const item of product.structure) {
                  const result = traverse(item);
                  if (result) return result;
                }
              }
              return null;
            };
            
            const partInfo = findPartInfo(values.partId);
            
            // 更新所有字段
            return {
              ...item,
              partId: values.partName,
              title: partInfo ? partInfo.title : item.title, // 更新标题
              cost: partInfo ? partInfo.cost : item.cost, // 更新成本
              quantity: values.quantity,
              unit: values.unit,
              lifecycle: values.lifecycle
            };
          }
          
          if (item.children && item.children.length > 0) {
            return {
              ...item,
              children: updateL6Item(item.children, key, values)
            };
          }
          
          return item;
        });
      };
      
      const updatedStructure = updateL6Item(
        bomData.structure,
        currentEditItem.key,
        values
      );
      
      // 计算新的总成本 - 修正层级判断，L6对应的是level 5
      const calculateTotalCost = (items) => {
        let total = 0;
        items.forEach(item => {
          // 计算L6和L7层级的成本（对应level 5和6）
          if (item.level >= 5 && item.status !== '未激活') {
            total += (item.cost || 0) * (item.quantity || 1);
          }
          // 递归处理子项
          if (item.children && item.children.length > 0) {
            total += calculateTotalCost(item.children);
          }
        });
        return total;
      };
      
      const newTotalCost = calculateTotalCost(updatedStructure);
      
      setBomData({
        ...bomData,
        structure: updatedStructure,
        totalCost: newTotalCost
      });
      
      setEditModalVisible(false);
      setCurrentEditItem(null);
      message.success('零件信息已更新，成本已同步');
    });
  };
  
  // 处理导入按钮点击
  const handleImportClick = () => {
    setImportModalVisible(true);
  };
  
  // 关闭导入弹窗
  const handleImportModalClose = () => {
    setImportModalVisible(false);
    setFileList([]);
  };
  
  // 下载模板
  const handleDownloadTemplate = () => {
    // 检查是否安装了xlsx库
    if (typeof XLSX === 'undefined') {
      message.error('Excel处理库未加载，请刷新页面重试');
      return;
    }
    
    // 定义表头（中文）
    const headers = [
      '层级', '层级名称', '物料编码', '位号', '数量', '单位', 
      '成本', '供应商', '生命周期', '状态', '类型'
    ];
    
    // 生成示例数据（10条）
    const sampleData = [
      ['L1', '产品', 'P-001', '', '1', '套', '', '', '', '', ''],
      ['L2', '模块', 'M-001', '', '1', '套', '', '', '', '', ''],
      ['L3', '组件', 'C-001', '', '1', '套', '', '', '', '', ''],
      ['L4', '子组件', 'SC-001', '', '1', '套', '', '', '', '', ''],
      ['L5', '零件', 'P-001', '', '1', '件', '', '', '', '', ''],
      ['L6', 'CPU-处理器', 'CPU-001', '', '1', '件', '1200', 'Intel', '量产', '激活', '主料'],
      ['L7', 'CPU-处理器', 'CPU-002', '', '1', '件', '1100', 'AMD', '量产', '未激活', '替代料'],
      ['L6', '内存-条', 'MEM-001', '', '2', '件', '400', 'Kingston', '量产', '激活', '主料'],
      ['L7', '内存-条', 'MEM-002', '', '2', '件', '380', 'Crucial', '量产', '未激活', '替代料'],
      ['L6', '硬盘-固态', 'SSD-001', '', '1', '件', '500', 'Samsung', '量产', '激活', '主料']
    ];
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 创建工作表
    const wsData = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 8 },  // 层级
      { wch: 15 }, // 层级名称
      { wch: 15 }, // 物料编码
      { wch: 10 }, // 位号
      { wch: 8 },  // 数量
      { wch: 8 },  // 单位
      { wch: 10 }, // 成本
      { wch: 15 }, // 供应商
      { wch: 10 }, // 生命周期
      { wch: 8 },  // 状态
      { wch: 10 }  // 类型
    ];
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, 'BOM导入模板');
    
    // 生成Excel文件并下载
    const fileName = `BOM导入模板_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    message.success('模板下载成功');
  };
  
  // 导出BOM数据为Excel
  const handleExport = () => {
    if (!currentProductData || !currentProductData.structure) {
      message.warning('没有可导出的BOM数据');
      return;
    }
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 创建工作表数据
    const wsData = [
      ['层级', '层级名称', '物料编码', '位号', '数量', '单位', '成本', '供应商', '生命周期', '状态', '类型']
    ];
    
    // 递归遍历BOM数据
    const traverseBOM = (items) => {
      items.forEach(item => {
        const level = `L${item.level + 1}`;
        wsData.push([
          level,
          item.title || '',
          item.partId || '',
          item.position || '',
          item.quantity || 1,
          item.unit || '件',
          item.cost || 0,
          item.supplier || '',
          item.lifecycle || '',
          item.status || '',
          item.level === 5 ? '主料' : item.level === 6 ? '替代料' : ''
        ]);
        
        // 递归处理子项
        if (item.children && item.children.length > 0) {
          traverseBOM(item.children);
        }
      });
    };
    
    // 遍历BOM结构
    traverseBOM(currentProductData.structure);
    
    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 8 },  // 层级
      { wch: 15 }, // 层级名称
      { wch: 15 }, // 物料编码
      { wch: 10 }, // 位号
      { wch: 8 },  // 数量
      { wch: 8 },  // 单位
      { wch: 10 }, // 成本
      { wch: 15 }, // 供应商
      { wch: 10 }, // 生命周期
      { wch: 8 },  // 状态
      { wch: 10 }  // 类型
    ];
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, 'BOM数据');
    
    // 导出Excel文件
    const fileName = `${currentProductData.name}_BOM数据_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    message.success('BOM数据导出成功');
  };
  
  // 移除了跳转到成本与合规页面的函数，改为简化流程按钮
  
  // 处理文件选择
  const handleFileSelect = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };
  
  // 处理文件上传
  const handleUpload = () => {
    if (fileList.length === 0) {
      message.warning('请先选择Excel文件');
      return;
    }
    
    // 从fileList中提取实际的File对象
    const fileObj = fileList[0];
    const file = fileObj.originFileObj || fileObj;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      message.error('请上传Excel格式的文件');
      return;
    }
    
    // 检查是否安装了xlsx库
    if (typeof XLSX === 'undefined') {
      message.error('Excel处理库未加载，请刷新页面重试');
      return;
    }
    
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // 验证表头
        const expectedHeaders = [
          '层级', '层级名称', '物料编码', '位号', '数量', '单位', 
          '成本', '供应商', '生命周期', '状态', '类型'
        ];
        
        if (jsonData.length === 0 || !arraysEqual(jsonData[0], expectedHeaders)) {
          message.error('Excel模板格式不正确，请下载最新模板');
          setLoading(false);
          return;
        }
        
        // 跳过表头，处理数据行
        const rows = jsonData.slice(1).filter(row => row.length > 0 && row[0]); // 过滤空行
        
        if (rows.length === 0) {
          message.error('Excel文件中没有有效数据');
          setLoading(false);
          return;
        }
        
        // 将Excel数据转换为BOM结构
        const convertExcelToBOM = (rows) => {
          // 创建一个映射，用于按层级和父级关系组织数据
          const levelMap = {};
          const bomStructure = [];
          
          // 处理每一行数据
          rows.forEach((row, index) => {
            const [level, title, partId, position, quantity, unit, cost, supplier, lifecycle, status, type] = row;
            
            // 确定层级数值
            let levelNum = 0;
            if (level && level.startsWith('L')) {
              levelNum = parseInt(level.substring(1)) - 1; // L1对应level 0
            }
            
            // 创建节点对象
            const node = {
              key: `${level}-${index}`,
              level: levelNum,
              title: title || '',
              partId: partId || '',
              position: position || '',
              quantity: quantity ? parseInt(quantity) : 1,
              unit: unit || '件',
              cost: cost ? parseFloat(cost) : 0,
              supplier: supplier || '',
              lifecycle: lifecycle || '',
              status: status || (levelNum >= 5 ? '激活' : ''),
              type: type || '',
              children: []
            };
            
            // 将节点添加到对应层级的映射中
            if (!levelMap[levelNum]) {
              levelMap[levelNum] = [];
            }
            levelMap[levelNum].push(node);
          });
          
          // 构建树形结构
          const buildTree = (level, parent = null) => {
            if (!levelMap[level] || levelMap[level].length === 0) return [];
            
            return levelMap[level].map(node => {
              // 递归处理子节点
              const children = buildTree(node.level + 1, node);
              if (children.length > 0) {
                node.children = children;
              }
              
              // 如果是L6或L7，需要处理父子关系
              if (node.level >= 5) {
                // 查找父节点
                let parentNode = null;
                if (node.level === 5) { // L6
                  // 查找最近的L5节点作为父节点
                  for (let l = node.level - 1; l >= 0; l--) {
                    if (levelMap[l] && levelMap[l].length > 0) {
                      parentNode = levelMap[l][levelMap[l].length - 1];
                      break;
                    }
                  }
                } else if (node.level === 6) { // L7
                  // 查找最近的L6节点作为父节点
                  for (let l = node.level - 1; l >= 0; l--) {
                    if (levelMap[l] && levelMap[l].length > 0) {
                      parentNode = levelMap[l][levelMap[l].length - 1];
                      break;
                    }
                  }
                }
                
                // 如果找到父节点，添加为子节点
                if (parentNode) {
                  if (!parentNode.children) {
                    parentNode.children = [];
                  }
                  // 为L7节点添加parentStatus
                  if (node.level === 6) {
                    node.parentStatus = parentNode.status || '激活';
                  }
                  // 创建节点副本并添加到父节点的children中
                  const childNode = { ...node };
                  parentNode.children.push(childNode);
                  return null; // 不在根级别返回
                }
              }
              
              return node;
            }).filter(node => node !== null); // 过滤掉null值
          };
          
          // 从L0开始构建树
          const tree = buildTree(0);
          
          // 确保所有L6和L7节点都被正确处理
          // 处理L6节点
          if (levelMap[5]) {
            levelMap[5].forEach(l6Node => {
              // 查找L5父节点
              let parentNode = null;
              for (let l = 4; l >= 0; l--) {
                if (levelMap[l] && levelMap[l].length > 0) {
                  parentNode = levelMap[l][levelMap[l].length - 1];
                  break;
                }
              }
              
              if (parentNode && !parentNode.children.some(child => child.key === l6Node.key)) {
                if (!parentNode.children) {
                  parentNode.children = [];
                }
                parentNode.children.push(l6Node);
              }
            });
          }
          
          // 处理L7节点
          if (levelMap[6]) {
            levelMap[6].forEach(l7Node => {
              // 查找L6父节点
              let parentNode = null;
              if (levelMap[5] && levelMap[5].length > 0) {
                parentNode = levelMap[5][levelMap[5].length - 1];
              }
              
              if (parentNode && !parentNode.children.some(child => child.key === l7Node.key)) {
                if (!parentNode.children) {
                  parentNode.children = [];
                }
                // 为L7节点添加parentStatus
                l7Node.parentStatus = parentNode.status || '激活';
                parentNode.children.push(l7Node);
              }
            });
          }
          
          return tree;
        };
        
        // 转换数据
        const newStructure = convertExcelToBOM(rows);
        
        // 计算总成本
        const calculateTotalCost = (items) => {
          let total = 0;
          items.forEach(item => {
            // 计算L6和L7层级的成本（对应level 5和6）
            if (item.level >= 5 && item.status !== '未激活') {
              total += (item.cost || 0) * (item.quantity || 1);
            }
            // 递归处理子项
            if (item.children && item.children.length > 0) {
              total += calculateTotalCost(item.children);
            }
          });
          return total;
        };
        
        const newTotalCost = calculateTotalCost(newStructure);
        
        // 更新BOM数据
        setBomData({
          ...bomData,
          structure: newStructure,
          totalCost: newTotalCost
        });
        
        setLoading(false);
        setImportModalVisible(false);
        setFileList([]);
        message.success(`成功导入${rows.length}条BOM数据`);
      } catch (error) {
        console.error('导入Excel文件出错:', error);
        setLoading(false);
        message.error('导入Excel文件失败，请检查文件格式');
      }
    };
    
    reader.onerror = () => {
      setLoading(false);
      message.error('读取文件失败');
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  // 辅助函数：比较两个数组是否相等
  const arraysEqual = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    
    return true;
  };
  
  // 上传配置
  const uploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    onChange: handleFileSelect,
    beforeUpload: () => false, // 阻止自动上传
    accept: '.xlsx,.xls'
  };
  
  // 获取当前选中的产品数据
  const currentProductData = bomData || bom7LayerTemplate[selectedProduct];
  // 确保每次bomData更新时都重新计算flatData，添加JSON.stringify确保深度比较
  const flatData = React.useMemo(() => {
    if (!currentProductData || !currentProductData.structure) return [];
    return flattenTreeData(currentProductData.structure);
  }, [currentProductData ? JSON.stringify(currentProductData.structure) : null]);
  
  // 过滤数据 - 使用useMemo确保searchText或flatData变化时重新计算
  const filteredData = React.useMemo(() => {
    return flatData.filter(item => 
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.partId && item.partId.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [flatData, searchText]);
  
  // 计算总成本，只计算激活状态的L6和L7项 - 使用useMemo确保flatData变化时重新计算
  const totalCost = React.useMemo(() => {
    return flatData.reduce((sum, item) => {
      // 只计算L6和L7层级（level 5和6）
      if (item.level < 5) return sum;
      
      // 检查状态：L6项必须激活，L7项必须激活
      const isActive = item.status !== '未激活';
      
      // L6项：必须激活
      if (item.level === 5 && !isActive) return sum;
      
      // L7项：必须激活
      if (item.level === 6 && !isActive) return sum;
      
      return item.cost ? sum + (item.cost * (item.quantity || 1)) : sum;
    }, 0);
  }, [flatData]);
  
  // 计算统计数据 - 使用useMemo确保flatData变化时重新计算
  const statistics = React.useMemo(() => {
    // 计算零部件总数（L6和L7层级）
    const totalParts = flatData.filter(item => item.level >= 5).length;
    
    // 计算供应商总数（去重）
    const uniqueSuppliers = new Set();
    flatData.forEach(item => {
      if (item.supplier) {
        uniqueSuppliers.add(item.supplier);
      }
    });
    const totalSuppliers = uniqueSuppliers.size;
    
    // 计算量产数（状态为"量产"的L6和L7层级）
    const massProductionCount = flatData.filter(item => 
      item.level >= 5 && item.status === '量产'
    ).length;
    
    // 计算激活总数（状态为"激活"的L6和L7层级）
    const activeCount = flatData.filter(item => 
      item.level >= 5 && item.status === '激活'
    ).length;
    
    return [
      { level: '零部件总数', count: totalParts },
      { level: '供应商总数', count: totalSuppliers },
      { level: '量产数', count: massProductionCount },
      { level: '激活总数', count: activeCount }
    ];
  }, [flatData]);
  
  // 处理树节点展开
  const onExpand = (keys) => {
    setExpandedKeys(keys);
  };
  
  // 默认展开所有节点
  useEffect(() => {
    if (currentProductData && currentProductData.structure) {
      const getAllKeys = (data, keys = []) => {
        data.forEach(item => {
          keys.push(item.key);
          if (item.children && item.children.length > 0) {
            getAllKeys(item.children, keys);
          }
        });
        return keys;
      };
      setExpandedKeys(getAllKeys(currentProductData.structure));
    }
  }, [currentProductData]);
  
  // 初始化BOM数据
  useEffect(() => {
    const initialData = bom7LayerTemplate[selectedProduct];
    
    // 为所有L7层级添加初始状态，并确保每个L6只有一个L7子级
    const addInitialStatus = (items) => {
      return items.map(item => {
        // L6层级默认状态为激活（不是量产）
        if (item.level === 6) {
          return {
            ...item,
            status: '激活'
          };
        }
        
        // L7层级添加parentStatus和初始状态
        if (item.level === 7) {
          return {
            ...item,
            status: '未激活', // L7默认未激活，使其初始化时完全置灰带删除线
            parentStatus: '激活' // 父项默认激活
          };
        }
        
        // 递归处理子项
        if (item.children && item.children.length > 0) {
          let processedChildren = addInitialStatus(item.children);
          
          // 规则2：L6作为父级只能有一个子级L7，多余删除
          if (item.level === 6 && processedChildren.length > 1) {
            // 只保留第一个L7子项
            processedChildren = [processedChildren[0]];
          }
          
          return {
            ...item,
            children: processedChildren
          };
        }
        
        return item;
      });
    };
    
    if (initialData) {
      setBomData({
        ...initialData,
        structure: addInitialStatus(initialData.structure)
      });
    }
  }, [selectedProduct]);
  
  return (
    <div style={{ padding: 24, fontSize: '0.84em' }}>
      <Title level={2} style={{ fontSize: '1.8em' }}>快速生成BOM</Title>
      
      <Divider />
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="选择产品模板" size="small">
            <Select
              style={{ width: '100%' }}
              value={selectedProduct}
              onChange={setSelectedProduct}
            >
              {Object.keys(bom7LayerTemplate).map(product => (
                <Option key={product} value={product}>{product}</Option>
              ))}
            </Select>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="视图模式" size="small">
            <Select
              style={{ width: '100%' }}
              value={viewMode}
              onChange={setViewMode}
            >
              <Option value="table">表格视图</Option>
              <Option value="tree">树形视图</Option>
            </Select>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="搜索" size="small">
            <Search
              placeholder="搜索物料名称或编码"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总成本" value={totalCost} prefix="¥" />
          </Card>
        </Col>
        
        {statistics.map(({ level, count }) => (
          <Col span={6} key={level}>
            <Card size="small">
              <Statistic title={level} value={count} />
            </Card>
          </Col>
        ))}
      </Row>
      
      {currentProductData ? (
        <>
          <Row style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Title level={4}>{currentProductData.name}</Title>
              <Text type="secondary">{currentProductData.description}</Text>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<ImportOutlined />} onClick={handleImportClick}>导入</Button>
                <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
                <Button icon={<CopyOutlined />}>复制模板</Button>
              </Space>
            </Col>
          </Row>
          
          {viewMode === 'table' ? (
            <Table
              columns={getTableColumns(handleEditL6Item, handleToggleL6Status, handleReplaceL6WithL7, handleDeleteL7Item)}
              dataSource={filteredData}
              pagination={{ pageSize: 50 }}
              scroll={{ x: 1200, y: 600 }}
              bordered
              size="small"
              rowKey="key"
              loading={loading}
              rowClassName={(record) => {
                // L6层级弃用时置灰带删除线
                if (record.level === 5 && record.status === '未激活') {
                  return styles.disabledRow;
                }
                // L7层级状态为未激活且父级为激活时置灰带删除线，L7状态为激活时不被置灰不带删除线
                if (record.level === 6 && record.status === '未激活' && record.parentStatus === '激活') {
                  return styles.disabledRow;
                }
                return '';
              }}
            />
          ) : (
            <Card>
              <Tree
                showLine
                checkable={false}
                expandedKeys={expandedKeys}
                onExpand={onExpand}
              >
                {renderTreeNodes(currentProductData.structure)}
              </Tree>
            </Card>
          )}
        </>
      ) : (
        <Empty description="请选择产品模板" />
      )}
      
      {/* 导入弹窗 */}
      <Modal
        title="Excel导入"
        open={importModalVisible}
        onCancel={handleImportModalClose}
        footer={[
          <Button key="cancel" onClick={handleImportModalClose}>
            取消
          </Button>,
          <Button 
            key="import" 
            type="primary" 
            onClick={() => {
              handleUpload();
              // 导入成功后跳转到成本与合规页面
              setTimeout(() => {
                navigateToCostCompliance();
              }, 1000);
            }}
            loading={loading}
          >
            确认并跳转
          </Button>
        ]}
        width={600}
      >
        <div style={{ marginBottom: 24 }}>
          <AntTitle level={5}>操作指南</AntTitle>
          <Paragraph>1. 下载Excel模板并按照模板格式填写数据</Paragraph>
          <Paragraph>2. 上传填写完成的Excel文件</Paragraph>
          <Paragraph>3. 点击导入按钮开始处理数据</Paragraph>
          <Paragraph>4. 导入成功后，系统将自动更新BOM数据</Paragraph>
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <AntTitle level={5}>模板下载</AntTitle>
          <Button type="default" onClick={handleDownloadTemplate}>
            下载Excel模板
          </Button>
        </div>
        
        <div>
          <AntTitle level={5}>文件选择</AntTitle>
          <Upload.Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <ImportOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持单个Excel文件（.xlsx, .xls）上传
            </p>
          </Upload.Dragger>
        </div>
      </Modal>
      
      {/* 编辑L6零件模态框 */}
      <Modal
        title="编辑L6组件"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentEditItem(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setEditModalVisible(false);
            setCurrentEditItem(null);
          }}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleEditSubmit}>
            保存
          </Button>
        ]}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="物料编码"
            name="partName"
            rules={[{ required: true, message: '请选择物料编码' }]}
          >
            <Select placeholder="请选择物料编码">
              {/* 获取当前L6项对应的所有替代料作为选项，只显示同一分类的物料 */}
              {currentEditItem && (() => {
                // 获取物料编码的前缀（分类）
                const getPartCategory = (partId) => {
                  if (!partId) return '';
                  const parts = partId.split('-');
                  return parts.length > 0 ? parts[0] : '';
                };
                
                const currentCategory = getPartCategory(currentEditItem.partId);
                
                // 查找所有L6项和L7项作为替代料选项，从所有产品模板中查找
                const findAllAlternatives = () => {
                  const alternatives = [];
                  
                  // 遍历所有产品模板
                  Object.values(bom7LayerTemplate).forEach(product => {
                    const traverse = (node) => {
                      // 如果是L6项或L7项，且属于同一分类，添加到替代料列表
                      if ((node.level === 5 || node.level === 6) && 
                          getPartCategory(node.partId) === currentCategory) {
                        alternatives.push(node);
                      }
                      
                      // 递归遍历子节点
                      if (node.children && node.children.length > 0) {
                        node.children.forEach(child => traverse(child));
                      }
                    };
                    
                    product.structure.forEach(item => traverse(item));
                  });
                  
                  return alternatives;
                };
                
                // 查找所有L6项和L7项
                const allAlternatives = findAllAlternatives();
                
                // 创建选项列表，去重
                const uniqueOptions = new Map();
                
                // 添加当前L6项作为选项
                uniqueOptions.set(currentEditItem.partId, {
                  key: `current-${currentEditItem.partId}`, // 使用前缀确保唯一性
                  value: currentEditItem.partId,
                  label: `${currentEditItem.title} - ${currentEditItem.partId}`
                });
                
                // 添加所有替代料作为选项
                allAlternatives.forEach(item => {
                  if (!uniqueOptions.has(item.partId)) {
                    uniqueOptions.set(item.partId, {
                      key: `alt-${item.partId}-${item.level}`, // 使用前缀和层级确保唯一性
                      value: item.partId,
                      label: `${item.title} - ${item.partId}`
                    });
                  }
                });
                
                // 转换为Option组件数组，按型号分组
                const options = Array.from(uniqueOptions.values()).map(option => (
                  <Option key={option.key} value={option.value}>
                    {option.label}
                  </Option>
                ));
                
                return options;
              })()}
            </Select>
          </Form.Item>
          
          <Form.Item
            label="数量"
            name="quantity"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <Input type="number" placeholder="请输入数量" />
          </Form.Item>
          
          <Form.Item
            label="单位"
            name="unit"
            rules={[{ required: true, message: '请选择单位' }]}
          >
            <Select placeholder="请选择单位">
              <Option value="piece">件</Option>
              <Option value="set">套</Option>
              <Option value="item">项</Option>
              <Option value="unit">单位</Option>
              <Option value="EA">件</Option>
              <Option value="SET">套</Option>
              <Option value="M">米</Option>
              <Option value="KG">千克</Option>
              <Option value="L">升</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="生命周期"
            name="lifecycle"
            rules={[{ required: true, message: '请选择生命周期' }]}
          >
            <Select placeholder="请选择生命周期">
              <Option value="量产">量产</Option>
              <Option value="研发">研发</Option>
              <Option value="逐步淘汰">逐步淘汰</Option>
              <Option value="停产">停产</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 步骤导航 */}
      {bomData && (
        <div style={{ marginTop: 24 }}>
          <Steps
            current={currentStep}
            onChange={handleStepChange}
            items={[
              {
                title: 'BOM生成',
                description: '选择产品模板并编辑BOM结构'
              },
              {
                title: '成本与合规',
                description: '查看成本分析和合规检查结果'
              },
              {
                title: '发布前检查',
                description: '确认BOM完整性和一致性'
              },
              {
                title: '一键同步SAP',
                description: '将BOM发布到SAP系统'
              }
            ]}
          />
          
          <Divider />
          
          {/* 成本与合规步骤 */}
          {currentStep === 1 && (
            <Card title={<span><FileTextOutlined /> 成本与合规管理</span>}>
              <CostComplianceStep
                ref={costComplianceRef}
                bomData={bomData}
                costSummary={costSummary}
                complianceResults={complianceResults}
                onCostChange={setCostSummary}
                onComplianceChange={setComplianceResults}
              />
              
              <Space style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                <Button onClick={handlePrevStep}>上一步</Button>
                <Button type="primary" onClick={handleNextStep}>下一步</Button>
              </Space>
            </Card>
          )}
          
          {/* 发布前检查步骤 */}
          {currentStep === 2 && (
            <Card title={<span><RocketOutlined /> 发布前检查</span>}>
              <Spin spinning={loading}>
                {publishStatus ? (
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Card>
                        <Statistic 
                          title="检查通过率" 
                          value={publishStatus.passedChecks}
                          suffix={`/${publishStatus.totalChecks}`}
                        />
                        <Progress 
                          percent={(publishStatus.passedChecks / publishStatus.totalChecks) * 100} 
                          status={publishStatus.status === 'ready' ? 'active' : 'exception'}
                          style={{ marginTop: 16 }}
                        />
                      </Card>
                    </Col>
                    <Col span={16}>
                      <Card title="检查结果摘要">
                        {publishStatus.issues.length > 0 ? (
                          <Alert
                            message="需要注意的问题"
                            description={publishStatus.issues.map(issue => (
                              <div key={issue.id} style={{ marginTop: 8 }}>
                                <Tag color={issue.type === 'error' ? 'red' : 'orange'}>{issue.type === 'error' ? '错误' : '警告'}</Tag>
                                <strong>{issue.title}</strong>
                                <p>{issue.description}</p>
                              </div>
                            ))}
                            type="warning"
                            showIcon
                          />
                        ) : (
                          <div style={{ textAlign: 'center', padding: 24 }}>
                            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                            <p style={{ fontSize: 16, fontWeight: 'bold' }}>所有检查项均已通过！</p>
                          </div>
                        )}
                      </Card>
                    </Col>
                  </Row>
                ) : (
                  <p style={{ textAlign: 'center', padding: 48 }}>正在执行发布前检查，请稍候...</p>
                )}
              </Spin>
              
              <Space style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                <Button onClick={handlePrevStep}>上一步</Button>
                <Button 
                  type="primary" 
                  onClick={handleNextStep}
                  disabled={!publishStatus || publishStatus.status === 'error'}
                >
                  下一步
                </Button>
              </Space>
            </Card>
          )}
          
          {/* 一键同步SAP步骤 */}
          {currentStep === 3 && (
            <Card title={<span><CloudUploadOutlined /> 一键同步SAP</span>}>
              <Spin spinning={loading}>
                {sapReleaseResult ? (
                  <Result
                    status={sapReleaseResult.status === 'success' ? 'success' : 'error'}
                    title={sapReleaseResult.status === 'success' ? 'SAP发布成功！' : 'SAP发布失败'}
                    subTitle={sapReleaseResult.message}
                    extra={[
                      <Card key="result" style={{ width: '100%', marginTop: 16 }}>
                        <Descriptions title="发布信息" bordered>
                          <Descriptions.Item label="SAP文档ID">{sapReleaseResult.sapDocId}</Descriptions.Item>
                          <Descriptions.Item label="发布时间">{sapReleaseResult.releaseDate}</Descriptions.Item>
                          <Descriptions.Item label="产品名称" span={2}>{bomData.name}</Descriptions.Item>
                        </Descriptions>
                      </Card>
                    ]}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <p style={{ fontSize: 16, marginBottom: 24 }}>点击下方按钮将当前BOM发布到SAP系统</p>
                    <Button 
                      type="primary" 
                      size="large" 
                      icon={<CloudUploadOutlined />}
                      onClick={handleSAPRelease}
                    >
                      一键发布到SAP
                    </Button>
                  </div>
                )}
              </Spin>
              
              <Space style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                <Button onClick={handlePrevStep}>上一步</Button>
                {sapReleaseResult && (
                  <Button 
                    type="primary" 
                    onClick={() => setCurrentStep(0)}
                  >
                    完成
                  </Button>
                )}
              </Space>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default BOMGenerator;