import React from 'react';
import { Card, Row, Col, Statistic, Progress, Badge } from 'antd';

const StatisticsPanel = ({ statistics, style }) => {
  const {
    totalParts = 0,
    totalCost = 0,
    totalSuppliers = 0,
    totalAlternatives = 0,
    missingParts = 0,
    warningParts = 0
  } = statistics;

  return (
    <Card title="BOM统计信息" style={style}>
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="总零件数"
            value={totalParts}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="总成本"
            value={totalCost}
            precision={2}
            prefix="¥"
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="供应商数"
            value={totalSuppliers}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="替代料数"
            value={totalAlternatives}
            valueStyle={{ color: '#13c2c2' }}
          />
        </Col>
      </Row>
      
      {(missingParts > 0 || warningParts > 0) && (
        <Row gutter={16} style={{ marginTop: 16 }}>
          {missingParts > 0 && (
            <Col span={12}>
              <Statistic
                title="缺失零件"
                value={missingParts}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<Badge status="error" />}
              />
            </Col>
          )}
          {warningParts > 0 && (
            <Col span={12}>
              <Statistic
                title="警告零件"
                value={warningParts}
                valueStyle={{ color: '#faad14' }}
                prefix={<Badge status="warning" />}
              />
            </Col>
          )}
        </Row>
      )}
    </Card>
  );
};

export default StatisticsPanel;