import React, { useState, useMemo, useEffect } from 'react';
import { Tree, Tag, Tooltip, Spin, Dropdown, Menu, message, Space } from 'antd';
import { FileSearchOutlined, AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { MenuProps } from 'antd';
import '../styles/ComplianceStyles.css';
import type { ComplianceTreeNode } from '../data/complianceMockData';

interface ComplianceTreeProps {
  onNodeClick: (node: TreeNodeData) => void;
  onNodeRightClick?: (node: TreeNodeData) => void;
  onRemediation?: (node: TreeNodeData) => void;
  loading?: boolean;
  data?: TreeNodeData[];
  selectedNodeId?: string;
  onRowSelect?: (selectedRows: TreeNodeData[]) => void;
}

// 合规状态类型定义
type ComplianceStatus = 'compliant' | 'expiring' | 'missing';

// 树节点数据类型
interface TreeNodeData {
  id: string;
  name: string;
  position: string;
  status: ComplianceStatus;
  expireDate?: string;
  certificateExpiry?: string;
  children?: TreeNodeData[];
}

const ComplianceTree: React.FC<ComplianceTreeProps> = ({
  onNodeClick,
  onNodeRightClick,
  onRemediation,
  loading = false,
  data,
  selectedNodeId,
  onRowSelect
}) => {
  // 展开的节点列表
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  // 当前选中的节点
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  // 处理节点选择变化
  const onSelectChange = (newSelectedKeys: React.Key[]) => {
    setSelectedKeys(newSelectedKeys);
    
    // 如果提供了选择回调，则处理选中的节点数据
    if (onRowSelect) {
      // 辅助函数：递归查找选中的节点
      const findSelectedNodes = (nodes: TreeNodeData[], selectedIds: React.Key[]): TreeNodeData[] => {
        let result: TreeNodeData[] = [];
        
        nodes.forEach(node => {
          if (selectedIds.includes(node.id)) {
            result.push(node);
          }
          if (node.children && node.children.length > 0) {
            result = result.concat(findSelectedNodes(node.children, selectedIds));
          }
        });
        
        return result;
      };
      
      const treeDataToSearch = data || mockTreeData;
      const selectedNodes = findSelectedNodes(treeDataToSearch, newSelectedKeys);
      onRowSelect(selectedNodes);
    }
  };

  // 模拟BOM树数据（当没有传入数据时使用）
  const mockTreeData: TreeNodeData[] = [
    {
      id: 'assembly-1',
      name: '主装配体',
      position: 'ASM-001',
      status: 'compliant',
      children: [
        {
          id: 'subassembly-1',
          name: '子装配体A',
          position: 'SUB-001',
          status: 'expiring',
          expireDate: '2025-08-01',
          children: [
            {
              id: 'part-1',
              name: 'PCB主板',
              position: 'PCB-001',
              status: 'missing'
            },
            {
              id: 'part-2',
              name: '处理器',
              position: 'U1',
              status: 'compliant'
            }
          ]
        },
        {
          id: 'subassembly-2',
          name: '子装配体B',
          position: 'SUB-002',
          status: 'compliant',
          children: [
            {
              id: 'part-3',
              name: '电源模块',
              position: 'PWR-001',
              status: 'expiring',
              expireDate: '2025-05-15'
            },
            {
              id: 'part-4',
              name: '连接器',
              position: 'CONN-001',
              status: 'compliant'
            }
          ]
        }
      ]
    }
  ];

  // 使用传入的数据或模拟数据
  const treeData = data || mockTreeData;

  // 计算证书是否即将到期（90天内）
  const isCertificateExpiringSoon = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays >= 0 && diffDays <= 90;
  };

  // 根据合规状态获取颜色
  const getStatusColor = (status: ComplianceStatus, expireDate?: string): string => {
    // 即使是合规状态，如果证书即将到期，也显示警告色
    if (status === 'compliant' && expireDate && isCertificateExpiringSoon(expireDate)) {
      return 'warning';
    }
    
    if (status === 'expiring' && expireDate) {
      // 计算是否在90天内到期
      if (isCertificateExpiringSoon(expireDate)) {
        return 'warning';
      }
    }
    
    switch (status) {
      case 'compliant':
        return 'success';
      case 'expiring':
        return 'warning';
      case 'missing':
        return 'error';
      default:
        return 'default';
    }
  };

  // 获取状态对应的颜色值
  const getStatusColorValue = (status: ComplianceStatus, expireDate?: string): string => {
    if (status === 'compliant' && expireDate && isCertificateExpiringSoon(expireDate)) {
      return '#faad14'; // 橙色 - 证书即将到期
    }
    
    switch (status) {
      case 'compliant':
        return '#52c41a'; // 绿色 - 合规完整
      case 'expiring':
        return '#faad14'; // 橙色 - 证书即将到期
      case 'missing':
        return '#f5222d'; // 红色 - 缺失认证
      default:
        return '#d9d9d9';
    }
  };

  // 根据合规状态获取文本
  const getStatusText = (status: ComplianceStatus): string => {
    switch (status) {
      case 'compliant':
        return '合规完整';
      case 'expiring':
        return '证书即将到期';
      case 'missing':
        return '缺失认证';
      default:
        return '未知状态';
    }
  };

  // 递归构建Ant Design Tree所需的DataNode结构
  const buildTreeData = (nodes: TreeNodeData[]): DataNode[] => {
    return nodes.map(node => {
      // 确保node.id存在，如果不存在则使用position或生成临时id
      const nodeKey = node.id || node.position || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 检查证书是否即将到期，更新状态
      let status = node.status;
      if (status === 'compliant' && node.expireDate && isCertificateExpiringSoon(node.expireDate)) {
        status = 'expiring';
      }
      
      const statusColor = getStatusColor(status, node.expireDate);
      const statusColorValue = getStatusColorValue(status, node.expireDate);
      const expiryDate = node.expireDate || node.certificateExpiry;
      const displayStatus = status === 'expiring' ? '即将到期' : status === 'missing' ? '缺失' : '合规';
      
      // 根据层级设置节点样式
      const isLowLevel = node.position?.split('.').length >= 5; // L5及以下节点
      
      // 安全处理children，确保只有有效节点才会被处理
      const children = node.children && node.children.length > 0 
        ? buildTreeData(node.children.filter(child => child != null)) 
        : undefined;
      
      // 创建TreeNodeData的安全副本，不直接扩展DataNode
      const nodeData = {
        id: nodeKey,
        name: node.name,
        position: node.position,
        status: node.status,
        expireDate: node.expireDate,
        certificateExpiry: node.certificateExpiry
      };
      
      const treeNode: DataNode = {
        title: (
          <div className="compliance-node-content flex items-center justify-between" style={{ cursor: 'pointer', width: '100%' }}>
            <div className="flex flex-col" style={{ flex: 1 }}>
              <div className="flex items-center">
                {/* 状态图标 */}
                <span style={{ color: statusColorValue, marginRight: 8 }}>
                  {status === 'compliant' ? <CheckCircleOutlined /> :
                   status === 'expiring' ? <ClockCircleOutlined /> : <ExclamationCircleOutlined />}
                </span>
                <span 
                  className="node-position mr-2 font-semibold"
                  style={{ 
                    color: statusColorValue,
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={node.position}
                >
                  {node.position || '未知位置'}
                </span>
                <span 
                  className="node-name"
                  style={{ 
                    fontWeight: isLowLevel ? '500' : 'normal',
                    color: status === 'missing' ? '#f5222d' : 'inherit',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={node.name}
                >
                  {node.name || '未命名节点'}
                </span>
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <span className="compliance-status-text">合规状态: {getStatusText(status)}</span>
                {expiryDate && (
                  <span className="ml-2 node-expiry">证书到期: {expiryDate}</span>
                )}
              </div>
            </div>
            <Space size="small" className="node-tags">
              <Tooltip title={expiryDate ? `到期日: ${expiryDate}` : getStatusText(status)}>
                <Tag 
                  color={statusColor}
                  className={`compliance-tag tag-${status}`}
                  style={{ border: `1px solid ${statusColorValue}50` }}
                >
                  {displayStatus}
                </Tag>
              </Tooltip>
              {expiryDate && (
                <Tag color="default" className="text-xs node-expiry-tag">
                  {expiryDate}
                </Tag>
              )}
            </Space>
          </div>
        ),
        key: nodeKey,
        isLeaf: !children || children.length === 0,
        children,
        // 将原始数据作为data属性，而不是直接扩展
        ...(nodeData as any)
      };
      return treeNode;
    });
  };

  // 转换为Ant Design Tree组件所需的数据格式
  const transformedTreeData = useMemo(() => buildTreeData(treeData), [treeData]);
  
  // 处理合规整改
  const handleRemediation = (nodeId: string) => {
    if (treeData) {
      const node = findNodeById(nodeId, treeData);
      if (node && onRemediation) {
        onRemediation(node);
      }
    }
  };

  // 处理节点展开/折叠
  const handleExpand = (keys: React.Key[]) => {
    setExpandedKeys(keys.map(key => String(key)));
  };

  // 从原始数据中查找对应的节点信息
  const findNodeById = (id: string, nodes: TreeNodeData[]): TreeNodeData | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(id, node.children);
        if (found) return found;
      }
    }
    return undefined;
  };

  // 处理节点点击
  const handleNodeClick = (selectedKeys: React.Key | React.Key[], info: any) => {
    // 更新选中状态
    const keysArray = Array.isArray(selectedKeys) ? selectedKeys : [selectedKeys];
    onSelectChange(keysArray);
    
    if (info.node?.key && treeData) {
      const node = findNodeById(info.node.key as string, treeData);
      if (node) {
        onNodeClick(node);
        // 滚动到表格对应行 - 触发滚动事件给父组件
        const scrollEvent = new CustomEvent('scrollToRow', {
          detail: { position: node.position, nodeId: node.id }
        });
        window.dispatchEvent(scrollEvent);
        
        // 显示点击反馈
        message.info(`已选择: ${node.name} (${node.position})`, 1);
      }
    }
  };

  // 计算节点状态统计
  const calculateStatusStats = (nodes: TreeNodeData[]): {[key: string]: number} => {
    const stats = { compliant: 0, expiring: 0, missing: 0 };
    
    const traverse = (nodeList: TreeNodeData[]) => {
      nodeList.forEach(node => {
        let status = node.status;
        // 检查证书是否即将到期
        if (status === 'compliant' && node.expireDate && isCertificateExpiringSoon(node.expireDate)) {
          status = 'expiring';
        }
        
        if (stats.hasOwnProperty(status)) {
          stats[status as keyof typeof stats]++;
        }
        
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    
    traverse(nodes);
    return stats;
  };

  const statusStats = useMemo(() => calculateStatusStats(treeData), [treeData]);

  // 右键菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'view-details',
      label: (
        <div className="flex items-center">
          <FileSearchOutlined style={{ marginRight: 6 }} />
          查看详情
        </div>
      ),
      onClick: () => {
        if (selectedKeys.length > 0 && treeData) {
          const node = findNodeById(selectedKeys[0] as string, treeData);
          if (node) {
            onNodeClick(node);
          }
        }
      }
    },
    {
      key: 'remediation',
      label: (
        <div className="flex items-center">
          <AlertOutlined style={{ marginRight: 6 }} />
          合规整改
        </div>
      ),
      onClick: () => {
        if (selectedKeys.length > 0) {
          handleRemediation(selectedKeys[0] as string);
        }
      },
      // 合规状态为compliant时隐藏整改选项
      disabled: selectedKeys.length > 0 && treeData ? 
        findNodeById(selectedKeys[0] as string, treeData)?.status === 'compliant' : false
    }
  ];

  // 处理右键菜单
  const handleRightClick = ({ node }: any) => {
    if (node?.key) {
      setSelectedKeys([node.key]);
      // 如果提供了右键点击回调，则调用
      if (onNodeRightClick && treeData) {
        const nodeData = findNodeById(node.key as string, treeData);
        if (nodeData) {
          onNodeRightClick(nodeData);
        }
      }
    }
  };

  // 当外部传入selectedNodeId时，更新选中状态
  useEffect(() => {
    if (selectedNodeId) {
      setSelectedKeys([selectedNodeId]);
    }
  }, [selectedNodeId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" tip="加载合规树数据..." />
      </div>
    );
  }

  return (
    <div className="compliance-tree-container custom-scrollbar">
      {/* 状态统计 */}
      <div className="tree-stats fade-in" style={{ 
        padding: '12px', 
        marginBottom: '16px', 
        backgroundColor: '#fafafa', 
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '8px',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
            {statusStats.compliant}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>合规</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>
            {statusStats.expiring}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>即将到期</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f5222d' }}>
            {statusStats.missing}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>缺失</div>
        </div>
      </div>
      
      <Tree
        showLine
        defaultExpandAll
        expandedKeys={expandedKeys}
        selectedKeys={selectedKeys}
        onExpand={handleExpand}
        onRightClick={handleRightClick}
        onSelect={handleNodeClick} // 只保留一个onSelect属性
        treeData={transformedTreeData}
        className="compliance-tree fade-in"
        virtual
        height={500}
        // 自定义样式以确保节点内容完全可见
        style={{
          fontSize: '14px',
          lineHeight: '1.5',
          border: '1px solid #f0f0f0',
          borderRadius: '6px',
          padding: '8px',
          backgroundColor: 'white',
          overflow: 'auto'
        }}
        // 添加右键菜单
        titleRender={(nodeData) => (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['contextMenu']}
            onOpenChange={() => {}}
          >
            <span style={{ width: '100%', display: 'inline-block' }}>
              {nodeData.title as React.ReactNode}
            </span>
          </Dropdown>
        )}
      />
    </div>
  );
};

export default ComplianceTree;