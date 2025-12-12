import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Tree, 
  Button, 
  Input, 
  Select, 
  Space, 
  Form, 
  Table, 
  Drawer, 
  Modal,
  message,
  Divider,
  Typography,
  Tag,
  Empty
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  SearchOutlined,
  DragOutlined,
  SaveOutlined,
  FormOutlined
} from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BOM_LEVELS } from '../../constants/bomConstants';
import { useBOMContext } from '../context/BOMContext';
import PartsSearchDrawer from '../components/PartsSearchDrawer';
import PartEditForm from '../components/PartEditForm';
import { calculateStatistics, checkMissingParts } from '../../utils/bomUtils';

const { Title, Text } = Typography;
const { Option } = Select;
const { DirectoryTree } = Tree;
const { TreeNode } = Tree;

// 拖拽类型常量
const ItemTypes = {
  TREE_NODE: 'treeNode',
  PART_ITEM: 'partItem'
};

// 可拖拽的树节点组件
const DraggableTreeNode = ({ node, onDrop, onDelete, onEdit, isParent }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TREE_NODE,
    item: { node },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ canDrop, isOver }, drop] = useDrop({
    accept: ItemTypes.TREE_NODE,
    drop: (item) => onDrop(item.node, node),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const opacity = isDragging ? 0.5 : 1;
  const backgroundColor = isOver ? '#e6f7ff' : undefined;

  const nodeTitle = (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '4px 8px',
      backgroundColor,
      opacity,
      borderRadius: 4
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isParent ? <DragOutlined style={{ marginRight: 8 }} /> : ''}
        <span>{node.title}</span>
        {node.level >= BOM_LEVELS.L6.level && (
          <Tag color={node.level === BOM_LEVELS.L6.level ? 'blue' : 'green'} style={{ marginLeft: 8 }}>
            {Object.values(BOM_LEVELS).find(l => l.level === node.level)?.name}
          </Tag>
        )}
      </div>
      
      <Space size="small">
        {node.level >= BOM_LEVELS.L6.level && (
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(node)}
          />
        )}
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(node.key)}
        />
      </Space>
    </div>
  );

  return (
    <div ref={drop} style={{ width: '100%' }}>
      {isParent ? (
        <TreeNode
          title={nodeTitle}
          key={node.key}
          dataRef={node}
        >
          {node.children && node.children.map(child => (
            <DraggableTreeNode
              key={child.key}
              node={child}
              onDrop={onDrop}
              onDelete={onDelete}
              onEdit={onEdit}
              isParent={child.isParentNode}
              ref={drag}
            />
          ))}
        </TreeNode>
      ) : (
        <TreeNode
          title={nodeTitle}
          key={node.key}
          dataRef={node}
          isLeaf
          ref={drag}
        />
      )}
    </div>
  );
};

// 初始BOM树结构
const initialBOMTree = [
  {
    key: 'manual-root',
    title: 'BOM根节点',
    level: BOM_LEVELS.L1.level,
    isParentNode: true,
    children: [
      {
        key: 'manual-module-1',
        title: '模块1',
        level: BOM_LEVELS.L2.level,
        isParentNode: true,
        children: [
          {
            key: 'manual-submodule-1',
            title: '子模块1',
            level: BOM_LEVELS.L3.level,
            isParentNode: true,
            children: [
              {
                key: 'manual-family-1',
                title: '零件族1',
                level: BOM_LEVELS.L4.level,
                isParentNode: true,
                children: [
                  {
                    key: 'manual-group-1',
                    title: '零件组1',
                    level: BOM_LEVELS.L5.level,
                    isParentNode: true,
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

const ManualBuildTab = ({ onStructureChange, checkMissingParts }) => {
  // 状态管理
  const { 
    bomStructure, 
    updateBOMStructure, 
    validateBOMStructure, 
    addBOMNode, 
    removeBOMNode, 
    updateBOMNode, 
    moveBOMNode, 
    autoGeneratePosition 
  } = useBOMContext();
  
  const [bomTree, setBomTree] = useState(bomStructure.length > 0 ? bomStructure : initialBOMTree);
  const [expandedKeys, setExpandedKeys] = useState(['manual-root', 'manual-module-1', 'manual-submodule-1', 'manual-family-1', 'manual-group-1']);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [showPartsDrawer, setShowPartsDrawer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [editForm] = Form.useForm();
  
  // 当BOM结构变化时，更新本地状态
  useEffect(() => {
    if (bomStructure.length > 0) {
      setBomTree(bomStructure);
    }
  }, [bomStructure]);
  
  // 更新BOM树结构
  const updateTree = useCallback((newTree) => {
    setBomTree(newTree);
    updateBOMStructure(newTree);
    
    // 计算总成本
    const totalCost = calculateTotalCost(newTree);
    
    // 提取零件数据
    const extractParts = (nodes, level = 0) => {
      const parts = [];
      nodes.forEach(node => {
        if (node.isPart) {
          parts.push({
            partId: node.id,
            part_name: node.title,
            cost: node.cost || 0,
            quantity: node.quantity || 1,
            status: 'ACTIVE',
            nodeType: 'PRIMARY',
            position: node.position || '',
            level: level
          });
        }
        if (node.children && node.children.length > 0) {
          parts.push(...extractParts(node.children, level + 1));
        }
      });
      return parts;
    };
    
    const parts = extractParts(newTree);
    
    // 通知父组件，传递统一的数据结构
    if (onStructureChange) {
      // 检查onStructureChange期望的参数格式
      const updateData = {
        treeData: newTree,
        totalCost: totalCost,
        parts: parts,
        data: newTree, // 为了兼容旧的代码，同时保留data字段
        isValid: true,
        sourceType: 'manual'
      };
      
      console.log('ManualBuildTab - 传递给父组件的数据:', {
        totalCost: updateData.totalCost,
        partsCount: updateData.parts.length,
        treeDataLength: updateData.treeData.length
      });
      
      onStructureChange(updateData);
    }
  }, [updateBOMStructure, onStructureChange]);
  
  // 处理节点拖放
  const handleNodeDrop = (dragNode, dropNode) => {
    // 检查拖放规则
    if (dragNode.level < dropNode.level) {
      // 只能向下拖放或同级拖放
      if (dropNode.level - dragNode.level > BOM_LEVELS.L1.level) {
        message.warning('只能拖放到相邻层级');
        return;
      }
    }
    
    // 不能将父节点拖放到子节点内
    if (dragNode.children && dragNode.children.length > 0) {
      if (isChildOf(dropNode, dragNode)) {
        message.warning('不能将父节点拖放到子节点内');
        return;
      }
    }
    
    // 执行移动操作
    const newTree = JSON.parse(JSON.stringify(bomTree));
    const success = moveBOMNode(dragNode.key, dropNode.key, 'inside');
    
    if (success) {
      setBomTree(bomStructure);
    }
  };
  
  // 检查是否为子节点
  const isChildOf = (child, parent) => {
    const checkChildren = (nodes) => {
      for (const node of nodes) {
        if (node.key === child.key) {
          return true;
        }
        if (node.children && checkChildren(node.children)) {
          return true;
        }
      }
      return false;
    };
    
    return parent.children ? checkChildren(parent.children) : false;
  };
  
  // 添加节点
  const handleAddNode = () => {
    if (selectedKeys.length === 0) {
      message.warning('请选择一个父节点');
      return;
    }
    
    const parentKey = selectedKeys[0];
    const parentNode = findNodeByKey(bomTree, parentKey);
    
    if (!parentNode) {
      message.error('找不到父节点');
      return;
    }
    
    // 检查父节点层级
    if (parentNode.level >= BOM_LEVELS.L6.level) {
      message.warning(`L${BOM_LEVELS.L6.level}/L${BOM_LEVELS.L7.level}层不能再添加子节点`);
      return;
    }
    
    // 显示零件搜索抽屉
    setShowPartsDrawer(true);
  };
  
  // 查找节点
  const findNodeByKey = (nodes, key) => {
    for (const node of nodes) {
      if (node.key === key) {
        return node;
      }
      if (node.children) {
        const found = findNodeByKey(node.children, key);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };
  
  // 删除节点
  const handleDeleteNode = (nodeKey) => {
    const node = findNodeByKey(bomTree, nodeKey);
    
    if (!node) {
      message.error('找不到节点');
      return;
    }
    
    // 不能删除L1-L5的父节点
    if (node.level <= BOM_LEVELS.L5.level) {
      message.warning(`不能删除L1-L${BOM_LEVELS.L5.level}的父节点`);
      return;
    }
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除节点 "${node.title}" 吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        removeBOMNode(nodeKey);
        setBomTree(bomStructure);
        
        // 重新计算统计信息
        const statistics = calculateStatistics(bomStructure);
        
        // 检查缺失件
        const missingParts = checkMissingParts(bomStructure);
        
        // 如果有缺失件，显示警告
        if (missingParts && missingParts.count > 0) {
          message.warning(`发现 ${missingParts.count} 个缺失件，请检查BOM结构`);
        }
        
        message.success('节点删除成功');
      }
    });
  };
  
  // 编辑节点
  const handleEditNode = (node) => {
    setSelectedNode(node);
    editForm.setFieldsValue({
      title: node.title,
      position: node.position,
      quantity: node.quantity,
      unit: node.unit,
      cost: node.cost,
      supplier: node.supplier,
      lifecycle: node.lifecycle
    });
    setShowEditModal(true);
  };
  
  // 保存编辑
  const handleSaveEdit = () => {
    if (!selectedNode || !editForm) {
      message.warning('请先选择要编辑的节点');
      return;
    }
    
    editForm.validateFields().then(values => {
      // 更新节点数据
      const updatedNode = {
        ...selectedNode,
        ...values
      };
      
      updateBOMNode(selectedNode.key, values);
      setBomTree(bomStructure);
      
      // 重新计算统计信息
      const statistics = calculateStatistics(bomStructure);
      
      // 检查缺失件
      const missingParts = checkMissingParts(bomStructure);
      
      // 如果有缺失件，显示警告
      if (missingParts && missingParts.count > 0) {
        message.warning(`发现 ${missingParts.count} 个缺失件，请检查BOM结构`);
      }
      
      setShowEditModal(false);
      
      message.success('节点信息更新成功');
    });
  };
  
  // 添加零件
  const handleAddPart = (part) => {
    if (selectedKeys.length === 0) {
      message.warning('请选择一个父节点');
      return;
    }
    
    const parentKey = selectedKeys[0];
    const parentNode = findNodeByKey(bomTree, parentKey);
    
    if (!parentNode) {
      message.error('找不到父节点');
      return;
    }
    
    // 确定新节点的层级
    const newNodeLevel = parentNode.level + 1;
    
    // 创建新节点
    const newNode = {
      key: `manual-part-${Date.now()}`,
      title: part.name,
      position: autoGeneratePosition(parentNode, part.type) || `AUTO-${Date.now()}`,
      level: newNodeLevel,
      isPart: newNodeLevel >= BOM_LEVELS.L6.level,
      isParentNode: newNodeLevel < BOM_LEVELS.L6.level,
      quantity: part.quantity || 1,
      unit: part.unit || '个',
      cost: part.cost || 0,
      supplier: part.supplier || '未知',
      lifecycle: part.lifecycle || '量产',
      children: []
    };
    
    // 添加节点
    addBOMNode(parentNode, newNode);
    setBomTree(bomStructure);
    
    // 重新计算统计信息
    const statistics = calculateStatistics(bomStructure);
    
    // 检查缺失件
    const missingParts = checkMissingParts(bomStructure);
    
    // 如果有缺失件，显示警告
    if (missingParts && missingParts.count > 0) {
      message.warning(`发现 ${missingParts.count} 个缺失件，请检查BOM结构`);
    }
    
    // 展开父节点
    setExpandedKeys([...expandedKeys, parentKey]);
  };
  
  // 统计函数
  const countParts = (nodes) => {
    let count = 0;
    const traverse = (nodeList) => {
      nodeList.forEach(node => {
        if (node.isPart) {
          count++;
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return count;
  };
  
  const calculateTotalCost = (nodes) => {
    let totalCost = 0;
    const traverse = (nodeList) => {
      nodeList.forEach(node => {
        if (node.isPart && node.cost && node.quantity) {
          totalCost += node.cost * node.quantity;
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return totalCost;
  };
  
  const countSuppliers = (nodes) => {
    const suppliers = new Set();
    const traverse = (nodeList) => {
      nodeList.forEach(node => {
        if (node.isPart && node.supplier) {
          suppliers.add(node.supplier);
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return suppliers.size;
  };
  
  const countAlternatives = (nodes) => {
    let count = 0;
    const traverse = (nodeList) => {
      nodeList.forEach(node => {
        if (node.level === BOM_LEVELS.L7.level) {
          count++;
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return count;
  };
  
  // 渲染树
  const renderTree = () => {
    if (bomTree.length === 0) {
      return <Empty description="暂无BOM数据" />;
    }
    
    return bomTree.map(rootNode => (
      <DraggableTreeNode
        key={rootNode.key}
        node={rootNode}
        onDrop={handleNodeDrop}
        onDelete={handleDeleteNode}
        onEdit={handleEditNode}
        isParent={rootNode.isParentNode}
      />
    ));
  };
  
  // 渲染属性面板
  const renderPropertyPanel = () => {
    if (selectedKeys.length === 0) {
      return (
        <Card title="属性面板" size="small">
          <Empty description="请选择一个节点查看属性" />
        </Card>
      );
    }
    
    const selectedNode = findNodeByKey(bomTree, selectedKeys[0]);
    
    if (!selectedNode) {
      return (
        <Card title="属性面板" size="small">
          <Empty description="找不到选中的节点" />
        </Card>
      );
    }
    
    return (
      <Card title={`属性面板 - ${selectedNode.title}`} size="small">
        <Form layout="vertical" disabled>
          <Form.Item label="节点层级">
            <Input value={Object.values(BOM_LEVELS).find(l => l.level === selectedNode.level)?.name} />
          </Form.Item>
          <Form.Item label="位号">
            <Input value={selectedNode.position || '-'} />
          </Form.Item>
          {selectedNode.isPart && (
            <>
              <Form.Item label="用量">
                <Input value={selectedNode.quantity || 0} />
              </Form.Item>
              <Form.Item label="单位">
                <Input value={selectedNode.unit || '个'} />
              </Form.Item>
              <Form.Item label="成本">
                <Input value={`¥${(selectedNode.cost || 0).toFixed(2)}`} />
              </Form.Item>
              <Form.Item label="供应商">
                <Input value={selectedNode.supplier || '-'} />
              </Form.Item>
              <Form.Item label="生命周期">
                <Input value={selectedNode.lifecycle || '-'} />
              </Form.Item>
            </>
          )}
        </Form>
      </Card>
    );
  };
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: 16 }}>
        <Title level={3}>手动构建BOM</Title>
        <Text type="secondary">通过拖放和添加零件的方式手动构建BOM树结构</Text>
        
        <Row gutter={16} style={{ marginTop: 16 }}>
          {/* 左侧操作面板 */}
          <Col span={5}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddNode}
                disabled={selectedKeys.length === 0}
              >
                添加零件
              </Button>
              <Button 
                icon={<FormOutlined />} 
                onClick={() => setShowPartsDrawer(true)}
              >
                零件搜索
              </Button>
            </Space>
            
            <Divider />
            
            {/* 统计模块 */}
            <Card title="BOM统计" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={8}>
                <Col span={12}>
                  <Statistic
                    title="总零件数"
                    value={countParts(bomTree)}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="总成本"
                    value={calculateTotalCost(bomTree)}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
              </Row>
              <Row gutter={8} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Statistic
                    title="供应商数"
                    value={countSuppliers(bomTree)}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="替代料数"
                    value={countAlternatives(bomTree)}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
              </Row>
            </Card>
            
            {/* BOM结构模块 - 移除不准确的层级结构预览 */}
            
            <Divider />
            
            {renderPropertyPanel()}
          </Col>
          
          {/* 中间BOM树 - 扩展宽度到边框位置 */}
          <Col span={19}>
            <Card title="BOM结构树" extra={
              <Space>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={() => {
                    const isValid = validateBOMStructure(bomTree);
                    if (isValid) {
                      message.success('BOM结构验证通过');
                    } else {
                      message.error('BOM结构验证失败');
                    }
                  }}
                >
                  验证结构
                </Button>
              </Space>
            }>
              <Tree
                treeData={bomTree}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                onExpand={setExpandedKeys}
                onSelect={setSelectedKeys}
                showIcon
                draggable
                onDrop={(info) => {
                  const dropNode = info.node;
                  const dragNode = info.dragNode;
                  handleNodeDrop(dragNode, dropNode);
                }}
              >
                {renderTree()}
              </Tree>
            </Card>
          </Col>
        </Row>
        
        {/* 零件搜索抽屉 */}
        <PartsSearchDrawer
          open={showPartsDrawer}
          onClose={() => setShowPartsDrawer(false)}
          onAddPart={handleAddPart}
          checkMissingParts={checkMissingParts}
        />
        
        {/* 编辑弹窗 */}
        <Modal
          title="编辑零件"
          open={showEditModal}
          onOk={handleSaveEdit}
          onCancel={() => setShowEditModal(false)}
          width={600}
        >
          <PartEditForm
            form={editForm}
            initialValues={selectedNode}
          />
        </Modal>
      </div>
    </DndProvider>
  );
};

export default ManualBuildTab;