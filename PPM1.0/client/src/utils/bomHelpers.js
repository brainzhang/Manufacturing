// BOM辅助工具函数

// BOM节点数据模型创建函数
export const createBOMNode = (config) => ({
  id: config.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  parentId: config.parentId || null,
  level: config.level,
  position: config.position || '',
  materialName: config.materialName || '',
  quantity: config.quantity || 1,
  unit: config.unit || '个',
  cost: config.cost || 0,
  supplier: config.supplier || '',
  variance: config.variance || 0,
  lifecycle: config.lifecycle || '量产',
  status: config.status || 'Active',
  nodeType: config.nodeType || (config.level === BOM_LEVELS.L6.level ? '主料' : config.level === BOM_LEVELS.L7.level ? '替代料' : '父'),
  partId: config.partId,
  substituteGroup: config.substituteGroup,
  children: config.children || [],
  title: config.title || `节点`,
  key: config.key || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
});

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

// 获取层级颜色
export const getLevelColor = (level) => {
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

// 扁平化BOM树数据
export const flattenBOMTree = (nodes, parentPath = []) => {
  let result = [];
  
  const traverse = (nodeList, path) => {
    nodeList.forEach(node => {
      const currentPath = [...path, node.title];
      const row = {
        ...node,
        path: currentPath.join(' > '),
        levelName: BOM_LEVELS[`L${node.level}`].name
      };
      
      result.push(row);
      
      if (node.children && node.children.length > 0) {
        traverse(node.children, currentPath);
      }
    });
  };
  
  traverse(nodes, parentPath);
  return result;
};

// 计算BOM成本
export const calculateBOMCost = (flatData) => {
  let totalCost = 0;
  const supplierSet = new Set(); // 用于去重统计供应商
  
  flatData.forEach(item => {
    // 只统计活跃状态的非替代料成本
    if (item.level === BOM_LEVELS.L6.level && item.status === 'Active') {
      const itemCost = (item.cost || 0) * (item.quantity || 1);
      totalCost += itemCost;
      
      // 统计供应商（去重）
      if (item.supplier) {
        supplierSet.add(item.supplier);
      }
    }
  });
  
  return {
    totalCost,
    supplierCount: supplierSet.size,
    totalParts: flatData.filter(item => item.level === BOM_LEVELS.L6.level).length,
    activeParts: flatData.filter(item => item.level === BOM_LEVELS.L6.level && item.status === 'Active').length,
    alternativeParts: flatData.filter(item => item.level === BOM_LEVELS.L7.level).length
  };
};

// 生成位号
export const generatePosition = (level, parentPosition, suffix = '') => {
  if (!parentPosition) return '';
  
  switch (level) {
    case BOM_LEVELS.L1.level:
      return '1';
    case BOM_LEVELS.L2.level:
      return `${parentPosition}.${Math.floor(Math.random() * 9) + 1}`;
    case BOM_LEVELS.L3.level:
      return `${parentPosition}.${Math.floor(Math.random() * 9) + 1}`;
    case BOM_LEVELS.L4.level:
      return `${parentPosition}.${Math.floor(Math.random() * 9) + 1}`;
    case BOM_LEVELS.L5.level:
      return `${parentPosition}.${Math.floor(Math.random() * 9) + 1}`;
    case BOM_LEVELS.L6.level:
      // L6层级使用字母标识：U(元件), M(模块), S(存储)等
      const prefix = suffix || 'U'; // 默认为U(元件)
      return `${prefix}1.A`;
    case BOM_LEVELS.L7.level:
      // L7层级是替代料，基于L6位号添加后缀
      return `${parentPosition}.${suffix || 'A'}`;
    default:
      return '';
  }
};

// 验证BOM结构
export const validateBOMStructure = (treeData) => {
  let hasL6Parts = false;
  let positionConflicts = [];
  const positions = new Set();
  
  const traverse = (nodes) => {
    nodes.forEach(node => {
      // 检查位号冲突
      if (node.position && positions.has(node.position)) {
        positionConflicts.push({
          title: node.title,
          position: node.position,
          conflict: true
        });
      } else if (node.position) {
        positions.add(node.position);
      }
      
      if (node.level === BOM_LEVELS.L6.level && node.status === 'Active') {
        hasL6Parts = true;
      }
      
      if (node.children) {
        traverse(node.children);
      }
    });
  };
  
  traverse(treeData);
  
  return {
    hasL6Parts,
    positionConflicts,
    isValid: hasL6Parts && positionConflicts.length === 0,
    errors: [
      !hasL6Parts ? '必须至少包含一个活跃的L6主料' : null,
      positionConflicts.length > 0 ? `发现${positionConflicts.length}个位号冲突` : null
    ].filter(Boolean)
  };
};

// 根据节点键查找节点
export const findNodeByKey = (nodes, key) => {
  let foundNode = null;
  
  const traverse = (nodeList) => {
    for (const node of nodeList) {
      if (node.key === key) {
        foundNode = node;
        return true;
      }
      
      if (node.children && node.children.length > 0) {
        if (traverse(node.children)) {
          return true;
        }
      }
    }
    return false;
  };
  
  traverse(nodes);
  return foundNode;
};

// 更新节点
export const updateNode = (nodes, key, updates) => {
  const updateNodeRecursive = (nodeList) => {
    return nodeList.map(node => {
      if (node.key === key) {
        return { ...node, ...updates };
      }
      
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: updateNodeRecursive(node.children)
        };
      }
      
      return node;
    });
  };
  
  return updateNodeRecursive(nodes);
};

// 删除节点
export const deleteNode = (nodes, key) => {
  const deleteNodeRecursive = (nodeList) => {
    return nodeList.reduce((result, node) => {
      if (node.key === key) {
        // 不添加要删除的节点
        return result;
      }
      
      if (node.children && node.children.length > 0) {
        return [
          ...result,
          {
            ...node,
            children: deleteNodeRecursive(node.children)
          }
        ];
      }
      
      return [...result, node];
    }, []);
  };
  
  return deleteNodeRecursive(nodes);
};

// 添加子节点
export const addChildNode = (nodes, parentKey, newNode) => {
  const addChildNodeRecursive = (nodeList) => {
    return nodeList.map(node => {
      if (node.key === parentKey) {
        return {
          ...node,
          children: [
            ...(node.children || []),
            {
              ...newNode,
              parentId: parentKey,
              key: newNode.key || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }
          ]
        };
      }
      
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: addChildNodeRecursive(node.children)
        };
      }
      
      return node;
    });
  };
  
  return addChildNodeRecursive(nodes);
};

// 计算成本差异百分比
export const calculateVariance = (newCost, originalCost) => {
  if (!originalCost || originalCost === 0) return 0;
  return ((newCost - originalCost) / originalCost * 100).toFixed(2);
};