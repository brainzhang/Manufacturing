import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Table, Button, Tag, Space, Tooltip } from 'antd';
import { CheckCircleOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import styles from './DiffTable.module.css?inline';

// 导入差异类型定义
import type { DiffType } from './DiffTree';

// 差异等级类型
export type DiffLevel = 'HIGH' | 'MEDIUM' | 'LOW';

// 差异数据接口
export interface DiffData {
  id: string;
  position: string;
  partName: string;
  diffType: DiffType;
  localValue: string;
  sapValue: string;
  deltaCost: number;
  deltaCompliance: string;
  level: DiffLevel;
  isIgnored?: boolean;
  isFixed?: boolean;
}

interface DiffTableProps {
  data: DiffData[];
  selectedKeys?: string[];
  onSelectRow: (keys: string[]) => void;
  onRowClick: (row: DiffData) => void;
  onFix: (id: string) => void;
  onIgnore: (id: string) => void;
  scrollToRow?: string;
}

const DiffTable: React.FC<DiffTableProps> = ({
  data,
  selectedKeys = [],
  onSelectRow,
  onRowClick,
  onFix,
  onIgnore,
  scrollToRow,
}) => {
  // 获取差异等级对应的标签颜色
  const getLevelColor = useCallback((level: DiffLevel): string => {
    switch (level) {
      case 'HIGH':
        return '#ff4d4f';
      case 'MEDIUM':
        return '#fa8c16';
      case 'LOW':
        return '#1890ff';
      default:
        return '#d9d9d9';
    }
  }, []);

  // 获取差异类型的显示文本
  const getDiffTypeText = useCallback((diffType: DiffType): string => {
    const typeMap: Record<DiffType, string> = {
      'ADD': '添加',
      'DELETE': '删除',
      'LIFE_CYCLE': '生命周期',
      'COST': '成本',
      'COMPLIANCE': '合规',
      'FIXED': '已修复',
    };
    return typeMap[diffType] || diffType;
  }, []);

  // 处理行点击
  const handleRowClick = useCallback((record: DiffData) => {
    onRowClick(record);
  }, [onRowClick]);

  // 行选择配置 - 使用useMemo优化
  const rowSelection = useMemo<TableProps<DiffData>['rowSelection']>((): TableProps<DiffData>['rowSelection'] => ({
    selectedRowKeys: selectedKeys,
    onChange: (selectedRowKeys) => {
      onSelectRow(selectedRowKeys as string[]);
    },
    getCheckboxProps: (record) => ({
      disabled: record.isFixed || record.isIgnored,
    }),
    columnWidth: 28, // 减少30%（从默认约40px减少到28px）
  }), [selectedKeys, onSelectRow]);

  // 表格列定义 - 使用useMemo优化
  const columns = useMemo<ColumnsType<DiffData>>(() => [
    {
      title: '位号',
      dataIndex: 'position',
      key: 'position',
      width: 150,
      ellipsis: true,
      render: (text, record) => (
        <Tooltip title={text}>
          <span className={record.isFixed ? styles.fixedText : ''}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '零件名称',
      dataIndex: 'partName',
      key: 'partName',
      width: 180,
      ellipsis: true,
      render: (text, record) => (
        <Tooltip title={text}>
          <span className={record.isFixed ? styles.fixedText : ''}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '差异类型',
      dataIndex: 'diffType',
      key: 'diffType',
      width: 100,
      render: (text) => getDiffTypeText(text),
    },
    {
      title: '本地值',
      dataIndex: 'localValue',
      key: 'localValue',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'SAP值',
      dataIndex: 'sapValue',
      key: 'sapValue',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Δ成本',
      dataIndex: 'deltaCost',
      key: 'deltaCost',
      width: 100,
      render: (value) => (
        <span className={value > 0 ? styles.costIncrease : value < 0 ? styles.costDecrease : ''}>
          ¥{value.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Δ合规',
      dataIndex: 'deltaCompliance',
      key: 'deltaCompliance',
      width: 120,
      ellipsis: true,
      render: (text) => (
        text.includes('Missing') ? (
          <Tag color="error">{text}</Tag>
        ) : (
          text
        )
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (text) => (
        <Tag color={getLevelColor(text)}>{text}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 168, // 增加40%（从120px增加到168px）
      fixed: 'right',
      render: (_, record) => {
        if (record.isFixed) {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>已修复</Tag>
          );
        }
        
        if (record.isIgnored) {
          return (
            <Tag color="default" icon={<ExclamationCircleOutlined />}>已忽略</Tag>
          );
        }
        
        return (
          <Space size="small">
            <Button
              size="small"
              type="primary"
              onClick={() => onFix(record.id)}
              icon={<CheckCircleOutlined />}
            >修复</Button>
            <Button
              size="small"
              danger
              onClick={() => onIgnore(record.id)}
              icon={<DeleteOutlined />}
            >忽略</Button>
          </Space>
        );
      },
    },
  ], [getDiffTypeText, getLevelColor, onFix, onIgnore]);

  // 滚动到指定行
  useEffect(() => {
    if (scrollToRow) {
      const rowElement = document.getElementById(`diff-row-${scrollToRow}`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rowElement.classList.add(styles.highlightRow);
        // 3秒后移除高亮
        setTimeout(() => {
          rowElement.classList.remove(styles.highlightRow);
        }, 3000);
      }
    }
  }, [scrollToRow]);

  // 启用虚拟滚动
  const virtualEnabled = true;

  return (
    <div className={styles.diffTableContainer}>
      <h3 className={styles.tableTitle}>差异明细表格</h3>
      <div className={styles.tableSubtitle}>共 {data.length} 条差异记录</div>
      
      <Table
        className={styles.table}
        rowKey="id"
        columns={columns}
        dataSource={data}
        rowSelection={rowSelection}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          id: `diff-row-${record.id}`,
          className: record.id === scrollToRow ? styles.highlightRow : '',
        })}
        scroll={{
          x: 1300, // 确保表格可以水平滚动
          y: 1200, // 增加高度50%（从800px增加到1200px）
        }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100', '200'],
          showTotal: (total) => `共 ${total} 条`,
        }}
        virtual={virtualEnabled} // 启用虚拟滚动以支持大数据量
        sticky={{ offsetHeader: 0 }}
      />
    </div>
  );
};

// 使用React.memo优化组件渲染性能
export default React.memo(DiffTable);