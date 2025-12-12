import React, { createContext, useContext, useState, useCallback } from 'react';
import { message } from 'antd';
import { BOM_LEVELS } from '../../constants/bomConstants';

// BOM树验证规则
const BOM_VALIDATION_RULES = {
  // 必须有L6层零件
  hasRequiredParts: (treeData) => {
    let hasL6Parts = false;
    const traverse = (nodes) => {
      if (!nodes || !Array.isArray(nodes)) return;
      
      nodes.forEach(node => {
        if (node.level === BOM_LEVELS.L6.level && node.isPart) {
          hasL6Parts = true;
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    
    traverse(treeData);
    return hasL6Parts;
  },
  
  // L6/L7层零件必须有效用量
  hasValidQuantities: (treeData) => {
    let hasInvalidQuantity = false;
    
    const traverse = (nodes) => {
      if (!nodes || !Array.isArray(nodes)) return;
      
      nodes.forEach(node => {
        if (node.level >= BOM_LEVELS.L6.level && node.isPart) {
          if (!node.quantity || node.quantity <= 0) {
            hasInvalidQuantity = true;
          }
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    
    traverse(treeData);
    return !hasInvalidQuantity;
  },
  
  // 检查重复位号
  hasDuplicatePositions: (treeData) => {
    const positions = new Set();
    let hasDuplicate = false;
    
    const traverse = (nodes) => {
      if (!nodes || !Array.isArray(nodes)) return;
      
      nodes.forEach(node => {
        if (node.position) {
          if (positions.has(node.position)) {
            hasDuplicate = true;
          } else {
            positions.add(node.position);
          }
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    
    traverse(treeData);
    return !hasDuplicate;
  }
};

const BOMContext = createContext({
  bomStructure: [],
  updateBOMStructure: () => {},
  validateBOMStructure: () => true,
  getValidationErrors: () => [],
  addBOMNode: () => {},
  removeBOMNode: () => {},
  updateBOMNode: () => {},
  moveBOMNode: () => {},
  autoGeneratePosition: () => {}
});

export const BOMProvider = ({ children }) => {
  const [bomStructure, setBOMStructure] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  // 更新BOM结构
  const updateBOMStructure = useCallback((newStructure) => {
    setBOMStructure(newStructure);
    validateBOMStructure(newStructure);
  }, []);

  // 验证BOM结构（用于全局状态管理，允许随时保存模板）
  const validateBOMStructure = useCallback((structure) => {
    // 允许随时保存模板，即使没有L6零件也返回true
    // 仅在需要严格验证时才检查BOM结构完整性
    return true;
  }, []);
  
  // 严格验证BOM结构（用于发布或提交时）
  const validateBOMStructureStrict = useCallback((structure) => {
    const errors = [];
    
    // 验证规则
    if (!BOM_VALIDATION_RULES.hasRequiredParts(structure)) {
      errors.push('BOM必须包含至少一个L6层零件');
    }
    
    if (!BOM_VALIDATION_RULES.hasValidQuantities(structure)) {
      errors.push('所有零件(L6/L7)的用量必须大于0');
    }
    
    if (!BOM_VALIDATION_RULES.hasDuplicatePositions(structure)) {
      errors.push('存在重复的位号，请检查');
    }
    
    setValidationErrors(errors);
    
    // 返回验证结果
    if (errors.length > 0) {
      console.error('BOM验证失败:', errors);
      return false;
    }
    
    return true;
  }, []);

  // 获取验证错误
  const getValidationErrors = useCallback(() => {
    return validationErrors;
  }, [validationErrors]);

  // 添加BOM节点
  const addBOMNode = useCallback((parentNode, newNode) => {
    if (!parentNode || !newNode) return false;
    
    // 检查节点层级是否正确
    if (parentNode.level >= BOM_LEVELS.L5.level && newNode.level !== parentNode.level + 1) {
      message.error('节点层级关系不正确');
      return false;
    }
    
    // 创建新结构的深拷贝
    const newStructure = JSON.parse(JSON.stringify(bomStructure));
    
    // 查找父节点
    const findAndUpdate = (nodes) => {
      if (!nodes || !Array.isArray(nodes)) return false;
      
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].key === parentNode.key) {
          if (!nodes[i].children) {
            nodes[i].children = [];
          }
          nodes[i].children.push(newNode);
          return true;
        }
        
        if (nodes[i].children && findAndUpdate(nodes[i].children)) {
          return true;
        }
      }
      
      return false;
    };
    
    const success = findAndUpdate(newStructure);
    
    if (success) {
      updateBOMStructure(newStructure);
      return true;
    }
    
    message.error('添加节点失败');
    return false;
  }, [bomStructure, updateBOMStructure]);

  // 删除BOM节点
  const removeBOMNode = useCallback((nodeKey) => {
    if (!nodeKey) return false;
    
    // 创建新结构的深拷贝
    const newStructure = JSON.parse(JSON.stringify(bomStructure));
    
    // 查找并删除节点
    const findAndRemove = (nodes, key) => {
      if (!nodes || !Array.isArray(nodes)) return false;
      
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].key === key) {
          nodes.splice(i, 1);
          return true;
        }
        
        if (nodes[i].children && findAndRemove(nodes[i].children, key)) {
          return true;
        }
      }
      
      return false;
    };
    
    const success = findAndRemove(newStructure, nodeKey);
    
    if (success) {
      updateBOMStructure(newStructure);
      return true;
    }
    
    message.error('删除节点失败');
    return false;
  }, [bomStructure, updateBOMStructure]);

  // 更新BOM节点
  const updateBOMNode = useCallback((nodeKey, updatedData) => {
    if (!nodeKey || !updatedData) return false;
    
    // 创建新结构的深拷贝
    const newStructure = JSON.parse(JSON.stringify(bomStructure));
    
    // 查找并更新节点
    const findAndUpdate = (nodes) => {
      if (!nodes || !Array.isArray(nodes)) return false;
      
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].key === nodeKey) {
          // 合并新数据
          nodes[i] = { ...nodes[i], ...updatedData };
          return true;
        }
        
        if (nodes[i].children && findAndUpdate(nodes[i].children)) {
          return true;
        }
      }
      
      return false;
    };
    
    const success = findAndUpdate(newStructure);
    
    if (success) {
      updateBOMStructure(newStructure);
      return true;
    }
    
    message.error('更新节点失败');
    return false;
  }, [bomStructure, updateBOMStructure]);

  // 移动BOM节点（拖放）
  const moveBOMNode = useCallback((dragKey, dropKey, dropPosition) => {
    // 创建新结构的深拷贝
    const newStructure = JSON.parse(JSON.stringify(bomStructure));
    
    // 查找拖拽节点
    let dragNode = null;
    const findDragNode = (nodes) => {
      if (!nodes || !Array.isArray(nodes)) return;
      
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].key === dragKey) {
          dragNode = nodes[i];
          nodes.splice(i, 1);
          return;
        }
        
        if (nodes[i].children) {
          findDragNode(nodes[i].children);
        }
      }
    };
    
    findDragNode(newStructure);
    
    if (!dragNode) {
      message.error('移动节点失败');
      return false;
    }
    
    // 查找放置位置
    let dropNode = null;
    const findDropNode = (nodes) => {
      if (!nodes || !Array.isArray(nodes)) return;
      
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].key === dropKey) {
          dropNode = nodes[i];
          
          // 处理不同的放置位置
          if (dropPosition === 'inside') {
            // 作为子节点
            if (!dropNode.children) {
              dropNode.children = [];
            }
            // 更新层级
            dragNode.level = dropNode.level + 1;
            dropNode.children.push(dragNode);
          } else if (dropPosition === 'before') {
            // 作为同级前节点
            dragNode.level = dropNode.level;
            nodes.splice(i, 0, dragNode);
          } else if (dropPosition === 'after') {
            // 作为同级后节点
            dragNode.level = dropNode.level;
            nodes.splice(i + 1, 0, dragNode);
          }
          return;
        }
        
        if (nodes[i].children) {
          findDropNode(nodes[i].children);
        }
      }
    };
    
    findDropNode(newStructure);
    
    if (dropNode) {
      updateBOMStructure(newStructure);
      return true;
    }
    
    message.error('移动节点失败');
    return false;
  }, [bomStructure, updateBOMStructure]);

  // 自动生成位号
  const autoGeneratePosition = useCallback((parentNode, nodeType) => {
    if (!parentNode) return '';
    
    // 获取父节点的所有子节点
    let siblings = [];
    if (parentNode.children && Array.isArray(parentNode.children)) {
      siblings = parentNode.children.filter(child => child.isPart);
    }
    
    // 根据节点类型生成前缀
    let prefix = '';
    switch (nodeType) {
      case 'CPU':
        prefix = 'U';
        break;
      case 'Memory':
        prefix = 'M';
        break;
      case 'Storage':
        prefix = 'S';
        break;
      case 'Display':
        prefix = 'D';
        break;
      default:
        prefix = 'R';
    }
    
    // 计算序号
    const nextNumber = siblings.length + 1;
    
    // 如果是L7层（替代料），则基于L6位号生成
    if (parentNode.level === BOM_LEVELS.L6.level) {
      const basePosition = parentNode.position || `${prefix}${nextNumber}`;
      return `${basePosition}.1`;
    }
    
    // 构建层级位号
    let position = '';
    
    // 获取从根节点到当前节点的路径
    const buildPath = (node, targetNode, path = []) => {
      path.push(node);
      
      if (node.key === targetNode.key) {
        return path;
      }
      
      if (node.children) {
        for (const child of node.children) {
          const result = buildPath(child, targetNode, [...path]);
          if (result) {
            return result;
          }
        }
      }
      
      return null;
    };
    
    // 查找从根节点到父节点的路径
    const rootNode = bomStructure.length > 0 ? bomStructure[0] : null;
    if (rootNode) {
      const path = buildPath(rootNode, parentNode);
      if (path && path.length > 0) {
        // 根据层级构建位号
        const levelNames = {
          1: '主板',
          2: 'CPU',
          3: 'R1',
          4: 'C1',
          5: 'R2',
          6: 'C2'
        };
        
        // 构建层级位号
        const levelPositions = path.map((node, index) => {
          if (index === 0) return levelNames[node.level] || `L${node.level}`;
          
          // 对于L6/L7层，使用零件类型前缀+序号
          if (node.level >= 6) {
            const nodeType = node.nodeType || node.title.split(' ')[0];
            let nodePrefix = '';
            switch (nodeType) {
              case 'CPU':
                nodePrefix = 'U';
                break;
              case 'Memory':
                nodePrefix = 'M';
                break;
              case 'Storage':
                nodePrefix = 'S';
                break;
              case 'Display':
                nodePrefix = 'D';
                break;
              default:
                nodePrefix = 'R';
            }
            
            // 获取同级节点数量
            const parentPath = path.slice(0, index);
            const parent = parentPath[parentPath.length - 1];
            const siblings = parent.children ? parent.children.filter(child => child.isPart) : [];
            const nodeNumber = siblings.findIndex(sibling => sibling.key === node.key) + 1;
            
            return `${nodePrefix}${nodeNumber}`;
          }
          
          return levelNames[node.level] || `L${node.level}`;
        });
        
        position = levelPositions.join('-');
      }
    }
    
    // 如果无法构建层级位号，则使用简单的位号格式
    if (!position) {
      position = `${prefix}${nextNumber}`;
    }
    
    return position;
  }, [bomStructure]);

  const contextValue = {
    bomStructure,
    updateBOMStructure,
    validateBOMStructure,
    validateBOMStructureStrict,
    getValidationErrors,
    addBOMNode,
    removeBOMNode,
    updateBOMNode,
    moveBOMNode,
    autoGeneratePosition
  };

  return (
    <BOMContext.Provider value={contextValue}>
      {children}
    </BOMContext.Provider>
  );
};

export const useBOMContext = () => {
  const context = useContext(BOMContext);
  
  if (!context) {
    throw new Error('useBOMContext must be used within a BOMProvider');
  }
  
  return context;
};

export default BOMContext;