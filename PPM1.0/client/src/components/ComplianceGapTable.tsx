import React, { useState, useMemo } from 'react';
import { Table, Tag, Button, Space, DatePicker, Select, Input, Spin, Tooltip } from 'antd';
import { CarOutlined, EditOutlined, SwapOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

interface ComplianceGapTableProps {
  onPartClick: (record: GapRecord) => void;
  onAddToComparison: (record: GapRecord) => void;
  onRemediation: (record: GapRecord) => void;
  onReplace: (record: GapRecord) => void;
  onRowSelect: (selectedRows: GapRecord[]) => void;
  loading?: boolean;
  data?: GapRecord[];
}

export interface GapRecord {
  id: string;
  position: string;
  partName: string;
  missingCerts: string[];
  expireDate: string;
  supplier: string;
  status: 'expiring' | 'missing';
}

const ComplianceGapTable: React.FC<ComplianceGapTableProps> = ({
  onPartClick,
  onAddToComparison,
  onRemediation,
  onReplace,
  onRowSelect,
  loading = false,
  data
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
    const tableData = data || mockData;
    const selectedRows = tableData.filter((_, index) => 
      newSelectedRowKeys.includes(tableData[index].id)
    );
    onRowSelect(selectedRows);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  // 过滤状态
  const [certTypeFilter, setCertTypeFilter] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<[string, string] | null>(null);
  const [searchText, setSearchText] = useState<string>('');

  // 模拟缺口数据（当没有传入数据时使用）
  const mockData: GapRecord[] = [
    {
      id: '1',
      position: 'U1',
      partName: 'i7-1555U处理器',
      missingCerts: ['RoHS', 'CE'],
      expireDate: '2025-08-01',
      supplier: 'Intel',
      status: 'expiring'
    },
    {
      id: '2',
      position: 'PCB-001',
      partName: '主控电路板',
      missingCerts: ['UL', 'RoHS'],
      expireDate: '2025-01-15',
      supplier: 'PCB制造商',
      status: 'missing'
    },
    {
      id: '3',
      position: 'PWR-001',
      partName: '电源模块',
      missingCerts: ['CE', 'FCC'],
      expireDate: '2025-05-15',
      supplier: '电源供应商',
      status: 'expiring'
    },
    {
      id: '4',
      position: 'LCD-001',
      partName: '液晶显示屏',
      missingCerts: ['RoHS', 'REACH'],
      expireDate: '2025-12-01',
      supplier: '显示屏供应商',
      status: 'missing'
    },
    {
      id: '5',
      position: 'MEM-001',
      partName: '内存模块',
      missingCerts: ['RoHS'],
      expireDate: '2024-11-30',
      supplier: '内存供应商',
      status: 'expiring'
    }
  ];

  // 使用传入的数据或模拟数据
  const tableData = data || mockData;

  // 根据到期日期计算颜色
  const getExpireColor = (expireDate: string): string => {
    const today = new Date();
    const expire = new Date(expireDate);
    const diffDays = Math.ceil((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      return 'error';
    } else if (diffDays <= 90) {
      return 'warning';
    }
    return 'default';
  };

  // 过滤数据
  const filteredData = useMemo(() => {
    return tableData.filter(record => {
      // 搜索文本过滤
      if (searchText && !record.partName.includes(searchText) && !record.position.includes(searchText) && !record.supplier.includes(searchText)) {
        return false;
      }

      // 认证类型过滤
      if (certTypeFilter && !record.missingCerts.includes(certTypeFilter)) {
        return false;
      }

      // 供应商过滤
      if (supplierFilter && record.supplier !== supplierFilter) {
        return false;
      }

      // 日期范围过滤
      if (dateRangeFilter) {
        const [start, end] = dateRangeFilter;
        const recordDate = new Date(record.expireDate);
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (recordDate < startDate || recordDate > endDate) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // 默认按证书到期升序
      return new Date(a.expireDate).getTime() - new Date(b.expireDate).getTime();
    });
  }, [tableData, searchText, certTypeFilter, supplierFilter, dateRangeFilter]);

  // 表格列配置
  const columns: ColumnsType<GapRecord> = [
    {
      title: '位号',
      dataIndex: 'position',
      key: 'position',
      width: 80
    },
    {
      title: '零件名称',
      dataIndex: 'partName',
      key: 'partName'
    },
    {
      title: '缺失认证',
      key: 'missingCerts',
      render: (_, record) => (
        <Space>
          {record.missingCerts.map((cert, index) => (
            <Tag key={index} color="blue">{cert}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '证书到期',
      dataIndex: 'expireDate',
      key: 'expireDate',
      render: (expireDate) => (
        <Tag color={getExpireColor(expireDate)}>
          {expireDate}
        </Tag>
      ),
      sorter: (a, b) => new Date(a.expireDate).getTime() - new Date(b.expireDate).getTime()
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier'
    },
    {title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="整改">
            <Button 
              type="primary" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => onRemediation(record)}
              style={{ backgroundColor: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="加入对比">
            <Button 
              size="small" 
              icon={<CarOutlined />}
              onClick={() => onAddToComparison(record)}
            />
          </Tooltip>
        </Space>
      ),
      width: 120
    }
  ];

  // 处理日期范围变化
  const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    if (dates) {
      const [start, end] = dates;
      setDateRangeFilter([
        start?.format('YYYY-MM-DD') || '',
        end?.format('YYYY-MM-DD') || ''
      ]);
    } else {
      setDateRangeFilter(null);
    }
  };

  // 获取所有认证类型用于过滤
  const allCertTypes = useMemo(() => {
    const certs = new Set<string>();
    tableData.forEach(record => {
      record.missingCerts.forEach(cert => certs.add(cert));
    });
    return Array.from(certs);
  }, [tableData]);

  // 获取所有供应商用于过滤
  const allSuppliers = useMemo(() => {
    const suppliers = new Set<string>();
    tableData.forEach(record => suppliers.add(record.supplier));
    return Array.from(suppliers);
  }, [tableData]);

  return (
    <div>
      {/* 过滤区域 */}
      <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
        <Search
          placeholder="搜索零件名称/位号/供应商"
          allowClear
          onSearch={(value) => setSearchText(value)}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
        <Select
          placeholder="选择认证类型"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setCertTypeFilter(value)}
        >
          {allCertTypes.map(cert => (
            <Option key={cert} value={cert}>{cert}</Option>
          ))}
        </Select>
        <Select
          placeholder="选择供应商"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setSupplierFilter(value)}
        >
          {allSuppliers.map(supplier => (
            <Option key={supplier} value={supplier}>{supplier}</Option>
          ))}
        </Select>
        <RangePicker
          placeholder={['开始日期', '结束日期']}
          onChange={handleDateRangeChange}
        />
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
      loading={loading}
      onRow={(record) => ({
        onClick: () => onPartClick(record)
      })}
      rowSelection={rowSelection}
      pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
      />
    </div>
  );
};

export default ComplianceGapTable;