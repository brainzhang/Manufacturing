import React, { useState, useCallback, useEffect } from 'react';
import { Layout, Row, Col, Card, Progress, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import styles from './DifferenceRadarPage.module.css?inline';

// 导入子组件
import RadarChart from '../components/RadarChart.tsx';
import DiffTree from '../components/DiffTree.tsx';
import DiffTable from '../components/DiffTable.tsx';
import DiffDrawer from '../components/DiffDrawer.tsx';
import OneClickSyncBtn from '../components/OneClickSyncBtn.tsx';

// 导入钩子
import useDiffSync from '../hooks/useDiffSync.ts';

const { Content, Footer } = Layout;

const DifferenceRadarPage: React.FC = () => {
  // 使用自定义钩子管理状态和逻辑
  const {
    diffData,
    treeData,
    radarData,
    kpiStats,
    selectedDiffIds,
    syncStatus,
    syncProgress,
    syncableCount,
    setSelectedDiffIds,
    fixDiff,
    ignoreDiff,
    fixSelectedDiffs,
    ignoreSelectedDiffs,
    oneClickSync,
    getFixSuggestion,
  } = useDiffSync();

  // 本地状态
  const [selectedDiff, setSelectedDiff] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRadarSubject, setSelectedRadarSubject] = useState<string | null>(null);
  const [filteredDiffData, setFilteredDiffData] = useState(diffData);
  
  // 当diffData更新时，同步更新filteredDiffData（除非有特定筛选条件）
  useEffect(() => {
    if (!selectedRadarSubject) {
      setFilteredDiffData(diffData);
    }
  }, [diffData, selectedRadarSubject]);

  // 处理雷达图点击
  const handleRadarClick = useCallback((subject: string) => {
    setSelectedRadarSubject(subject);
    // 根据雷达图区域筛选差异数据
    let filtered: any[] = diffData;
    
    switch (subject) {
      case '结构':
        filtered = diffData.filter(d => d.diffType === 'ADD' || d.diffType === 'DELETE');
        break;
      case '成本':
        filtered = diffData.filter(d => d.diffType === 'COST' || d.deltaCost !== 0);
        break;
      case '生命周期':
        filtered = diffData.filter(d => d.diffType === 'LIFE_CYCLE');
        break;
      case '合规':
        filtered = diffData.filter(d => d.diffType === 'COMPLIANCE' || d.deltaCompliance.includes('Missing'));
        break;
      default:
        filtered = diffData;
    }
    
    setFilteredDiffData(filtered);
    message.info(`已筛选 ${subject} 相关差异，共 ${filtered.length} 项`);
  }, [diffData]);

  // 处理差异详情查看
  const handleViewDiff = useCallback((diff: any) => {
    setSelectedDiff(diff);
    setDrawerVisible(true);
  }, []);

  // 处理差异修复
  const handleFix = useCallback(async (diff: any) => {
    await fixDiff(diff.id);
    // 由于fixDiff返回void，我们直接关闭抽屉
    setDrawerVisible(false);
  }, [fixDiff]);

  // 处理差异忽略
  const handleIgnore = useCallback(async (diff: any) => {
    await ignoreDiff(diff.id);
    // 由于ignoreDiff返回void，我们直接关闭抽屉
    setDrawerVisible(false);
  }, [ignoreDiff]);

  // 处理批量修复
  const handleBatchFix = useCallback(async () => {
    fixSelectedDiffs();
  }, [fixSelectedDiffs]);

  // 处理批量忽略
  const handleBatchIgnore = useCallback(async () => {
    ignoreSelectedDiffs();
  }, [ignoreSelectedDiffs]);

  // 处理导出差异表
  const handleExport = useCallback(() => {
    message.success('正在导出差异表...');
    // 模拟导出操作
    setTimeout(() => {
      message.success('差异表导出成功');
    }, 1500);
  }, []);

  // 格式化成本
  const formatCost = (cost: number) => {
    const sign = cost >= 0 ? '+' : '';
    return `¥${sign}${cost.toLocaleString()}`;
  };
  
  // 准备KPI数据展示
  const displayKpiStats = {
    totalDiffCount: kpiStats.totalDiffs,
    trend: `${kpiStats.trend > 0 ? '+' : ''}${kpiStats.trend}%`,
    highMediumLow: { high: kpiStats.highLevel, medium: kpiStats.mediumLevel, low: kpiStats.lowLevel },
    costDrift: kpiStats.costDrift,
    costTrend: `${kpiStats.costTrend > 0 ? '+' : ''}${kpiStats.costTrend}%`,
    complianceGap: kpiStats.complianceGaps,
    complianceTrend: `${kpiStats.complianceTrend > 0 ? '+' : ''}${kpiStats.complianceTrend}`
  };

  return (
    <Layout className={styles.layout}>
      {/* 顶部进度条 */}
      {syncStatus === 'syncing' && (
        <Progress 
          percent={syncProgress.current} 
          status="active" 
          showInfo={true}
          format={() => syncProgress.message}
          strokeColor="#1890ff"
          className={styles.syncProgress}
        />
      )}

      {/* 顶部雷达看板 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.pageTitle}>
            <h1>差异雷达</h1>
            <p className={styles.pageSubtitle}>当前版本 vs 基准版本对比</p>
          </div>
          <Row className={styles.kpiCards} gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className={styles.kpiCard}>
                <div className={styles.kpiTitle}>总差异数</div>
                <div className={styles.kpiValue}>{displayKpiStats.totalDiffCount}</div>
                <div className={styles.kpiTrend}>
                  <span className={displayKpiStats.trend.includes('-') ? styles.trendDown : styles.trendUp}>
                    {displayKpiStats.trend}
                  </span>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className={styles.kpiCard}>
                <div className={styles.kpiTitle}>高/中/低</div>
                <div className={styles.kpiValue}>
                  {displayKpiStats.highMediumLow.high}/{displayKpiStats.highMediumLow.medium}/{displayKpiStats.highMediumLow.low}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className={styles.kpiCard}>
                <div className={styles.kpiTitle}>成本漂移</div>
                <div className={`${styles.kpiValue} ${displayKpiStats.costDrift > 0 ? styles.costUp : styles.costDown}`}>
                  {formatCost(displayKpiStats.costDrift)}
                </div>
                <div className={styles.kpiTrend}>
                  <span className={displayKpiStats.costTrend.includes('-') ? styles.trendDown : styles.trendUp}>
                    {displayKpiStats.costTrend}
                  </span>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className={styles.kpiCard}>
                <div className={styles.kpiTitle}>合规缺口</div>
                <div className={styles.kpiValue}>{displayKpiStats.complianceGap}</div>
                <div className={styles.kpiTrend}>
                  <span className={displayKpiStats.complianceTrend.includes('-') ? styles.trendDown : styles.trendUp}>
                    {displayKpiStats.complianceTrend}%
                  </span>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* 雷达图中间区域 */}
      <div className={styles.radarMiddleSection}>
        <Row gutter={16} style={{ marginBottom: '24px', marginTop: '24px' }}>
          <Col span={24}>
            <Card className={styles.radarCard}>
              <RadarChart
                data={radarData}
                onSubjectClick={handleRadarClick}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 主要内容区域 */}
      <Content className={styles.content}>
        <Row gutter={16} className={styles.mainContent}>
          {/* 左侧差异树 */}
          <Col xs={24} md={8} className={styles.treeColumn}>
          <Card className={styles.treeCard}>
            <DiffTree
            data={treeData}
            onNodeClick={(key) => {
              // 当点击树节点时，滚动到表格对应行或显示详情
              const clickedDiff = filteredDiffData.find(d => d.id === key || d.position === key);
              if (clickedDiff) {
                handleViewDiff(clickedDiff);
              }
            }}
            onFixBranch={(key) => {
              message.info(`正在修复分支: ${key}`);
              // 这里可以实现修复整个分支的逻辑
            }}
            loading={syncStatus === 'syncing'}
          />
          </Card>
        </Col>
          
          {/* 中部差异表格 */}
          <Col xs={24} md={16} className={styles.tableColumn}>
            <Card className={styles.tableCard}>
              <DiffTable
              data={filteredDiffData}
              selectedKeys={selectedDiffIds}
              onSelectRow={setSelectedDiffIds}
              onRowClick={handleViewDiff}
              onFix={(id) => {
                const diff = filteredDiffData.find(d => d.id === id);
                if (diff) handleFix(diff);
              }}
              onIgnore={(id) => {
                const diff = filteredDiffData.find(d => d.id === id);
                if (diff) handleIgnore(diff);
              }}
            />
            </Card>
          </Col>
        </Row>
      </Content>

      {/* 底部批量操作栏 */}
      {selectedDiffIds.length > 0 && (
        <Footer className={styles.footer}>
          <div className={styles.batchActions}>
            <button 
              className={styles.batchButton} 
              onClick={handleBatchIgnore}
            >
              批量忽略 ({selectedDiffIds.length})
            </button>
            <button 
              className={`${styles.batchButton} ${styles.primaryButton}`}
              onClick={handleBatchFix}
            >
              一键修复选中 ({selectedDiffIds.length})
            </button>
            <button 
              className={styles.batchButton}
              onClick={handleExport}
            >
              导出差异表
            </button>
          </div>
        </Footer>
      )}

      {/* 差异详情抽屉 */}
      <DiffDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        diffData={selectedDiff || undefined}
        fixSuggestion={undefined} // 暂时不传递，需要异步处理
        onOneClickFix={() => selectedDiff && handleFix(selectedDiff)}
        onIgnore={() => selectedDiff && handleIgnore(selectedDiff)}
        onManualFix={() => {
          message.info('打开替代料选择器');
          // 实现手动修复逻辑
        }}
      />

      {/* 一键同步浮动按钮 */}
      <OneClickSyncBtn
        onClick={oneClickSync}
        loading={syncStatus === 'syncing'}
        progress={syncProgress.current}
        syncableCount={syncableCount}
        disabled={syncStatus === 'success' || syncStatus === 'error'}
      />
    </Layout>
  );
};

export default DifferenceRadarPage;