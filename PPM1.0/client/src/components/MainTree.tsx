import React, { useState } from 'react';
import { List, Tag, Tooltip } from 'antd';
import { BulbOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

// 主料节点数据结构
export interface MainPart {
  id: string;
  partNumber: string;
  name: string;
  cost: number;
  altCount: number;
}

interface MainTreeProps {
  onSelect: (part: MainPart) => void;
}

const MainTree: React.FC<MainTreeProps> = ({ onSelect }) => {
  // 模拟主料数据
  const [mainParts] = useState<MainPart[]>([
    {
      id: 'main-001',
      partNumber: 'CPU-MAIN-001',
      name: '英特尔 i5 处理器',
      cost: 3500,
      altCount: 3
    },
    {
      id: 'main-002',
      partNumber: 'RAM-MAIN-001',
      name: '16GB DDR4 内存',
      cost: 800,
      altCount: 2
    },
    {
      id: 'main-003',
      partNumber: 'SSD-MAIN-001',
      name: '512GB NVMe SSD',
      cost: 450,
      altCount: 1
    }
  ]);

  // 打开AI推荐抽屉
  const handleAIRecommend = (e: React.MouseEvent, part: MainPart) => {
    e.stopPropagation();
    console.log('打开AI推荐抽屉:', part);
    // 实现AI推荐抽屉的逻辑
  };

  // 重新分组（拖拽功能）
  const handleGroupChange = (e: React.MouseEvent, part: MainPart, direction: 'up' | 'down') => {
    e.stopPropagation();
    console.log(`重新分组 ${part.partNumber} ${direction}`);
    // 实现拖拽重新分组的逻辑
  };

  return (
    <div className="p-2">
      <h3 className="text-md font-medium mb-3">主料树</h3>
      <List
        className="border rounded"
        itemLayout="vertical"
        dataSource={mainParts}
        renderItem={(part) => (
          <List.Item
            className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
            onClick={() => onSelect(part)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{part.partNumber}</span>
                  <Tag color="blue">{part.altCount}个替代料</Tag>
                </div>
                <div className="text-sm text-gray-500 mt-1">{part.name}</div>
                <div className="text-sm text-green-600 mt-1">成本: ¥{part.cost}</div>
              </div>
              <div className="flex gap-1">
                <Tooltip title="上移分组">
                  <ArrowUpOutlined 
                    className="text-gray-400 hover:text-blue-600 cursor-pointer"
                    onClick={(e) => handleGroupChange(e, part, 'up')}
                  />
                </Tooltip>
                <Tooltip title="下移分组">
                  <ArrowDownOutlined 
                    className="text-gray-400 hover:text-blue-600 cursor-pointer"
                    onClick={(e) => handleGroupChange(e, part, 'down')}
                  />
                </Tooltip>
                <Tooltip title="AI推荐替代料">
                  <BulbOutlined 
                    className="text-yellow-500 hover:text-yellow-700 cursor-pointer"
                    onClick={(e) => handleAIRecommend(e, part)}
                  />
                </Tooltip>
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default MainTree;