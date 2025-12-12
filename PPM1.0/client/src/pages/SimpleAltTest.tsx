import React from 'react';
import { Layout, Card, message } from 'antd';
import AltPoolTable, { AltNode } from '../components/AltPoolTable';

const { Content } = Layout;

const SimpleAltTest: React.FC = () => {
  // 严格按照AltPoolTable需要的数据格式创建mock数据
  const mockAltParts: AltNode[] = [
    {
      id: 'ALT-001',
      parentId: 'CPU-MAIN-001',
      group: 'A',
      partId: 'CPU-ALT-001',
      partName: '替代CPU型号A',
      qty: 1,
      cost: 299.99,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE', 'ISO9001'],
      fffScore: 95,
      isDefault: true,
      status: 'Active'
    },
    {
      id: 'ALT-002',
      parentId: 'CPU-MAIN-001',
      group: 'A',
      partId: 'CPU-ALT-002',
      partName: '替代CPU型号B',
      qty: 1,
      cost: 279.99,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE'],
      fffScore: 90,
      isDefault: false,
      status: 'Active'
    }
  ];

  const selectedMainPart = {
    id: 'CPU-MAIN-001',
    partNumber: 'CPU-MAIN-001',
    name: 'Intel Core i7-11700K',
    cost: 329.99
  };

  const [selectedRows, setSelectedRows] = React.useState<AltNode[]>([]);

  const handleRowSelect = (record: AltNode, selected: boolean) => {
    console.log('选择行:', record.partName, selected);
    if (selected) {
      setSelectedRows([...selectedRows, record]);
    } else {
      setSelectedRows(selectedRows.filter(row => row.id !== record.id));
    }
  };

  const handleRowClick = (record: AltNode) => {
    console.log('点击行:', record.partName);
    message.info(`点击了: ${record.partName}`);
  };

  const handleSetDefault = (id: string) => {
    console.log('设为默认:', id);
    message.success('已设为默认替代料');
  };

  const handleDeprecate = (id: string) => {
    console.log('废弃替代料:', id);
    message.success('已废弃替代料');
  };

  return (
    <Layout className="min-h-screen">
      <Content className="p-6">
        <Card title="替代料表格测试" className="mb-4">
          <p>本页面用于直接测试AltPoolTable组件</p>
          <p>主料: {selectedMainPart.partNumber} - {selectedMainPart.name}</p>
          <p>替代料数量: {mockAltParts.length}</p>
        </Card>
        
        <AltPoolTable
          dataSource={mockAltParts}
          selectedMainPart={selectedMainPart}
          selectedRows={selectedRows}
          onRowSelect={handleRowSelect}
          onRowClick={handleRowClick}
          onSetDefault={handleSetDefault}
          onDeprecate={handleDeprecate}
        />
      </Content>
    </Layout>
  );
};

export default SimpleAltTest;