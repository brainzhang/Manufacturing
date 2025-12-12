import React from 'react';
import { Table, Button, Tag, Popconfirm } from 'antd';
import { StarOutlined, StarFilled, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

// 替代料节点数据结构
export interface AltNode {
  id: string;               // UUID
  parentId: string;         // L6主料ID
  group: 'A' | 'B' | 'C';   // 替代组
  partId: string;           // 替代料PN
  partName: string;         // 零件名称
  qty: number;              // 用量（默认=主料）
  cost: number;             // 当前成本
  lifecycle: 'Active' | 'PhaseOut' | 'Obs';
  compliance: string[];     // RoHS/CE/FCC…
  fffScore: number;         // Form-Fit-Function 匹配度(0-100)
  isDefault: boolean;       // 是否默认首选
  status: 'Active' | 'Deprecated'; // 业务状态
}

interface AltPoolTableProps {
  dataSource: AltNode[];
  selectedMainPart?: { id: string; partNumber: string; name: string; cost: number } | null;
  selectedRows: AltNode[];
  onRowSelect: (record: AltNode, selected: boolean) => void;
  onRowClick: (record: AltNode) => void;
  onSetDefault: (id: string) => void;
  onDeprecate: (id: string) => void;
}

const AltPoolTable: React.FC<AltPoolTableProps> = ({
  dataSource,
  selectedMainPart,
  selectedRows,
  onRowSelect,
  onRowClick,
  onSetDefault,
  onDeprecate
}) => {
  // 获取替代料行的背景颜色
  const getRowClassName = (record: AltNode): string => {
    let className = '';
    
    if (!selectedMainPart) return className;
    
    if (record.lifecycle === 'PhaseOut') {
      className = 'bg-red-50';
    } else if (record.cost >= selectedMainPart.cost) {
      className = 'bg-orange-50';
    } else if (record.compliance.length >= 3) {
      className = 'bg-green-50';
    }
    
    return className;
  };

  // 获取FFF分数的颜色
  const getFFFScoreColor = (score: number): string => {
    if (score >= 95) return 'text-green-600';
    if (score >= 80) return 'text-orange-600';
    return 'text-red-600';
  };

  // 列配置
  const columns = [
    {
      title: '位号',
      dataIndex: 'partId',
      key: 'partId',
      width: 80
    },
    {
      title: '零件名称',
      dataIndex: 'partName',
      key: 'partName',
      sorter: (a: AltNode, b: AltNode) => a.partName.localeCompare(b.partName)
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (cost: number) => `¥${cost}`,
      sorter: (a: AltNode, b: AltNode) => a.cost - b.cost
    },
    {
      title: '生命周期',
      dataIndex: 'lifecycle',
      key: 'lifecycle',
      width: 120,
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'PhaseOut', value: 'PhaseOut' },
        { text: 'Obs', value: 'Obs' }
      ],
      onFilter: (value: string, record: AltNode) => record.lifecycle === value
    },
    {
      title: '合规',
      key: 'compliance',
      width: 80,
      render: (_, record: AltNode) => (
        record.compliance.length >= 3 ? (
          <CheckCircleOutlined className="text-green-600" />
        ) : (
          <ExclamationCircleOutlined className="text-orange-600" />
        )
      )
    },
    {
      title: 'FFF',
      dataIndex: 'fffScore',
      key: 'fffScore',
      width: 80,
      render: (score: number) => (
        <span className={getFFFScoreColor(score)}>{score}</span>
      ),
      sorter: (a: AltNode, b: AltNode) => a.fffScore - b.fffScore
    },
    {
      title: '默认',
      key: 'isDefault',
      width: 80,
      render: (_, record: AltNode) => (
        record.isDefault ? (
          <StarFilled className="text-yellow-500" />
        ) : (
          <StarOutlined className="text-gray-300" />
        )
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record: AltNode) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="small"
            type="primary"
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault(record.id);
            }}
          >
            设为默认
          </Button>
          <Popconfirm
            title="确认弃用此替代料？"
            onConfirm={() => onDeprecate(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              size="small"
              danger
              onClick={(e) => e.stopPropagation()}
            >
              弃用
            </Button>
          </Popconfirm>
        </div>
      )
    }
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={dataSource}
      rowClassName={getRowClassName}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
      }}
      onRow={(record) => ({
        onClick: () => onRowClick(record),
      })}
      rowSelection={{
        selectedRowKeys: selectedRows.map(row => row.id),
        onChange: (_, selectedRows) => {
          dataSource.forEach(record => {
            const isSelected = selectedRows.some((row: AltNode) => row.id === record.id);
            onRowSelect(record, isSelected);
          });
        }
      }}
    />
  );
};

export default AltPoolTable;