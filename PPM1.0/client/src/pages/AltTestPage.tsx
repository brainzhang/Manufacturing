import React, { useEffect } from 'react';
import { Table, Card, Button } from 'antd';
import { ColumnsType } from 'antd/es/table';
import useAltLogic, { AltNode } from '../hooks/useAltLogic';

const AltTestPage: React.FC = () => {
  const { altParts, initializeMockData, selectedMainPart, setSelectedMainPart } = useAltLogic();

  useEffect(() => {
    console.log('测试页面 - 初始化替代料数据');
    initializeMockData();
    
    // 3秒后自动设置第一个主料
    const timer = setTimeout(() => {
      if (altParts.length > 0 && !selectedMainPart) {
        const firstMainId = altParts[0].parentId;
        console.log('测试页面 - 自动设置主料ID:', firstMainId);
        setSelectedMainPart({
          id: firstMainId,
          partNumber: 'TEST-MAIN',
          name: '测试主料',
          cost: 0,
          altCount: altParts.filter(a => a.parentId === firstMainId).length
        });
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [initializeMockData, altParts, selectedMainPart, setSelectedMainPart]);

  const columns: ColumnsType<AltNode> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '主料ID',
      dataIndex: 'parentId',
      key: 'parentId',
    },
    {
      title: '替代料号',
      dataIndex: 'partId',
      key: 'partId',
    },
    {
      title: '替代料名称',
      dataIndex: 'partName',
      key: 'partName',
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '是否默认',
      dataIndex: 'isDefault',
      key: 'isDefault',
    },
  ];

  return (
    <div className="p-6">
      <Card title="替代料数据测试页面">
        <Button onClick={initializeMockData} className="mb-4">重新加载数据</Button>
        <div className="mb-4">
          <h4>选中的主料: {selectedMainPart?.partNumber || '未选中'}</h4>
          <h4>替代料总数: {altParts.length}</h4>
        </div>
        <Table 
          dataSource={altParts} 
          columns={columns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default AltTestPage;