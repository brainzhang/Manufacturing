import React, { useRef, useState, useEffect, useCallback } from 'react';
import { debounce } from '../../utils/performanceUtils';

/**
 * 虚拟滚动列表组件
 * 用于高效渲染大型列表数据，只渲染可视区域内的项目
 */
const VirtualList = ({ 
  data = [],
  itemHeight = 40,
  containerHeight = 400,
  overscan = 3,
  renderItem,
  keyExtractor,
  className = '',
  itemClassName = '',
  loading = false,
  emptyText = '暂无数据',
  onScroll,
  onVisibleItemsChange,
  ...rest
}) => {
  // 容器引用
  const containerRef = useRef(null);
  // 列表项引用Map
  const itemRefs = useRef(new Map());
  // 滚动位置状态
  const [scrollTop, setScrollTop] = useState(0);
  // 实际渲染项的缓存
  const [renderedItems, setRenderedItems] = useState([]);
  // 上次滚动时间戳
  const lastScrollRef = useRef(0);
  // 可见项变更节流
  const throttledVisibleItemsChange = useRef();
  
  // 计算总高度
  const totalHeight = data.length * itemHeight;
  // 可见项数量
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  // 起始索引
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  // 结束索引
  const endIndex = Math.min(
    data.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  // 实际渲染的项
  const visibleItems = data.slice(startIndex, endIndex + 1);
  // 偏移量
  const offsetY = startIndex * itemHeight;
  
  // 初始化可见项变更节流函数
  useEffect(() => {
    throttledVisibleItemsChange.current = debounce((items) => {
      if (onVisibleItemsChange) {
        onVisibleItemsChange(items);
      }
    }, 100);
  }, [onVisibleItemsChange]);
  
  // 更新渲染项和通知可见项变更
  useEffect(() => {
    setRenderedItems(visibleItems);
    
    // 通知可见项变更
    if (onVisibleItemsChange && visibleItems.length > 0) {
      throttledVisibleItemsChange.current({
        items: visibleItems,
        startIndex,
        endIndex
      });
    }
  }, [visibleItems, startIndex, endIndex, onVisibleItemsChange]);
  
  // 处理滚动事件
  const handleScroll = useCallback(
    debounce((e) => {
      const currentScrollTop = e.target.scrollTop;
      setScrollTop(currentScrollTop);
      
      // 调用外部滚动回调
      if (onScroll) {
        const currentTime = Date.now();
        const deltaTime = currentTime - lastScrollRef.current;
        const deltaY = currentScrollTop - scrollTop;
        
        onScroll({
          scrollTop: currentScrollTop,
          deltaY,
          deltaTime,
          scrollDirection: deltaY > 0 ? 'down' : deltaY < 0 ? 'up' : 'none'
        });
        
        lastScrollRef.current = currentTime;
      }
    }, 16), // ~60fps
    [scrollTop, onScroll]
  );
  
  // 设置项引用
  const setItemRef = useCallback((id, ref) => {
    if (id) {
      if (ref) {
        itemRefs.current.set(id, ref);
      } else {
        itemRefs.current.delete(id);
      }
    }
  }, []);
  
  // 滚动到指定项
  const scrollToItem = useCallback((index, options = {}) => {
    const {
      align = 'center', // 'start', 'center', 'end'
      offset = 0
    } = options;
    
    if (containerRef.current && index >= 0 && index < data.length) {
      let targetScrollTop = index * itemHeight;
      
      // 根据对齐方式调整
      switch (align) {
        case 'center':
          targetScrollTop -= containerHeight / 2 - itemHeight / 2;
          break;
        case 'end':
          targetScrollTop -= containerHeight - itemHeight;
          break;
        case 'start':
        default:
          break;
      }
      
      // 应用偏移
      targetScrollTop += offset;
      
      // 确保不超出范围
      targetScrollTop = Math.max(0, Math.min(totalHeight - containerHeight, targetScrollTop));
      
      // 平滑滚动
      containerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: options.behavior || 'smooth'
      });
    }
  }, [data.length, itemHeight, containerHeight, totalHeight]);
  
  // 根据ID滚动到项
  const scrollToItemById = useCallback((id, options = {}) => {
    const index = data.findIndex(item => keyExtractor(item) === id);
    if (index !== -1) {
      scrollToItem(index, options);
    }
  }, [data, keyExtractor, scrollToItem]);
  
  // 渲染项
  const renderItemElement = (item, index) => {
    const actualIndex = startIndex + index;
    const itemKey = keyExtractor(item);
    
    return (
      <div
        key={itemKey}
        ref={(ref) => setItemRef(itemKey, ref)}
        className={itemClassName}
        style={{
          height: `${itemHeight}px`,
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {renderItem({
          item,
          index: actualIndex,
          isVisible: true,
          isHovered: false,
          key: itemKey
        })}
      </div>
    );
  };
  
  // 渲染内容
  const renderContent = () => {
    // 加载状态
    if (loading) {
      return (
        <div className="virtual-list-loading" style={{ height: containerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-spinner">加载中...</div>
        </div>
      );
    }
    
    // 空状态
    if (data.length === 0) {
      return (
        <div className="virtual-list-empty" style={{ height: containerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {emptyText}
        </div>
      );
    }
    
    // 虚拟滚动列表
    return (
      <div
        ref={containerRef}
        className={`virtual-list-container ${className}`}
        style={{
          height: containerHeight,
          overflow: 'auto',
          position: 'relative',
          ...rest.style
        }}
        onScroll={handleScroll}
        {...rest}
      >
        {/* 占位元素，保持总高度 */}
        <div
          className="virtual-list-spacer"
          style={{ height: totalHeight, position: 'relative' }}
        >
          {/* 可见区域的项目 */}
          <div
            className="virtual-list-content"
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {renderedItems.map((item, index) => renderItemElement(item, index))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="virtual-list-wrapper">
      {renderContent()}
    </div>
  );
};

// 添加样式
const styles = `
.virtual-list-container {
  -webkit-overflow-scrolling: touch; /* iOS滚动优化 */
  scroll-behavior: smooth;
}

.virtual-list-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.virtual-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.virtual-list-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.virtual-list-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.virtual-list-loading {
  color: #999;
}

.loading-spinner {
  display: flex;
  align-items: center;
}

.loading-spinner::after {
  content: '';
  width: 16px;
  height: 16px;
  margin-left: 8px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.virtual-list-empty {
  color: #999;
  font-size: 14px;
}
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export default VirtualList;

/**
 * 虚拟滚动树组件
 * 用于高效渲染大型树状结构，如BOM树
 */
export const VirtualTree = ({ 
  data = [],
  itemHeight = 40,
  containerHeight = 400,
  overscan = 3,
  renderItem,
  keyExtractor,
  childrenKey = 'children',
  className = '',
  itemClassName = '',
  loading = false,
  emptyText = '暂无数据',
  ...rest
}) => {
  // 扁平化树数据
  const flattenTree = (tree, level = 0, parentId = null) => {
    let result = [];
    
    const flattenNode = (node, nodeLevel, nodeParentId, nodeIndex = 0) => {
      const flatNode = {
        ...node,
        level: nodeLevel,
        parentId: nodeParentId,
        isExpanded: node.isExpanded !== false, // 默认展开
        hasChildren: Array.isArray(node[childrenKey]) && node[childrenKey].length > 0
      };
      
      result.push(flatNode);
      
      // 递归处理子节点
      if (flatNode.hasChildren && flatNode.isExpanded) {
        node[childrenKey].forEach((child, index) => {
          flattenNode(child, nodeLevel + 1, keyExtractor(node), index);
        });
      }
    };
    
    tree.forEach((rootNode, index) => {
      flattenNode(rootNode, level, parentId, index);
    });
    
    return result;
  };
  
  // 展开/折叠节点
  const toggleNode = (nodeId) => {
    // 这里简化处理，实际使用时需要从父组件获取更新方法
    console.log('Toggle node:', nodeId);
  };
  
  // 渲染树节点
  const renderTreeNode = ({ item, index }) => {
    const indent = item.level * 24; // 每层缩进24px
    
    return (
      <div
        className={`virtual-tree-node ${itemClassName}`}
        style={{
          height: `${itemHeight}px`,
          paddingLeft: `${indent}px`,
          display: 'flex',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}
      >
        {item.hasChildren && (
          <span
            className="toggle-icon"
            style={{
              marginRight: '8px',
              cursor: 'pointer',
              display: 'inline-block',
              width: '16px',
              height: '16px',
              textAlign: 'center',
              transform: item.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(keyExtractor(item));
            }}
          >
            ▶
          </span>
        )}
        <span
          className="node-content"
          style={{ cursor: item.hasChildren ? 'pointer' : 'default' }}
          onClick={() => item.hasChildren && toggleNode(keyExtractor(item))}
        >
          {renderItem({
            item,
            index,
            isVisible: true,
            key: keyExtractor(item)
          })}
        </span>
      </div>
    );
  };
  
  // 扁平化数据
  const flatData = flattenTree(data);
  
  return (
    <VirtualList
      data={flatData}
      itemHeight={itemHeight}
      containerHeight={containerHeight}
      overscan={overscan}
      renderItem={renderTreeNode}
      keyExtractor={keyExtractor}
      className={`virtual-tree ${className}`}
      loading={loading}
      emptyText={emptyText}
      {...rest}
    />
  );
};