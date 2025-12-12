import React, { useState, useEffect } from 'react';
import { Tree, Typography, Badge, Space, Dropdown, Button, Tag, Tooltip } from 'antd';
import { useCostDashboard } from '../../hooks/useCostDashboard';
import { BulbOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';

const { Text } = Typography;

// 更新接口以符合BOM树结构
interface CostTreeNode {
  key: string;
  title: string;
  position: string;
  partName: string;
  currentCost: number;
  targetCost: number;
  level: number;          // 1-7层级
  nodeType?: '父节点' | '子节点' | '替代料';
  partId?: string;        // 仅L6/L7有
  quantity?: number;      // 仅L6/L7有
  cost?: number;          // 仅L6/L7有
  lifecycle?: string;     // 仅L6/L7有
  isParentNode?: boolean;
  isAlternative?: boolean;
  supplier?: string;
  children?: CostTreeNode[];
}

interface CostTreeProps {
  treeData: CostTreeNode[];
  onNodeClick: (node: CostTreeNode) => void;
  onNodeRightClick: (node: CostTreeNode) => void;
}

const CostTree: React.FC<CostTreeProps> = (props) => {
  const { treeData: propTreeData, onNodeClick } = props;
  const { on, openCostDownDrawer } = useCostDashboard();
  
  // 处理降本建议请求
  const handleCostDownRequest = (node: CostTreeNode) => {
    console.log('打开降本建议抽屉，零件:', node.partName);
    
    // 直接打开降本建议抽屉，将零件信息传递给父组件处理
    openCostDownDrawer(node.partName);
  };
  
  // 使用state管理树数据，支持props初始值和事件更新
  const [treeData, setTreeData] = useState(propTreeData);
  
  // 监听成本更新事件
  useEffect(() => {
    const handleCostUpdated = (updatedData: any) => {
      if (updatedData.costTreeData) {
        setTreeData(updatedData.costTreeData);
      }
    };
    
    const cleanup = on('costUpdated', handleCostUpdated);
    
    return () => cleanup();
  }, [on]);
  
  // 监听props变化，支持外部直接更新
  useEffect(() => {
    setTreeData(propTreeData);
  }, [propTreeData]);
  // 计算成本差异百分比
  const calculateCostDiff = (currentCost: number, targetCost: number): number => {
    if (targetCost === 0) return 0;
    return ((currentCost - targetCost) / targetCost) * 100;
  };

  // 获取节点颜色
  const getNodeColor = (currentCost: number, targetCost: number): string => {
    const diffPercent = calculateCostDiff(currentCost, targetCost);
    // 绿色：成本≤目标×95%（即diffPercent ≤ -5%）
    if (diffPercent <= -5) return 'green';
    // 橙色：目标×95%~105%（即-5% < diffPercent < 5%）
    if (diffPercent < 5) return 'orange';
    // 红色：成本>目标×105%（即diffPercent ≥ 5%）
    return 'red';
  };

  // 获取差异百分比文本
  const getDiffText = (currentCost: number, targetCost: number): string => {
    const diffPercent = calculateCostDiff(currentCost, targetCost);
    const prefix = diffPercent >= 0 ? '+' : '';
    return `${prefix}${diffPercent.toFixed(1)}%`;
  };

  // 获取差异标签颜色
  const getDiffTagColor = (currentCost: number, targetCost: number): string => {
    const diffPercent = calculateCostDiff(currentCost, targetCost);
    // 与节点颜色逻辑保持一致
    if (diffPercent <= -5) return 'green';
    if (diffPercent < 5) return 'orange';
    return 'red';
  };

  // 构建Ant Design Tree需要的数据结构
  const buildTreeNodes = (nodes: CostTreeNode[]): DataNode[] => {
    return nodes.map(node => {
      const color = getNodeColor(node.currentCost, node.targetCost);
      const diffPercent = getDiffText(node.currentCost, node.targetCost);
      const diffTagColor = getDiffTagColor(node.currentCost, node.targetCost);
      
      // 创建节点内容
      const nodeContent = (
        <div 
          className="flex items-center justify-between w-full cursor-pointer hover:bg-gray-50 p-1 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onNodeClick(node);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            handleCostDownRequest(node);
          }}
        >
          <div className="flex-1 overflow-hidden">
            <Space size={[8, 0]} wrap>
              <Badge 
                status={color as "error" | "default" | "success" | "warning" | "processing"}
                className={`inline-flex items-center ${color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-orange-600'}`}
              >
                <Text className="font-medium">{node.position}</Text>
              </Badge>
              <Text ellipsis={{ tooltip: node.partName }} className="max-w-[120px]">
                {node.partName}
              </Text>
            </Space>
          </div>
          
          <Space size={[8, 0]} className="text-right">
            <Text className="whitespace-nowrap">¥{node.currentCost.toLocaleString()}</Text>
            <Text type="secondary" className="whitespace-nowrap">¥{node.targetCost.toLocaleString()}</Text>
            <Tag color={diffTagColor} className="whitespace-nowrap">
              {diffPercent}
            </Tag>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'costDown',
                    icon: <BulbOutlined />,
                    label: '降本建议',
                    onClick: () => handleCostDownRequest(node)
                  },
                ],
              }}
            >
              <Button type="text" icon={<EllipsisOutlined />} size="small" />
            </Dropdown>
          </Space>
        </div>
      );

      return {
        key: node.key,
        title: nodeContent,
        children: node.children ? buildTreeNodes(node.children) : undefined,
        // 存储原始节点数据，便于后续使用
        _originNode: node
      };
    });
  };

  // 删除重复的 treeNodes 声明，已在下方 buildTreeNodesWithLazyLoad 中统一生成

  // 右键菜单处理 - 弹出降本建议抽屉
    const handleRightClick = ({ node }: any) => {
      if (node._originNode) {
        handleCostDownRequest(node._originNode);
      }
    };

  // 点击节点处理 - 滚动到对应行
  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    if (info.node._originNode) {
      onNodeClick(info.node._originNode);
    }
  };

  // 增强的懒加载子节点数据实现，支持7层BOM树结构
  const loadData = (treeNode: any) => {
    return new Promise<void>((resolve) => {
      try {
        console.log('开始加载子节点数据:', treeNode?.key || '未知key');
        
        // 增强的安全检查
        if (!treeNode || typeof treeNode !== 'object') {
          console.error('loadData: treeNode参数无效');
          resolve();
          return;
        }
        
        // 关键修复：确保dataRef存在，优化初始化逻辑
        if (!treeNode.dataRef || typeof treeNode.dataRef !== 'object') {
          console.log('loadData: 初始化treeNode.dataRef');
          treeNode.dataRef = {
            _originNode: treeNode._originNode || treeNode,
            isLeaf: false // 默认不标记为叶子节点，除非确认没有子节点
          };
        }
        
        // 检查原始节点数据是否存在，支持多种可能的数据来源
        let originNode = treeNode.dataRef._originNode || treeNode._originNode || treeNode;
        
        // 获取节点层级，优先使用存储的层级信息
        const nodeLevel = treeNode._level || (treeNode.key as string)?.split('-').length || 1;
        console.log(`当前节点${treeNode.key}层级: ${nodeLevel}`);
        
        // 为第1-6层节点生成子节点数据
        if (nodeLevel < 7) {
          // 创建7层BOM树结构的模拟数据生成函数
          const generateMockChildren = (parentKey: string, level: number): CostTreeNode[] => {
            const childrenCount = Math.floor(Math.random() * 2) + 2; // 每层2-3个子节点
            const children: CostTreeNode[] = [];
            const lifecycleOptions = ['Active', 'PhaseOut', 'EOL'];
            const supplierOptions = ['供应商A', '供应商B', '供应商C', '供应商D'];
            
            for (let i = 1; i <= childrenCount; i++) {
              const baseCost = (originNode.currentCost || 1000) * 0.3 / level;
              const isParent = level < 6;
              const nodeType = isParent ? '父节点' : '子节点';
              
              // 为L6层生成替代料（模拟10%概率）
              let childNodes: CostTreeNode[] = [];
              const mainNode: CostTreeNode = {
                key: `${parentKey}-${level}-${i}`,
                title: `${getLevelTitle(level)} ${i}`,
                position: `${getPositionFormat(level, i)}`,
                partName: `${getLevelPartName(level, i)}`,
                currentCost: Math.round((baseCost + Math.random() * baseCost * 0.2) * 100) / 100,
                targetCost: Math.round(baseCost * 0.95 * 100) / 100,
                level: level,
                nodeType: nodeType,
                isParentNode: isParent,
                // 仅L6/L7节点有以下属性
                ...(level >= 6 && {
                  partId: `PART-L${level}-${i}`,
                  quantity: Math.floor(Math.random() * 5) + 1,
                  cost: Math.round(baseCost * 100) / 100,
                  lifecycle: lifecycleOptions[Math.floor(Math.random() * lifecycleOptions.length)],
                  supplier: supplierOptions[Math.floor(Math.random() * supplierOptions.length)]
                })
              };
              
              childNodes.push(mainNode);
              
              // 为L6层节点添加替代料（模拟）
              if (level === 6 && Math.random() < 0.3) {
                const altNode: CostTreeNode = {
                  key: `${parentKey}-${level}-${i}-ALT`,
                  title: `${getLevelTitle(level)} ${i} 替代料`,
                  position: `${getPositionFormat(level, i)}-ALT`,
                  partName: `${getLevelPartName(level, i)} 替代料`,
                  currentCost: Math.round((baseCost * 0.9 + Math.random() * baseCost * 0.1) * 100) / 100,
                  targetCost: Math.round(baseCost * 0.95 * 100) / 100,
                  level: level,
                  nodeType: '替代料',
                  isParentNode: false,
                  isAlternative: true,
                  partId: `PART-L${level}-${i}-ALT`,
                  quantity: mainNode.quantity,
                  cost: Math.round(baseCost * 0.9 * 100) / 100,
                  lifecycle: lifecycleOptions[Math.floor(Math.random() * lifecycleOptions.length)],
                  supplier: supplierOptions[Math.floor(Math.random() * supplierOptions.length)]
                };
                childNodes.push(altNode);
              }
              
              children.push(...childNodes);
            }
            return children;
          };
          
          // 根据层级获取不同的标题
          const getLevelTitle = (level: number): string => {
            const titles = [
              '', '产品', '主板', 'CPU模块', '子组件', '功能模块', '零件', '替代料'
            ];
            return titles[level] || `层级${level}`;
          };
          
          // 获取位号格式
          const getPositionFormat = (level: number, index: number): string => {
            const basePosition = originNode.position || '1';
            return `${basePosition}.${index}`;
          };
          
          // 获取零件名称
          const getLevelPartName = (level: number, index: number): string => {
            const partNames = [
              '', '整机产品', '主板组件', 'CPU模块', '子组件', '功能模块', '具体零件', '替代料'
            ];
            return `${partNames[level] || `L${level}组件`} ${index}`;
          };
          
          console.log(`为节点${treeNode.key}生成模拟子节点，当前层级: ${nodeLevel}`);
          const children = generateMockChildren(treeNode.key, nodeLevel + 1);
          
          if (Array.isArray(children) && children.length > 0) {
            console.log(`加载节点${treeNode.key}的子节点，数量:`, children.length);
            
            // 构建子节点
            const childNodes = children.map(child => {
              const childColor = getNodeColor(child.currentCost, child.targetCost);
              const childDiffPercent = getDiffText(child.currentCost, child.targetCost);
              const childDiffTagColor = getDiffTagColor(child.currentCost, child.targetCost);
              const childLevel = nodeLevel + 1;
              
              // 创建子节点内容
              const childNodeContent = (
                <div 
                  className="flex items-center justify-between w-full cursor-pointer hover:bg-gray-50 p-1 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeClick(child);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleCostDownRequest(child);
                  }}
                >
                  <div className="flex-1 overflow-hidden">
                    <Space size={[8, 0]} wrap>
                      <Badge 
                        status={childColor as "error" | "default" | "success" | "warning" | "processing"}
                        className={`inline-flex items-center ${childColor === 'green' ? 'text-green-600' : childColor === 'red' ? 'text-red-600' : 'text-orange-600'}`}
                      >
                        <Text className="font-medium">{child.position}</Text>
                      </Badge>
                      <Text ellipsis={{ tooltip: child.partName }} className="max-w-[120px]">
                        {child.partName}
                      </Text>
                    </Space>
                  </div>
                  
                  <Space size={[8, 0]} className="text-right">
                    <Text className="whitespace-nowrap">¥{child.currentCost.toLocaleString()}</Text>
                    <Text type="secondary" className="whitespace-nowrap">¥{child.targetCost.toLocaleString()}</Text>
                    <Tag color={childDiffTagColor} className="whitespace-nowrap">
                      {childDiffPercent}
                    </Tag>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'costDown',
                            icon: <BulbOutlined />,
                            label: '降本建议',
                            onClick: () => handleCostDownRequest(child)
                          },
                        ],
                      }}
                    >
                      <Button type="text" icon={<EllipsisOutlined />} size="small" />
                    </Dropdown>
                  </Space>
                </div>
              );
              
              return {
                key: child.key,
                title: childNodeContent,
                _originNode: child,
                _level: childLevel,
                // 关键修复：第7层节点必须是叶子节点
                isLeaf: childLevel >= 7
              };
            });
            
            // 设置子节点 - 支持7层BOM结构
            treeNode.dataRef.children = childNodes;
            console.log('子节点设置成功:', treeNode.key, '子节点数量:', treeNode.dataRef.children.length);
            
            // 设置isLeaf为false，允许展开
            treeNode.dataRef.isLeaf = false;
            treeNode.isLeaf = false;
          }
        } else {
          // 第7层节点，标记为叶子节点
          treeNode.dataRef.isLeaf = true;
          treeNode.isLeaf = true;
          console.log('第7层节点，标记为叶子节点:', treeNode.key);
        }
        
        resolve();
      } catch (error) {
        console.error('加载子节点数据发生错误:', error instanceof Error ? error.message : String(error));
        // 出错时确保dataRef存在并标记为叶子节点避免无限重试
        if (treeNode) {
          if (!treeNode.dataRef) {
            treeNode.dataRef = {};
          }
          treeNode.dataRef.isLeaf = true;
          treeNode.isLeaf = true;
        }
        resolve(); // 必须resolve，否则Tree组件会一直重试
      }
    });
  };
  
  // 构建支持懒加载的树节点 - 完整版本，支持7层BOM结构
  const buildTreeNodesWithLazyLoad = (nodes: CostTreeNode[]): DataNode[] => {
    // 添加空数组检查
    if (!nodes || !Array.isArray(nodes)) {
      console.warn('buildTreeNodesWithLazyLoad: nodes参数无效');
      return [];
    }
    
    return nodes.map(node => {
      const color = getNodeColor(node.currentCost, node.targetCost);
      const diffPercent = getDiffText(node.currentCost, node.targetCost);
      const diffTagColor = getDiffTagColor(node.currentCost, node.targetCost);
      
      // 计算节点层级，用于判断是否应该显示展开图标
      const nodeLevel = node.level || node.key.split('-').length || 1;
      const isParent = node.isParentNode || nodeLevel < 6;
      
      // 为节点设置类型
      let nodeType = node.nodeType || (isParent ? '父节点' : '子节点');
      if (node.isAlternative) {
        nodeType = '替代料';
      }
      
      // 创建节点内容 - 符合BOM树结构样式
      const nodeContent = (
        <div 
          className="flex items-center justify-between w-full cursor-pointer hover:bg-gray-50 p-1 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onNodeClick(node);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            handleCostDownRequest(node);
          }}
        >
          <div className="flex-1 overflow-hidden">
            <Space size={[8, 0]} wrap>
              {/* 层级和节点类型标识 */}
              <Badge 
                status={nodeType === '替代料' ? ('processing' as const) : (color as "error" | "default" | "success" | "warning" | "processing")}
                className={`inline-flex items-center ${nodeType === '替代料' ? 'text-purple-600' : color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-orange-600'}`}
              >
                <Text className="font-medium">L{nodeLevel}</Text>
              </Badge>
              
              {/* 位号 */}
              <Tooltip title={node.position}>
                <Text className="font-medium max-w-[60px] truncate">{node.position}</Text>
              </Tooltip>
              
              {/* 零件名称 */}
              <Text ellipsis={{ tooltip: node.partName }} className="max-w-[150px]">
                {node.partName}
              </Text>
              
              {/* 替代料标记 */}
              {node.isAlternative && (
                <Tag color="purple" className="text-xs">替代料</Tag>
              )}
              
              {/* 生命周期（仅L6/L7显示） */}
              {(nodeLevel >= 6 && node.lifecycle) && (
                <Tag color={node.lifecycle === 'EOL' ? 'red' : 'blue'} className="text-xs">
                  {node.lifecycle}
                </Tag>
              )}
            </Space>
          </div>
          
          <Space size={[8, 0]} className="text-right">
            {/* 数量（仅L6/L7显示） */}
            {(nodeLevel >= 6 && node.quantity !== undefined) && (
              <Text className="whitespace-nowrap">QTY: {node.quantity}</Text>
            )}
            
            {/* 成本信息 */}
            <Text className="whitespace-nowrap font-medium">¥{node.currentCost.toLocaleString()}</Text>
            <Text type="secondary" className="whitespace-nowrap">目标:¥{node.targetCost.toLocaleString()}</Text>
            <Tag color={diffTagColor} className="whitespace-nowrap">
              {diffPercent}
            </Tag>
            
            {/* 供应商（仅L6/L7显示） */}
            {(nodeLevel >= 6 && node.supplier) && (
              <Tooltip title={`供应商: ${node.supplier}`}>
                <Text className="whitespace-nowrap text-xs text-gray-500">{node.supplier}</Text>
              </Tooltip>
            )}
            
            {/* 操作菜单 */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'costDown',
                    icon: <BulbOutlined />,
                    label: '降本建议',
                    onClick: () => handleCostDownRequest(node)
                  },
                ],
              }}
            >
              <Button type="text" icon={<EllipsisOutlined />} size="small" />
            </Dropdown>
          </Space>
        </div>
      );

      // 创建树节点对象
      // 关键修复：第1-6层节点必须显示展开图标，第7层为叶子节点
      const treeNode: any = {
        key: node.key,
        title: nodeContent,
        _originNode: node,
        // 确保前6层节点可以展开，第7层为叶子节点
        isLeaf: nodeLevel >= 7,
        // 存储层级信息
        _level: nodeLevel,
        // 设置节点类型和其他属性
        nodeType: nodeType,
        isParentNode: isParent,
        isAlternative: node.isAlternative
      };
      
      console.log('构建树节点:', node.key, '层级:', nodeLevel, 'isLeaf:', treeNode.isLeaf);
      return treeNode;
    });
  };
  
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  
  // 处理展开/折叠事件 - 优化版
  const handleExpand = (keys: React.Key[], info: any) => {
    console.log('展开/折叠节点:', keys.length, '个节点，触发类型:', info?.type);
    // 确保keys是数组且不为空
    if (Array.isArray(keys)) {
      setExpandedKeys(keys);
    } else {
      console.warn('handleExpand: keys参数不是有效的数组');
      setExpandedKeys([]);
    }
  };
  
  const treeNodes = buildTreeNodesWithLazyLoad(treeData);
  
  return (
    <div className="cost-tree-container">
      <Tree
        treeData={treeNodes}
        onRightClick={handleRightClick}
        onSelect={handleSelect}
        onExpand={handleExpand}
        expandedKeys={expandedKeys}
        className="cost-tree"
        loadData={loadData}
        showLine
        autoExpandParent={true}
        selectable={true}
        switcherIcon={(props) => {
          const { isLeaf, isExpanded, onClick } = props;
          // 如果是叶子节点，不显示展开图标
          if (isLeaf) {
            return <span style={{ width: 16, display: 'inline-block' }} />;
          }
          // 确保展开图标可点击并正确传递点击事件
          return (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                if (onClick) {
                  onClick(e);
                }
              }}
              style={{ 
                cursor: 'pointer', 
                fontSize: '12px',
                marginRight: 4,
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                userSelect: 'none',
                display: 'inline-block',
                width: 16,
                textAlign: 'center'
              }}
            >
              ▶
            </span>
          );
        }}
      />
      
      {/* 图例说明 */}
      <div className="mt-4 pt-4 border-t">
        <Text type="secondary" className="block mb-2">成本状态图例：</Text>
        <Space size={[16, 0]}>
          <Space>
            <Badge status="success" />
            <Text>成本≤目标×95%</Text>
          </Space>
          <Space>
            <Badge status="warning" />
            <Text>目标×95%~105%</Text>
          </Space>
          <Space>
            <Badge status="error" />
            <Text>成本&gt;目标×105%</Text>
          </Space>
        </Space>
      </div>
    </div>
  );
};

export default CostTree;