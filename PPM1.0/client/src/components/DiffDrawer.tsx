import React from 'react';
import { Drawer, Button, Descriptions, Card, Progress, Divider, Tag } from 'antd';
import { CheckCircleOutlined, EditOutlined, DeleteOutlined, AlertOutlined } from '@ant-design/icons';
import type { DiffData } from './DiffTable';
import styles from './DiffDrawer.module.css?inline';

// 修复建议接口
interface FixSuggestion {
  suggestion: string;
  confidence: number;
  reason: string;
}

// 差异快照项接口
interface DiffSnapshotItem {
  field: string;
  localValue: string | number;
  sapValue: string | number;
  delta: string | number;
  isCritical?: boolean;
}

interface DiffDrawerProps {
  visible: boolean;
  diffData?: DiffData;
  fixSuggestion?: FixSuggestion;
  onClose: () => void;
  onOneClickFix: () => void;
  onManualFix: () => void;
  onIgnore: () => void;
  loading?: boolean;
}

const DiffDrawer: React.FC<DiffDrawerProps> = ({
  visible,
  diffData,
  fixSuggestion,
  onClose,
  onOneClickFix,
  onManualFix,
  onIgnore,
  loading = false,
}) => {
  // 生成差异快照数据
  const generateSnapshotData = (): DiffSnapshotItem[] => {
    if (!diffData) return [];

    const snapshot: DiffSnapshotItem[] = [
      {
        field: '用量',
        localValue: 1,
        sapValue: diffData.diffType === 'DELETE' ? 0 : 1,
        delta: diffData.diffType === 'DELETE' ? -1 : 0,
        isCritical: diffData.diffType === 'DELETE' || diffData.diffType === 'ADD',
      },
      {
        field: '成本',
        localValue: diffData.localValue.includes('¥') 
          ? parseInt(diffData.localValue.replace(/[^\d]/g, '')) 
          : 4500,
        sapValue: diffData.sapValue.includes('¥') 
          ? parseInt(diffData.sapValue.replace(/[^\d]/g, '')) 
          : 0,
        delta: diffData.deltaCost,
        isCritical: Math.abs(diffData.deltaCost) > 1000,
      },
      {
        field: '生命周期',
        localValue: diffData.localValue || 'Active',
        sapValue: diffData.sapValue || 'PhaseOut',
        delta: diffData.localValue !== diffData.sapValue ? '🔴' : '🟢',
        isCritical: diffData.diffType === 'LIFE_CYCLE',
      },
    ];

    // 如果有合规差异，添加到快照中
    if (diffData.deltaCompliance) {
      snapshot.push({
        field: '合规状态',
        localValue: diffData.deltaCompliance.includes('Missing') ? '不完整' : '完整',
        sapValue: '完整',
        delta: diffData.deltaCompliance.includes('Missing') ? '🔴' : '🟢',
        isCritical: diffData.deltaCompliance.includes('Missing'),
      });
    }

    return snapshot;
  };

  // 格式化数字为货币
  const formatCurrency = (value: number): string => {
    return `¥${value.toLocaleString()}`;
  };

  // 渲染差异值
  const renderDelta = (delta: any, isCritical: boolean): React.ReactNode => {
    if (typeof delta === 'number') {
      return (
        <span className={
          isCritical ? styles.deltaCritical 
          : delta > 0 ? styles.deltaIncrease 
          : delta < 0 ? styles.deltaDecrease 
          : ''
        }>
          {delta > 0 ? '+' : ''}{formatCurrency(delta)}
        </span>
      );
    }
    return (
      <span className={isCritical ? styles.deltaCritical : ''}>
        {delta}
      </span>
    );
  };

  const snapshotData = generateSnapshotData();

  return (
    <Drawer
      title="差异详情"
      placement="right"
      onClose={onClose}
      open={visible}
      width={500}
      destroyOnClose
      className={styles.drawer}
    >
      <div className={styles.content}>
        {/* 差异基本信息 */}
        {diffData && (
          <Card className={styles.infoCard}
            title="差异基本信息"
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="位号">{diffData.position}</Descriptions.Item>
              <Descriptions.Item label="零件名称">{diffData.partName}</Descriptions.Item>
              <Descriptions.Item label="差异类型">{diffData.diffType}</Descriptions.Item>
              <Descriptions.Item label="等级">
                <Tag color={
                  diffData.level === 'HIGH' ? 'red'
                  : diffData.level === 'MEDIUM' ? 'orange'
                  : 'blue'
                }>
                  {diffData.level}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <Divider />

        {/* 差异快照 - 列表形式带表格框 */}
        <Card className={styles.snapshotCard}
          title="差异快照 (本地 vs SAP)"
          size="small"
        >
          <div className={styles.snapshotTable}>
            <table className={styles.listTable}>
              <thead>
                <tr>
                  <th className={styles.tableHeader}>字段</th>
                  <th className={styles.tableHeader}>本地值</th>
                  <th className={styles.tableHeader}>SAP值</th>
                  <th className={styles.tableHeader}>差异</th>
                </tr>
              </thead>
              <tbody>
                {snapshotData.map((item, index) => (
                  <tr key={index} className={`${styles.tableRow} ${item.isCritical ? styles.criticalRow : ''}`}>
                    <td className={styles.tableCell}>
                      <div className={styles.cellContent}>
                        <span className={styles.snapshotField}>{item.field}</span>
                        {item.isCritical && <Tag color="red" className={styles.criticalTag}>重要差异</Tag>}
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.snapshotLocal}>
                        {typeof item.localValue === 'number' 
                          ? formatCurrency(item.localValue) 
                          : item.localValue
                        }
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.snapshotSAP}>
                        {typeof item.sapValue === 'number' 
                          ? formatCurrency(item.sapValue) 
                          : item.sapValue
                        }
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.snapshotDelta}>
                        {renderDelta(item.delta, item.isCritical || false)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Divider />

        {/* 修复建议 */}
        <Card className={styles.suggestionCard}
          title="AI修复建议"
          size="small"
          extra={
            fixSuggestion && (
              <Progress
                percent={Math.round(fixSuggestion.confidence * 100)}
                size="small"
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            )
          }
        >
          {fixSuggestion ? (
            <div className={styles.suggestionContent}>
              <div className={styles.suggestionText}>
                <AlertOutlined /> {fixSuggestion.suggestion}
              </div>
              <div className={styles.suggestionReason}>
                <strong>理由:</strong> {fixSuggestion.reason}
              </div>
              <div className={styles.confidenceLevel}>
                置信度: 
                <Tag color="green">
                  {Math.round(fixSuggestion.confidence * 100)}%
                </Tag>
              </div>
            </div>
          ) : (
            <div className={styles.noSuggestion}>
              暂无修复建议，请手动处理
            </div>
          )}
        </Card>

        <Divider />

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={onOneClickFix}
            loading={loading}
            disabled={!fixSuggestion || fixSuggestion.confidence < 0.5}
            className={styles.actionButton}
          >
            一键修复
          </Button>
          
          <Button
            icon={<EditOutlined />}
            onClick={onManualFix}
            className={styles.actionButton}
          >
            手动修复
          </Button>
          
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={onIgnore}
            className={styles.actionButton}
          >
            忽略
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default DiffDrawer;