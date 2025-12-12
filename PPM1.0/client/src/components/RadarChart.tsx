import React from 'react';
import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import styles from './RadarChart.module.css?inline';

interface RadarDataPoint {
  subject: string;
  A: number; // 本地值
  B: number; // SAP值
}

interface RadarChartProps {
  data: RadarDataPoint[];
  onSubjectClick: (subject: string) => void;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, onSubjectClick }) => {
  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{`${label}`}</p>
          <p className={styles.tooltipItemLocal}>{`本地: ${payload[0].value}`}</p>
          <p className={styles.tooltipItemSAP}>{`SAP: ${payload[1].value}`}</p>
          <p className={styles.tooltipDiff}>
            {`差异: ${Math.abs(payload[0].value - payload[1].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // 处理雷达区域点击
  const handleClick = (data: any) => {
    if (data && data.payload) {
      onSubjectClick(data.payload.subject);
    }
  };

  return (
    <div className={styles.radarChartContainer}>
      <h3 className={styles.chartTitle}>差异雷达图</h3>
      <div className={styles.chartSubtitle}>本地 vs SAP 数据对比</div>
      
      <ResponsiveContainer width="100%" height={480}>
        <RechartsRadarChart outerRadius={180} data={data} onClick={handleClick}>
          <PolarGrid stroke="#e8e8e8" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#666', fontSize: 14 }}
            stroke="#d9d9d9"
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tickCount={6}
            tick={{ fill: '#999', fontSize: 12 }}
          />
          
          <Radar
            name="本地"
            dataKey="A"
            stroke="#1890ff"
            fill="#1890ff"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name="SAP"
            dataKey="B"
            stroke="#52c41a"
            fill="#52c41a"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => (
              <span style={{ padding: '0 8px' }}>{value}</span>
            )}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
      
      <div className={styles.chartFooter}>
        <p className={styles.clickHint}>点击雷达区域可筛选对应差异类型</p>
      </div>
    </div>
  );
};

export default RadarChart;