import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Tree, 
  Tag, 
  Space,
  Spin,
  Empty,
  Button,
  message
} from 'antd';
import { 
  SyncOutlined 
} from '@ant-design/icons';

const { TreeNode } = Tree;

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

// BOM结构预览组件
const BOMStructurePreview = ({ bomData, loading = false }) => {
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // 当BOM数据更新时，初始化为折叠状态
  useEffect(() => {
    if (bomData && bomData.length > 0) {
      // 初始化为折叠状态，只展开根节点
      const rootKeys = bomData.map(node => node.key);
      setExpandedKeys(rootKeys);
    } else {
      setExpandedKeys([]);
    }
  }, [bomData]);

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

  // 获取层级颜色
  const getLevelColor = (level) => {
    return BOM_LEVELS[`L${level}`]?.color || 'default';
  };

  // 同步预览
  const handleSync = () => {
    setSyncing(true);
    
    // 模拟同步过程
    setTimeout(() => {
      setSyncing(false);
      message.success('预览同步完成');
    }, 1000);
  };

  // 渲染节点标题（简化版，只显示标题和层级标签）
  const renderNodeTitle = (node) => {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center'
      }}>
        <span>{node.title}</span>
        <Tag color={getLevelColor(node.level)} size="small" style={{ marginLeft: 8 }}>
          {BOM_LEVELS[`L${node.level}`].name}
        </Tag>
      </div>
    );
  };

  // 转换数据格式以适配Tree组件
  const convertTreeData = (nodes) => {
    return nodes.map(node => ({
      ...node,
      title: renderNodeTitle(node),
      children: node.children && node.children.length > 0 
        ? convertTreeData(node.children) 
        : undefined
    }));
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>BOM结构预览</span>
          <Button 
            size="small"
            icon={<SyncOutlined />}
            onClick={handleSync}
            loading={syncing}
          >
            同步
          </Button>
        </div>
      }
      size="small"
      loading={loading}
    >
      {bomData && bomData.length > 0 ? (
        <Tree
          showLine
          treeData={convertTreeData(bomData)}
          expandedKeys={expandedKeys}
          onExpand={setExpandedKeys}
        />
      ) : (
        <Empty 
          description="暂无BOM数据" 
          style={{ padding: '50px 0' }}
        />
      )}
    </Card>
  );
};

export default BOMStructurePreview;