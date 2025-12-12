import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Typography, Statistic, Row, Col, Table, Button, Switch, Popover, Spin } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const { Title, Text, Paragraph } = Typography;

/**
 * 性能监控组件
 * 用于监控和分析应用性能指标，包括帧率、内存使用、组件渲染时间等
 */
const PerformanceMonitor = ({ 
  enabled = false, 
  samplingInterval = 1000, // 采样间隔（毫秒）
  maxHistoryPoints = 60,   // 最大历史数据点
  showInProduction = false, // 是否在生产环境显示
  children 
}) => {
  // 性能数据状态
  const [performanceData, setPerformanceData] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(enabled);
  const [memoryUsage, setMemoryUsage] = useState({ usedJSHeapSize: 0, totalJSHeapSize: 0 });
  const [fpsData, setFpsData] = useState([]);
  const [renderTimes, setRenderTimes] = useState({});
  const [slowComponents, setSlowComponents] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 引用
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const timerRef = useRef(null);
  const observerRef = useRef(null);
  
  // 检查是否在生产环境
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 如果在生产环境且不允许显示，则直接返回子组件
  if (isProduction && !showInProduction) {
    return <>{children}</>;
  }
  
  // 计算帧率
  const calculateFPS = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;
    
    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      
      setFpsData(prev => {
        const newData = [...prev, { time: now, fps }];
        // 保持数据点数量不超过最大限制
        return newData.slice(-maxHistoryPoints);
      });
      
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
    
    if (isMonitoring) {
      requestAnimationFrame(calculateFPS);
    }
  }, [isMonitoring, maxHistoryPoints]);
  
  // 监控内存使用
  const monitorMemory = useCallback(() => {
    if (window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      setMemoryUsage({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize
      });
    }
    
    if (isMonitoring) {
      timerRef.current = setTimeout(monitorMemory, samplingInterval);
    }
  }, [isMonitoring, samplingInterval]);
  
  // 格式化内存大小
  const formatMemorySize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 开始监控
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    lastTimeRef.current = performance.now();
    requestAnimationFrame(calculateFPS);
    monitorMemory();
    
    // 初始化性能观察者
    if (window.PerformanceObserver && window.PerformancePaintTiming) {
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        setPerformanceData(prev => {
          const newData = [...prev, ...entries];
          return newData.slice(-maxHistoryPoints);
        });
      });
      
      observerRef.current.observe({ type: 'paint', buffered: true });
    }
  }, [calculateFPS, monitorMemory, maxHistoryPoints]);
  
  // 停止监控
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);
  
  // 切换监控状态
  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  }, [isMonitoring, startMonitoring, stopMonitoring]);
  
  // 清除数据
  const clearData = useCallback(() => {
    setPerformanceData([]);
    setFpsData([]);
    setRenderTimes({});
    setSlowComponents([]);
  }, []);
  
  // 初始化
  useEffect(() => {
    if (enabled) {
      startMonitoring();
    }
    
    return () => {
      stopMonitoring();
    };
  }, [enabled, startMonitoring, stopMonitoring]);
  
  // 监控组件渲染时间的HOC
  const withRenderTime = (Component, componentName) => {
    return (props) => {
      const startTime = useRef(0);
      
      // 记录渲染开始时间
      React.useLayoutEffect(() => {
        startTime.current = performance.now();
      }, []);
      
      // 记录渲染结束时间
      React.useEffect(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTime.current;
        
        setRenderTimes(prev => ({
          ...prev,
          [componentName]: renderTime
        }));
        
        // 如果渲染时间超过16ms（60fps的预算），则记录为慢组件
        if (renderTime > 16) {
          setSlowComponents(prev => {
            const exists = prev.find(item => item.name === componentName);
            if (exists) {
              return prev.map(item => 
                item.name === componentName 
                  ? { ...item, renderTime, lastSeen: new Date() }
                  : item
              );
            } else {
              return [...prev, { name: componentName, renderTime, lastSeen: new Date() }];
            }
          });
        }
      }, [componentName]);
      
      return <Component {...props} />;
    };
  };
  
  // 获取最近的帧率
  const latestFPS = fpsData.length > 0 ? fpsData[fpsData.length - 1].fps : 0;
  
  // 内存使用率
  const memoryUsagePercent = memoryUsage.totalJSHeapSize > 0
    ? Math.round((memoryUsage.usedJSHeapSize / memoryUsage.totalJSHeapSize) * 100)
    : 0;
  
  // 准备图表数据
  const chartData = fpsData.map(item => ({
    time: new Date(item.time).toLocaleTimeString(),
    fps: item.fps
  }));
  
  // 慢组件表格列
  const slowComponentsColumns = [
    {
      title: '组件名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '渲染时间 (ms)',
      dataIndex: 'renderTime',
      key: 'renderTime',
      render: (text) => <Text>{text.toFixed(2)}</Text>
    },
    {
      title: '最后观察时间',
      dataIndex: 'lastSeen',
      key: 'lastSeen',
      render: (text) => <Text>{text.toLocaleString()}</Text>
    }
  ];
  
  // 渲染性能面板
  const renderPerformancePanel = () => (
    <Card 
      title="性能监控"
      extra={
        <Switch 
          checked={isMonitoring} 
          onChange={toggleMonitoring}
          checkedChildren="开启"
          unCheckedChildren="关闭"
        />
      }
      size={isExpanded ? "default" : "small"}
      style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        zIndex: 9999,
        width: isExpanded ? '600px' : 'auto',
        maxHeight: isExpanded ? '70vh' : 'auto',
        overflow: 'auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Statistic 
            title="帧率 (FPS)"
            value={latestFPS}
            suffix="fps"
            valueStyle={{ 
              color: latestFPS < 30 ? '#f5222d' : latestFPS < 50 ? '#faad14' : '#52c41a' 
            }}
          />
        </Col>
        <Col span={8}>
          <Statistic 
            title="内存使用" 
            value={formatMemorySize(memoryUsage.usedJSHeapSize)}
            suffix={`/${formatMemorySize(memoryUsage.totalJSHeapSize)}`}
          />
        </Col>
        <Col span={8}>
          <Statistic 
            title="内存使用率" 
            value={memoryUsagePercent}
            suffix="%"
            valueStyle={{ 
              color: memoryUsagePercent > 80 ? '#f5222d' : memoryUsagePercent > 60 ? '#faad14' : '#52c41a' 
            }}
          />
        </Col>
      </Row>
      
      {isExpanded && (
        <>
          <div style={{ marginTop: '16px' }}>
            <Title level={5}>帧率趋势</Title>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.split(':').slice(1).join(':')} // 只显示分:秒
                />
                <YAxis 
                  domain={[0, 60]} 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'FPS', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="fps" 
                  stroke="#1890ff" 
                  fill="#e6f7ff" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <Title level={5}>慢组件 ({slowComponents.length})</Title>
            {slowComponents.length > 0 ? (
              <Table 
                dataSource={slowComponents} 
                columns={slowComponentsColumns} 
                size="small"
                pagination={false}
                rowKey="name"
                scroll={{ y: 200 }}
              />
            ) : (
              <Text type="secondary">暂无慢组件</Text>
            )}
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button size="small" onClick={clearData}>清除数据</Button>
          </div>
        </>
      )}
      
      <Button 
        type="text" 
        size="small" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
      >
        {isExpanded ? '收起' : '展开'}
      </Button>
    </Card>
  );
  
  return (
    <>
      {children}
      {renderPerformancePanel()}
    </>
  );
};

// 导出性能监控相关的工具函数
export const performanceUtils = {
  /**
   * 测量函数执行时间
   * @param {Function} fn - 要测量的函数
   * @param {string} label - 标签
   * @returns {any} 函数执行结果
   */
  measure: (fn, label = 'function') => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${label} took ${(end - start).toFixed(2)}ms`);
    return result;
  },
  
  /**
   * 记录性能标记
   * @param {string} name - 标记名称
   */
  mark: (name) => {
    if (performance.mark) {
      performance.mark(name);
    }
  },
  
  /**
   * 记录性能测量
   * @param {string} name - 测量名称
   * @param {string} startMark - 开始标记
   * @param {string} endMark - 结束标记
   */
  measureTime: (name, startMark, endMark) => {
    if (performance.measure) {
      performance.measure(name, startMark, endMark);
    }
  },
  
  /**
   * 获取性能条目
   * @param {Object} options - 选项
   * @returns {Array} 性能条目数组
   */
  getEntries: (options = {}) => {
    if (performance.getEntries) {
      return performance.getEntries(options);
    }
    return [];
  },
  
  /**
   * 清除性能标记
   * @param {string} name - 标记名称
   */
  clearMarks: (name) => {
    if (performance.clearMarks) {
      performance.clearMarks(name);
    }
  },
  
  /**
   * 清除性能测量
   * @param {string} name - 测量名称
   */
  clearMeasures: (name) => {
    if (performance.clearMeasures) {
      performance.clearMeasures(name);
    }
  }
};

export default PerformanceMonitor;

/**
 * 性能优化建议组件
 */
export const PerformanceSuggestions = () => {
  const suggestions = [
    {
      title: '虚拟滚动',
      description: '对于长列表数据，使用虚拟滚动只渲染可视区域内的项目',
      applicable: '适用于BOM树、物料列表等大型数据集'
    },
    {
      title: '数据缓存',
      description: '对频繁请求的数据进行内存缓存，减少API调用',
      applicable: '适用于不经常变化的基础数据'
    },
    {
      title: '防抖节流',
      description: '对频繁触发的事件（如搜索、滚动）使用防抖节流优化',
      applicable: '适用于搜索框、拖拽操作等'
    },
    {
      title: '懒加载',
      description: '延迟加载非关键资源和组件',
      applicable: '适用于图表、详情面板等非首屏内容'
    },
    {
      title: '代码分割',
      description: '按路由或组件进行代码分割，减小初始加载体积',
      applicable: '适用于大型应用的路由懒加载'
    },
    {
      title: '批量更新',
      description: '合并多个状态更新，减少渲染次数',
      applicable: '适用于复杂表单、数据导入等场景'
    }
  ];
  
  return (
    <Card title="性能优化建议" size="small">
      {suggestions.map((suggestion, index) => (
        <Popover
          key={index}
          content={
            <div>
              <p><strong>适用场景:</strong> {suggestion.applicable}</p>
            </div>
          }
          title={suggestion.title}
          trigger="hover"
        >
          <div style={{ padding: '8px 0', borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
            <Text strong>{suggestion.title}:</Text> {suggestion.description}
          </div>
        </Popover>
      ))}
    </Card>
  );
};