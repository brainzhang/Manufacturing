import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Tree, Dropdown, Menu, message, Input, Spin } from 'antd';
import { DeleteOutlined, EditOutlined, CheckOutlined, ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import styles from './DiffTree.module.css?inline';

const { Search } = Input;

// 差异类型定义
export type DiffType = 'ADD' | 'DELETE' | 'LIFE_CYCLE' | 'COST' | 'COMPLIANCE' | 'FIXED';

// 差异节点接口
interface DiffNode extends DataNode {
  key: string;
  title: string;
  diffType?: DiffType;
  children?: DiffNode[];
}

interface DiffTreeProps {
  data: DiffNode[];
  onNodeClick: (key: string) => void;
  onFixBranch: (key: string) => void;
  loading?: boolean;
}

const DiffTree: React.FC<DiffTreeProps> = ({ data = [], onNodeClick, onFixBranch, loading = false }) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [filteredData, setFilteredData] = useState<DiffNode[]>([]);

  // 递归处理展开的节点，只展开含有差异的节点（L4级别及以上）
  const getExpandedDiffNodes = useCallback((nodes: DiffNode[], level: number = 0): string[] => {
    let keys: string[] = [];
    
    nodes.forEach(node => {
      // L4级别及以上，或者有差异的节点自动展开
      if (level <= 4 || node.diffType) {
        keys.push(node.key);
      }
      
      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        keys = [...keys, ...getExpandedDiffNodes(node.children, level + 1)];
      }
    });
    
    return keys;
  }, []);
  
  // 搜索过滤功能
  const filterTreeData = useCallback((nodes: DiffNode[], searchTerm: string): DiffNode[] => {
    if (!searchTerm.trim()) return nodes;
    
    const filteredNodes: DiffNode[] = [];
    
    const recursiveFilter = (items: DiffNode[], isParentMatched: boolean = false): DiffNode[] => {
      return items.reduce<DiffNode[]>((acc, item) => {
        const isMatched = isParentMatched || 
          (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.key && item.key.toLowerCase().includes(searchTerm.toLowerCase()));
          
        let filteredChildren: DiffNode[] = [];
        if (item.children && item.children.length > 0) {
          filteredChildren = recursiveFilter(item.children, isMatched);
        }
        
        if (isMatched || filteredChildren.length > 0) {
          acc.push({
            ...item,
            children: filteredChildren,
            // 搜索匹配的节点自动展开
            key: item.key,
          });
        }
        
        return acc;
      }, []);
    };
    
    return recursiveFilter(nodes);
  }, []);

  // 获取节点的样式类名（使用useMemo缓存）
  const getNodeClassName = useCallback((node: DiffNode): string => {
    const baseClass = styles.node;
    
    if (!node.diffType) return baseClass;
    
    switch (node.diffType) {
      case 'ADD':
      case 'DELETE':
        return `${baseClass} ${styles.structureDiff}`;
      case 'LIFE_CYCLE':
      case 'COST':
      case 'COMPLIANCE':
        return `${baseClass} ${styles.propertyDiff}`;
      case 'FIXED':
        return `${baseClass} ${styles.fixedDiff}`;
      default:
        return baseClass;
    }
  }, []);

  // 获取节点图标（使用useCallback缓存）
  const getNodeIcon = useCallback((node: DiffNode) => {
    if (!node.diffType) return null;
    
    switch (node.diffType) {
      case 'ADD':
      case 'DELETE':
        return <ExclamationCircleOutlined className={styles.structureIcon} />;
      case 'LIFE_CYCLE':
      case 'COST':
      case 'COMPLIANCE':
        return <EditOutlined className={styles.propertyIcon} />;
      case 'FIXED':
        return <CheckOutlined className={styles.fixedIcon} />;
      default:
        return null;
    }
  }, []);

  // 处理修复分支（使用useCallback缓存）
  const handleFixBranch = useCallback((key: string) => {
    onFixBranch(key);
    message.success(`正在修复分支: ${key}`);
  }, [onFixBranch]);

  // 处理忽略差异（使用useCallback缓存）
  const handleIgnoreDiff = useCallback((key: string) => {
    message.info(`已忽略差异: ${key}`);
    // 这里可以添加忽略差异的逻辑
  }, []);

  // 处理节点点击（使用useCallback缓存）
  const handleClick = useCallback((e: React.MouseEvent, info: any) => {
    setSelectedKeys(info.selectedKeys);
    onNodeClick(info.node.key as string);
  }, [onNodeClick]);

  // 自定义节点渲染（使用memo优化）
  const renderTreeNode = useCallback((node: DiffNode) => {
    // 右键菜单项
    const menuItems = [
      {
        key: 'fix',
        label: '一键修复此分支',
        icon: <CheckOutlined />,
        onClick: () => handleFixBranch(node.key),
      },
      {
        key: 'ignore',
        label: '忽略此差异',
        icon: <ExclamationCircleOutlined />,
        onClick: () => handleIgnoreDiff(node.key),
      },
    ];

    return (
      <Dropdown 
        menu={{ items: menuItems }}
        trigger={['contextMenu']}
        arrow
      >
        <span className={getNodeClassName(node)}>
          {getNodeIcon(node)}
          <span className={styles.nodeText}>
            {searchValue && node.title && node.title.toLowerCase().includes(searchValue.toLowerCase()) 
              ? (
                <span>
                  {node.title.split(new RegExp(`(${searchValue})`, 'gi')).map((part, index) => 
                    part.toLowerCase() === searchValue.toLowerCase() 
                      ? <span key={index} className={styles.highlight}>{part}</span> 
                      : part
                  )}
                </span>
              ) 
              : node.title
            }
          </span>
        </span>
      </Dropdown>
    );
  }, [getNodeClassName, getNodeIcon, searchValue, handleFixBranch, handleIgnoreDiff]);
  
  // 处理搜索
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
  }, []);
  
  // 处理清除搜索
  const handleClearSearch = useCallback(() => {
    setSearchValue('');
  }, []);

  // 初始化时计算需要展开的节点
  useEffect(() => {
    const expandedDiffKeys = getExpandedDiffNodes(data);
    setExpandedKeys(expandedDiffKeys);
  }, [data, getExpandedDiffNodes]);
  
  // 根据搜索值过滤数据
  useEffect(() => {
    const filtered = filterTreeData(data, searchValue);
    setFilteredData(filtered);
    
    // 如果有搜索值，展开所有匹配的节点
    if (searchValue) {
      const expandedKeysForSearch = getExpandedDiffNodes(filtered);
      setExpandedKeys(expandedKeysForSearch);
    } else {
      const defaultExpandedKeys = getExpandedDiffNodes(data);
      setExpandedKeys(defaultExpandedKeys);
    }
  }, [data, searchValue, filterTreeData, getExpandedDiffNodes]);
  
  // 使用useMemo优化Tree组件的props
  const treeProps = useMemo(() => ({
    className: styles.tree,
    showLine: true,
    showIcon: false,
    defaultExpandAll: false,
    expandedKeys,
    selectedKeys,
    onExpand: (keys) => setExpandedKeys(keys as string[]),
    onClick: handleClick,
    treeData: filteredData.length > 0 ? filteredData : data,
    titleRender: renderTreeNode,
    virtual: true, // 启用虚拟滚动
    height: 600, // 设置虚拟滚动的高度
  }), [expandedKeys, selectedKeys, handleClick, renderTreeNode, filteredData, data]);

  return (
    <div className={styles.diffTreeContainer}>
      <h3 className={styles.treeTitle}>差异树结构</h3>
      
      {/* 搜索框 */}
      <div className={styles.searchContainer}>
        <Search
          placeholder="搜索位号或零件名称"
          allowClear
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          onClear={handleClearSearch}
          style={{ marginBottom: 12 }}
          size="small"
          prefix={<SearchOutlined />}
        />
      </div>
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDotStructure}>●</span>
          <span>结构差异</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDotProperty}>●</span>
          <span>属性差异</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDotFixed}>●</span>
          <span>已修复</span>
        </div>
      </div>
      
      <div className={styles.treeWrapper}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" tip="加载中..." />
          </div>
        ) : (
          <Tree {...treeProps} />
        )}
        
        {/* 搜索无结果提示 */}
        {!loading && searchValue && filteredData.length === 0 && (
          <div className={styles.emptyContainer}>
            <p>未找到匹配的差异项</p>
          </div>
        )}
      </div>
      
      <div className={styles.treeFooter}>
        <p className={styles.hint}>单击节点定位到表格行 | 右键节点显示操作菜单</p>
      </div>
    </div>
  );
};

export default DiffTree;