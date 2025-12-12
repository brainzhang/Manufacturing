import React from 'react';
import { Drawer, Descriptions, Empty } from 'antd';

// 极简的零件详情类型
interface SimplePartDetail {
  position?: string;
  partName?: string;
  partId?: string;
  id?: string;
  lifecycle?: string;
}

// 组件属性类型
interface SimpleCostDetailDrawerProps {
  visible: boolean;
  partDetail: SimplePartDetail | null | undefined;
  onClose: () => void;
}

// 极简实现的组件
const SimpleCostDetailDrawer: React.FC<SimpleCostDetailDrawerProps> = ({
  visible,
  partDetail,
  onClose
}) => {
  return (
    <Drawer
      title={partDetail ? `${partDetail.position || ''} - ${partDetail.partName || ''}` : "成本详情"}
      width={600}
      placement="right"
      onClose={onClose}
      open={visible}
    >
      {partDetail ? (
        <Descriptions column={2} bordered>
          <Descriptions.Item label="位号">{partDetail.position || ''}</Descriptions.Item>
          <Descriptions.Item label="零件名称">{partDetail.partName || ''}</Descriptions.Item>
          <Descriptions.Item label="零件ID">{partDetail.partId || partDetail.id || ''}</Descriptions.Item>
          <Descriptions.Item label="生命周期">{partDetail.lifecycle || ''}</Descriptions.Item>
        </Descriptions>
      ) : (
        <Empty description="暂无零件详情" />
      )}
    </Drawer>
  );
};

export default SimpleCostDetailDrawer;