import React, { useState } from 'react';
import { Calendar, Modal, List, Tag, Badge } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

interface ExpiringPart {
  id: string;
  name: string;
  position: string;
  certType: string;
  expireDate: string;
}

interface CertCalendarProps {
  highlightDates?: string[];
  onDateClick?: (date: string) => void;
}

const CertCalendar: React.FC<CertCalendarProps> = ({
  highlightDates = [],
  onDateClick
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 模拟日期对应的到期零件数据
  const getExpiringPartsForDate = (date: string): ExpiringPart[] => {
    // 这里应该从API获取实际数据，现在返回模拟数据
    const mockData: Record<string, ExpiringPart[]> = {
      '2025-08-01': [
        {
          id: 'part-1',
          name: 'i7-1555U处理器',
          position: 'U1',
          certType: 'RoHS',
          expireDate: '2025-08-01'
        },
        {
          id: 'part-2',
          name: 'PCB主板',
          position: 'PCB-001',
          certType: 'CE',
          expireDate: '2025-08-01'
        }
      ],
      '2025-05-15': [
        {
          id: 'part-3',
          name: '电源模块',
          position: 'PWR-001',
          certType: 'CE',
          expireDate: '2025-05-15'
        }
      ],
      '2024-10-15': [
        {
          id: 'part-4',
          name: '内存模块',
          position: 'MEM-001',
          certType: 'REACH',
          expireDate: '2024-10-15'
        }
      ]
    };
    return mockData[date] || [];
  };

  // 渲染日期单元格
  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const isHighlighted = highlightDates.includes(dateStr);
    const expiringParts = getExpiringPartsForDate(dateStr);
    
    return (
      <div className="p-1">
        {isHighlighted && (
          <Badge
            count={expiringParts.length}
            style={{ backgroundColor: '#ff4d4f' }}
            className="cert-expiring-badge"
          />
        )}
      </div>
    );
  };

  // 渲染月份单元格
  const monthCellRender = (value: Dayjs) => {
    const monthStr = value.format('YYYY-MM');
    // 检查该月是否有到期证书
    const hasExpiringInMonth = highlightDates.some(date => date.startsWith(monthStr));
    
    if (hasExpiringInMonth) {
      return (
        <div className="cert-month-highlight flex justify-center items-center p-2">
          <span className="text-red-500 font-medium">{value.format('YYYY年MM月')}</span>
          <Tag color="error" className="ml-2">有到期证书</Tag>
        </div>
      );
    }
    return <span>{value.format('YYYY年MM月')}</span>;
  };

  // 处理日期点击
  const handleDateSelect = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    setSelectedDate(dateStr);
    
    // 如果该日期有到期零件，显示模态框
    const expiringParts = getExpiringPartsForDate(dateStr);
    if (expiringParts.length > 0) {
      setModalVisible(true);
    }
    
    // 调用外部回调
    if (onDateClick) {
      onDateClick(dateStr);
    }
  };

  // 关闭模态框
  const handleModalClose = () => {
    setModalVisible(false);
  };

  // 获取当前选中日期的到期零件
  const currentExpiringParts = selectedDate ? getExpiringPartsForDate(selectedDate) : [];

  return (
    <>
      <Calendar
        dateCellRender={dateCellRender}
        monthCellRender={monthCellRender}
        onSelect={handleDateSelect}
        fullscreen={false}
        headerRender={({ value }) => {
          const start = 0;
          const end = 12;
          const monthOptions = [];

          const current = value.clone();
          const months = [];
          for (let i = 0; i < 12; i++) {
            const monthDate = current.clone().month(i);
            months.push(monthDate.format('MMM'));
          }

          const year = current.year();
          const month = current.month();

          return (
            <div style={{ padding: '10px' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {year}年 {months[month]}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>日</div>
                <div>一</div>
                <div>二</div>
                <div>三</div>
                <div>四</div>
                <div>五</div>
                <div>六</div>
              </div>
            </div>
          );
        }}
      />

      {/* 到期零件列表模态框 */}
      <Modal
        title={`${selectedDate} 到期零件列表`}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={500}
      >
        <List
          bordered
          dataSource={currentExpiringParts}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div className="flex justify-between items-center">
                    <span>{item.name}</span>
                    <Tag color="error">{item.certType}</Tag>
                  </div>
                }
                description={
                  <div className="text-sm text-gray-600">
                    位号: {item.position}
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{
            emptyText: '该日期没有到期证书'
          }}
        />
      </Modal>
    </>
  );
};

export default CertCalendar;