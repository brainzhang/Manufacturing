import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Tree, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Card, 
  Row, 
  Col, 
  Tag, 
  Tooltip,
  message,
  Popconfirm,
  Divider,
  Typography,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  CloseOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { BOM_LEVELS } from '../constants/bomConstants';

const { Option } = Select;
const { Title, Text } = Typography;
const { TreeNode } = Tree;

// 下拉选项数据
const PART_NAMES = [
  'CPU处理器', '内存条', '固态硬盘', '主板', '显卡', '电源', '散热器', '机箱', 
  '显示屏', '键盘', '触摸板', '电池', '摄像头', '扬声器', '网卡', '接口'
];

const UNITS = ['个', '套', '片', '条', '块', '根', '米', '千克', '升', '毫升'];

const SUPPLIERS = [
  'Intel', 'AMD', 'NVIDIA', 'Samsung', 'Western Digital', 'Kingston', 
  'Crucial', 'ASUS', 'Gigabyte', 'MSI', 'Dell', 'HP', 'Lenovo', 'Apple'
];

const LIFECYCLE_STATUSES = ['研发', '试产', '量产', '停产', '淘汰'];

const ITEM_STATUSES = ['有效', '无效', '待定', '替代', '淘汰'];

// BOM节点数据模型
const createBOMNode = (config) => ({
  id: config.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  parentId: config.parentId || null,
  level: config.level || 1,
  position: config.position || '',
  nodeType: config.nodeType || '父节点',
  title: config.title || `层级${config.level}节点`,
  partName: config.partName || '',
  quantity: config.quantity || 1,
  unit: config.unit || '个',
  cost: config.cost || 0,
  supplier: config.supplier || '',
  variance: config.variance || 0,
  lifecycle: config.lifecycle || '量产',
  itemStatus: config.itemStatus || '有效',
  children: config.children || [],
  key: config.key || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
});

// 位号生成规则
const generatePosition = (level, parentPosition = '', index = 1, isAlternative = false) => {
  const levelPrefixes = {
    [BOM_LEVELS.L1.level]: 'M', // 整机 (Machine)
    [BOM_LEVELS.L2.level]: 'U', // 模块 (Unit)
    [BOM_LEVELS.L3.level]: 'S', // 子模块 (Submodule)
    [BOM_LEVELS.L4.level]: 'F', // 族 (Family)
    [BOM_LEVELS.L5.level]: 'G', // 组 (Group)
    [BOM_LEVELS.L6.level]: 'P', // 主料 (Primary Part)
    [BOM_LEVELS.L7.level]: 'A'  // 替代料 (Alternative Part)
  };
  
  const prefix = levelPrefixes[level];
  
  if (level === BOM_LEVELS.L1.level) {
    return `${prefix}${index}`;
  }
  
  if (level >= BOM_LEVELS.L6.level) {
    // L6/L7层使用主料编号+替代料标识
    if (parentPosition) {
      if (level === BOM_LEVELS.L6.level) {
        return `${parentPosition}.P${index}`;
      } else if (level === BOM_LEVELS.L7.level) {
        // 替代料使用字母标识：A, B, C...
        const altChar = String.fromCharCode(65 + index - 1); // A, B, C...
        return `${parentPosition}.${altChar}`;
      }
    }
    return `${prefix}${index}`;
  }
  
  // L2-L5层使用层级编号
  return parentPosition ? `${parentPosition}.${prefix}${index}` : `${prefix}${index}`;
};

// 生成默认BOM模板
const generateDefaultTemplate = () => {
  const rootNode = createBOMNode({
    level: BOM_LEVELS.L1.level,
    title: '产品整机',
    position: generatePosition(BOM_LEVELS.L1.level)
  });

  // L2: 模块层
  const module1 = createBOMNode({
    level: BOM_LEVELS.L2.level,
    title: '主板模块',
    parentId: rootNode.id,
    position: generatePosition(BOM_LEVELS.L2.level, rootNode.position, 1)
  });

  const module2 = createBOMNode({
    level: BOM_LEVELS.L2.level,
    title: '电源模块',
    parentId: rootNode.id,
    position: generatePosition(BOM_LEVELS.L2.level, rootNode.position, 2)
  });

  const module3 = createBOMNode({
    level: BOM_LEVELS.L2.level,
    title: '存储模块',
    parentId: rootNode.id,
    position: generatePosition(BOM_LEVELS.L2.level, rootNode.position, 3)
  });

  // L3: 子模块层
  const subModule1 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: 'CPU子系统',
    parentId: module1.id,
    position: generatePosition(BOM_LEVELS.L3.level, module1.position, 1)
  });

  const subModule2 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: '内存子系统',
    parentId: module1.id,
    position: generatePosition(BOM_LEVELS.L3.level, module1.position, 2)
  });

  // L4: 族层
  const family1 = createBOMNode({
    level: BOM_LEVELS.L4.level,
    title: '处理器族',
    parentId: subModule1.id,
    position: generatePosition(BOM_LEVELS.L4.level, subModule1.position, 1)
  });

  // L5: 组层
  const group1 = createBOMNode({
    level: BOM_LEVELS.L5.level,
    title: '处理器组',
    parentId: family1.id,
    position: generatePosition(BOM_LEVELS.L5.level, family1.position, 1)
  });

  // L6: 主料层
  const mainPart1 = createBOMNode({
    level: BOM_LEVELS.L6.level,
    title: 'Intel Core i7处理器',
    nodeType: '主料',
    partName: 'CPU处理器',
    parentId: group1.id,
    position: generatePosition(BOM_LEVELS.L6.level, group1.position, 1),
    quantity: 1,
    unit: '个',
    cost: 2599,
    supplier: 'Intel',
    variance: 0,
    lifecycle: '量产',
    itemStatus: '有效'
  });

  // L7: 替代料层
  const altPart1 = createBOMNode({
    level: BOM_LEVELS.L7.level,
    title: 'AMD Ryzen 7处理器',
    nodeType: '替代料',
    partName: 'CPU处理器',
    parentId: mainPart1.id,
    position: generatePosition(BOM_LEVELS.L7.level, mainPart1.position, 1),
    quantity: 1,
    unit: '个',
    cost: 2399,
    supplier: 'AMD',
    variance: -200,
    lifecycle: '量产',
    itemStatus: '替代'
  });

  // 构建树结构
  rootNode.children = [module1, module2, module3];
  module1.children = [subModule1, subModule2];
  subModule1.children = [family1];
  family1.children = [group1];
  group1.children = [mainPart1];
  mainPart1.children = [altPart1];

  return rootNode;
};

const BOMTreeEditor = ({ initialData = null, onSave = null }) => {
  const [treeData, setTreeData] = useState(() => {
    if (initialData && typeof initialData === 'object') {
      return initialData;
    }
    return generateDefaultTemplate();
  });

  // 当initialData变化时更新treeData
  useEffect(() => {
    if (initialData && typeof initialData === 'object') {
      setTreeData(initialData);
    }
  }, [initialData]);
  const [expandedKeys, setExpandedKeys] = useState(['node-0']);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);
  const [form] = Form.useForm();
  const [isAddingChild, setIsAddingChild] = useState(false);

  // 初始化expandedKeys
  useEffect(() => {
    if (treeData) {
      const getAllNodeKeys = (node) => {
        if (!node) return [];
        const keys = [node.id];
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => {
            keys.push(...getAllNodeKeys(child));
          });
        }
        return keys;
      };
      setExpandedKeys(getAllNodeKeys(treeData));
    }
  }, [treeData]);

  // 递归查找节点
  const findNode = useCallback((node, nodeId) => {
    if (node.id === nodeId) return node;
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const found = findNode(child, nodeId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // 递归更新节点
  const updateNode = useCallback((node, nodeId, updatedNode) => {
    if (node.id === nodeId) {
      return { ...node, ...updatedNode };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: node.children.map(child => updateNode(child, nodeId, updatedNode))
      };
    }
    return node;
  }, []);

  // 递归删除节点
  const deleteNode = useCallback((node, nodeId) => {
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: node.children
          .filter(child => child.id !== nodeId)
          .map(child => deleteNode(child, nodeId))
      };
    }
    return node;
  }, []);

  // 递归添加子节点
  const addChildNode = useCallback((node, parentId, newNode) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newNode]
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: node.children.map(child => addChildNode(child, parentId, newNode))
      };
    }
    return node;
  }, []);

  // 递归生成所有节点键值
  const getAllKeys = useCallback((node) => {
    const keys = [node.key];
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        keys.push(...getAllKeys(child));
      });
    }
    return keys;
  }, []);

  // 获取同级节点数量
  const getSiblingCount = useCallback((node, parentId) => {
    if (!parentId) return 0;
    
    const parentNode = findNode(treeData, parentId);
    if (!parentNode || !parentNode.children) return 0;
    
    return parentNode.children.length;
  }, [treeData, findNode]);

  // 处理节点编辑
  const handleEditNode = useCallback((nodeId) => {
    const node = findNode(treeData, nodeId);
    if (node) {
      setCurrentNode(node);
      setIsAddingChild(false);
      form.setFieldsValue({
        title: node.title,
        partName: node.partName,
        quantity: node.quantity,
        unit: node.unit,
        cost: node.cost,
        supplier: node.supplier,
        variance: node.variance,
        lifecycle: node.lifecycle,
        itemStatus: node.itemStatus
      });
      setEditModalVisible(true);
    }
  }, [treeData, findNode, form]);

  // 处理添加子节点
  const handleAddChild = useCallback((nodeId) => {
    const node = findNode(treeData, nodeId);
    if (node) {
      // 检查是否可以添加子节点
      if (node.level >= 7) {
        message.warning('已达到最大层级，无法添加子节点');
        return;
      }
      
      setCurrentNode(node);
      setIsAddingChild(true);
      form.resetFields();
      setEditModalVisible(true);
    }
  }, [treeData, findNode]);

  // 处理删除节点
  const handleDeleteNode = useCallback((nodeId) => {
    if (nodeId === treeData.id) {
      message.warning('不能删除根节点');
      return;
    }
    
    const updatedTree = deleteNode(treeData, nodeId);
    setTreeData(updatedTree);
    message.success('节点删除成功');
  }, [treeData, deleteNode]);

  // 处理表单提交
  const handleFormSubmit = useCallback((values) => {
    if (isAddingChild && currentNode) {
      // 添加新子节点
      const siblingCount = getSiblingCount(currentNode.id, currentNode.parentId);
      const newNode = createBOMNode({
        parentId: currentNode.id,
        level: currentNode.level + 1,
        title: values.title || `层级${currentNode.level + 1}节点`,
        position: generatePosition(
          currentNode.level + 1, 
          currentNode.position, 
          siblingCount + 1,
          currentNode.level + 1 === 7 // 如果是L7层，标记为替代料
        ),
        nodeType: currentNode.level + 1 === 6 ? '主料' : currentNode.level + 1 === 7 ? '替代料' : '父节点',
        partName: values.partName,
        quantity: values.quantity,
        unit: values.unit,
        cost: values.cost,
        supplier: values.supplier,
        variance: values.variance,
        lifecycle: values.lifecycle,
        itemStatus: values.itemStatus
      });
      
      const updatedTree = addChildNode(treeData, currentNode.id, newNode);
      setTreeData(updatedTree);
      message.success('子节点添加成功');
    } else if (currentNode) {
      // 更新现有节点
      const updatedNode = {
        ...values,
        title: values.title || currentNode.title
      };
      
      const updatedTree = updateNode(treeData, currentNode.id, updatedNode);
      setTreeData(updatedTree);
      message.success('节点更新成功');
    }
    
    setEditModalVisible(false);
    setCurrentNode(null);
    setIsAddingChild(false);
  }, [isAddingChild, currentNode, treeData, getSiblingCount, addChildNode, updateNode]);

  // 将BOM节点数据转换为AntD Tree组件所需的treeData格式
  const convertToTreeData = (node) => {
    if (!node) return [];
    
    const key = node.id; // 使用节点的id作为key，确保与事件处理函数匹配
    const isEditable = node.level >= 6; // L6和L7节点可编辑
    const canAddChild = node.level < 7; // 小于7层的节点可以添加子节点
    const isRoot = node.level === 1;
    
    const nodeTitle = (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div>
          <Tag color={BOM_LEVELS[`L${node.level}`] ? 'blue' : 'default'}>
            {BOM_LEVELS[`L${node.level}`]?.name || `层级${node.level}`}
          </Tag>
          <span style={{ marginLeft: 8 }}>{node.title}</span>
          {node.position && (
            <Tag color="green" style={{ marginLeft: 8 }}>
              {node.position}
            </Tag>
          )}
          {isEditable && node.partName && (
            <Tag color="orange" style={{ marginLeft: 8 }}>
              {node.partName}
            </Tag>
          )}
        </div>
        <Space size="small">
          {canAddChild && (
            <Tooltip title="添加子节点">
              <Button 
                type="text" 
                size="small" 
                icon={<PlusOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddChild(node.id);
                }}
              />
            </Tooltip>
          )}
          {isEditable && (
            <Tooltip title="编辑节点">
              <Button 
                type="text" 
                size="small" 
                icon={<EditOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditNode(node.id);
                }}
              />
            </Tooltip>
          )}
          {!isRoot && (
            <Popconfirm
              title="确定要删除此节点吗？"
              onConfirm={(e) => {
                e?.stopPropagation();
                handleDeleteNode(node.id);
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip title="删除节点">
                <Button 
                  type="text" 
                  size="small" 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      </div>
    );

    return {
      key,
      title: nodeTitle,
      children: node.children && node.children.length > 0 
        ? node.children.map(child => convertToTreeData(child))
        : undefined
    };
  };

  // 处理保存
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(treeData);
    } else {
      message.success('BOM结构已保存');
    }
  }, [treeData, onSave]);

  // 计算总成本
  const totalCost = useMemo(() => {
    const calculateNodeCost = (node) => {
      let cost = node.level >= 6 ? (node.cost || 0) * (node.quantity || 1) : 0;
      
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          cost += calculateNodeCost(child);
        });
      }
      
      return cost;
    };
    
    return calculateNodeCost(treeData);
  }, [treeData]);

  return (
    <Card title="BOM树形结构编辑器" style={{ height: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={5}>7层BOM结构</Title>
            <Text type="secondary">
              整机(L1) → 模块(L2) → 子模块(L3) → 零件族(L4) → 零件组(L5) → 主料(L6) → 替代料(L7)
            </Text>
          </Col>
          <Col>
            <Space>
              <Text strong>总成本: ¥{totalCost.toFixed(2)}</Text>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                保存BOM
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Alert
        message="操作提示"
        description={
          <div>
            <p>• 点击"添加子节点"按钮可以添加下一级节点</p>
            <p>• L6和L7节点支持编辑详细物料信息</p>
            <p>• 位号会根据层级自动生成</p>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <div style={{ height: 'calc(100% - 200px)', overflow: 'auto' }}>
        <Tree
          showLine
          defaultExpandParent
          expandedKeys={expandedKeys}
          selectedKeys={selectedKeys}
          onExpand={setExpandedKeys}
          onSelect={setSelectedKeys}
          treeData={[convertToTreeData(treeData)]}
        />
      </div>

      <Modal
        title={isAddingChild ? '添加子节点' : '编辑节点'}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentNode(null);
          setIsAddingChild(false);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{
            quantity: 1,
            unit: '个',
            lifecycle: '量产',
            itemStatus: '有效'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="节点名称"
                name="title"
                rules={[{ required: true, message: '请输入节点名称' }]}
              >
                <Input placeholder="请输入节点名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="节点类型"
              >
                <Input disabled value={isAddingChild ? 
                  BOM_LEVELS[`L${currentNode?.level + 1}`]?.name : 
                  BOM_LEVELS[`L${currentNode?.level}`]?.name} 
                />
              </Form.Item>
            </Col>
          </Row>

          {(isAddingChild ? currentNode?.level + 1 : currentNode?.level) >= 6 && (
            <>
              <Divider>物料信息</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="零件名称"
                    name="partName"
                    rules={[{ required: true, message: '请选择零件名称' }]}
                  >
                    <Select placeholder="请选择零件名称">
                      {PART_NAMES.map(name => (
                        <Option key={name} value={name}>{name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="用量"
                    name="quantity"
                    rules={[{ required: true, message: '请输入用量' }]}
                  >
                    <InputNumber min={1} placeholder="用量" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="单位"
                    name="unit"
                    rules={[{ required: true, message: '请选择单位' }]}
                  >
                    <Select placeholder="请选择单位">
                      {UNITS.map(unit => (
                        <Option key={unit} value={unit}>{unit}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="成本"
                    name="cost"
                    rules={[{ required: true, message: '请输入成本' }]}
                  >
                    <InputNumber min={0} placeholder="成本" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="供应商"
                    name="supplier"
                    rules={[{ required: true, message: '请选择供应商' }]}
                  >
                    <Select placeholder="请选择供应商">
                      {SUPPLIERS.map(supplier => (
                        <Option key={supplier} value={supplier}>{supplier}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="差异"
                    name="variance"
                  >
                    <InputNumber placeholder="差异" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="生命周期"
                    name="lifecycle"
                    rules={[{ required: true, message: '请选择生命周期' }]}
                  >
                    <Select placeholder="请选择生命周期">
                      {LIFECYCLE_STATUSES.map(status => (
                        <Option key={status} value={status}>{status}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="状态"
                    name="itemStatus"
                    rules={[{ required: true, message: '请选择状态' }]}
                  >
                    <Select placeholder="请选择状态">
                      {ITEM_STATUSES.map(status => (
                        <Option key={status} value={status}>{status}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button 
                icon={<CloseOutlined />} 
                onClick={() => {
                  setEditModalVisible(false);
                  setCurrentNode(null);
                  setIsAddingChild(false);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {isAddingChild ? '添加' : '保存'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default BOMTreeEditor;