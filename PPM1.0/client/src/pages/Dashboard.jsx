import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboardData } from '../services/dashboardService';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [productPlatformData, setProductPlatformData] = useState([]);

  // 生成产品-平台气泡图模拟数据（156个产品）
  const generateProductPlatformData = () => {
    const platforms = ['X1', 'X13', 'T14', 'T16', 'L14', 'L15', 'P1', 'P15', 'P17', 'Yoga', 'Legion', 'IdeaPad'];
    const data = [];
    
    // 生成156个产品数据
    for (let i = 1; i <= 156; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const unitCost = Math.floor(Math.random() * 5000) + 500; // 500-5500元
      const productionQuantity = Math.floor(Math.random() * 10000) + 100; // 100-10100台
      const bubbleSize = unitCost * productionQuantity; // 气泡大小 = 月产量 × 成本
      
      // 随机分布在图表区域
      const x = Math.random() * 80 + 10;
      const y = Math.random() * 80 + 10;
      
      data.push({
        id: i,
        productId: `${platform}-${i.toString().padStart(3, '0')}`,
        platform,
        unitCost,
        productionQuantity,
        bubbleSize,
        x,
        y
      });
    }
    
    return data;
  };

  // 加载产品-平台气泡图数据
  const loadProductPlatformData = () => {
    // 模拟加载延迟
    setTimeout(() => {
      const data = generateProductPlatformData();
      setProductPlatformData(data);
      setChartLoaded(true);
    }, 1000);
  };

  // Mock data for the new dashboard layout
  const mockTopItems = {
    shortage: [
      { id: 1, name: 'CPU-I9-13900K', quantity: 15, supplier: 'Intel', impact: 'High' },
      { id: 2, name: 'DDR5-5600-32GB', quantity: 32, supplier: 'Samsung', impact: 'Medium' },
      { id: 3, name: 'SSD-2TB-NVMe', quantity: 28, supplier: 'Kingston', impact: 'Medium' },
      { id: 4, name: 'GPU-RTX-4070', quantity: 10, supplier: 'NVIDIA', impact: 'High' },
      { id: 5, name: 'PSU-850W-Gold', quantity: 45, supplier: 'Corsair', impact: 'Low' }
    ],
    costOverrun: [
      { id: 1, name: 'ThinkPad X1 Carbon', planned: 1200, actual: 1420, variance: 18.3 },
      { id: 2, name: 'ThinkStation P620', planned: 2500, actual: 2895, variance: 15.8 },
      { id: 3, name: 'ThinkCentre M70q', planned: 599, actual: 675, variance: 12.7 },
      { id: 4, name: 'ThinkPad P1 Gen 6', planned: 1899, actual: 2135, variance: 12.4 },
      { id: 5, name: 'ThinkBook 16p Gen 4', planned: 1399, actual: 1555, variance: 11.2 }
    ],
    compliance: [
      { id: 1, name: 'CPU-I7-13700K', risk: 'High', issue: 'Export control restriction', category: 'Sanctions' },
      { id: 2, name: 'DDR5-6400-32GB', risk: 'Medium', issue: 'Pending certification', category: 'Certification' },
      { id: 3, name: 'LPDDR5-6400-16GB', risk: 'Medium', issue: 'RoHS compliance pending', category: 'Environmental' },
      { id: 4, name: 'SSD-4TB-QLC', risk: 'Low', issue: 'Documentation update needed', category: 'Documentation' },
      { id: 5, name: 'WiFi-6E-AX211', risk: 'Medium', issue: 'FCC renewal pending', category: 'Regulatory' }
    ],
    lifecycle: [
      { id: 1, name: 'CPU-I5-10400', status: 'EOL', date: '2023-12-31', action: 'Replace with i5-13400' },
      { id: 2, name: 'DDR4-2666-16GB', status: 'EOL', date: '2024-03-31', action: 'Migrate to DDR5' },
      { id: 3, name: 'SSD-SATA-256GB', status: 'End-of-Life', date: '2024-02-28', action: 'Upgrade to NVMe' },
      { id: 4, name: 'USB-C-3.1', status: 'Phasing Out', date: '2024-06-30', action: 'Plan for USB4' },
      { id: 5, name: 'DisplayPort-1.2', status: 'Legacy', date: '2024-05-31', action: 'Upgrade to DP2.1' }
    ]
  };

  const mockTasks = [
    { id: 1, type: 'approval', title: 'BOM Change Request - ThinkPad X1', status: 'pending', priority: 'High' },
    { id: 2, type: 'difference', title: 'Part Number Mapping Confirmed - SSD-1TB', status: 'pending', priority: 'Medium' },
    { id: 3, type: 'approval', title: 'New Supplier Approval - Kingston Memory', status: 'pending', priority: 'High' },
    { id: 4, type: 'difference', title: 'BOM vs Physical Inventory Discrepancy - Q1 2024', status: 'pending', priority: 'Medium' },
    { id: 5, type: 'approval', title: 'Cost Analysis Approval - Q2 Production', status: 'pending', priority: 'Low' }
  ];

  const mockKpiData = {
    totalProducts: 156,
    activeBOMs: 89,
    totalParts: 1250,
    monthlyChanges: 23
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardData();
      setDashboardData(data);
      
      // Use actual data if available, otherwise use mock data
      setTasks(data.tasks || mockTasks);
    } catch (err) {
      setError(err.message);
      // Still use mock data if API fails
      setTasks(mockTasks);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    loadDashboardData();
    
    // 自动加载产品-平台气泡图数据
    loadProductPlatformData();
    
    // Set up auto-refresh interval
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000); // 5 minutes
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadDashboardData]);

  const handleTaskComplete = (taskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { 
          ...task, 
          status: task.status === 'completed' ? 'pending' : 'completed' 
        } : task
      )
    );
  };

  if (loading) return <div className="text-center py-10">Loading application...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className={`flex-1 p-4 transition-all duration-300 ${isTaskDrawerOpen ? 'mr-80' : ''}`}>
        {/* Dashboard Main Content */}
        
        {/* Top KPI Cards */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-3 bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="text-2xl mr-4">📦</div>
              <div>
                <p className="text-gray-500 text-sm">产品总数</p>
                <p className="text-2xl font-bold">{mockKpiData.totalProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="col-span-3 bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="text-2xl mr-4">📋</div>
              <div>
                <p className="text-gray-500 text-sm">活跃BOM</p>
                <p className="text-2xl font-bold">{mockKpiData.activeBOMs}</p>
              </div>
            </div>
          </div>
          
          <div className="col-span-3 bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="text-2xl mr-4">🔩</div>
              <div>
                <p className="text-gray-500 text-sm">Part总量</p>
                <p className="text-2xl font-bold">{mockKpiData.totalParts}</p>
              </div>
            </div>
          </div>
          
          <div className="col-span-3 bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="text-2xl mr-4">📊</div>
              <div>
                <p className="text-gray-500 text-sm">月变更量</p>
                <p className="text-2xl font-bold">{mockKpiData.monthlyChanges}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-4 h-5/6">
          {/* Left Column - 4 Cards */}
          <div className="col-span-4 grid grid-rows-4 gap-4">
            {/* Shortage Prediction Card */}
            <div className="bg-white p-4 rounded-lg shadow h-full">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <span className="bg-red-100 text-red-600 p-1 rounded mr-2">⚠️</span>
                短缺预测 TOP5
              </h3>
              <div className="space-y-2 h-full overflow-y-auto">
                {mockTopItems.shortage.map(item => (
                  <div key={item.id} className="text-sm border-b pb-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>缺口: {item.quantity}</span>
                      <span className={`font-medium ${
                        item.impact === 'High' ? 'text-red-600' : 
                        item.impact === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>{item.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Cost Overrun Card */}
            <div className="bg-white p-4 rounded-lg shadow h-full">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <span className="bg-orange-100 text-orange-600 p-1 rounded mr-2">💰</span>
                成本超支 TOP5
              </h3>
              <div className="space-y-2 h-full overflow-y-auto">
                {mockTopItems.costOverrun.map(item => (
                  <div key={item.id} className="text-sm border-b pb-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>预算: ${item.planned}</span>
                      <span className="font-medium text-red-600">+{item.variance}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Compliance Risk Card */}
            <div className="bg-white p-4 rounded-lg shadow h-full">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <span className="bg-yellow-100 text-yellow-600 p-1 rounded mr-2">🔒</span>
                合规风险 TOP5
              </h3>
              <div className="space-y-2 h-full overflow-y-auto">
                {mockTopItems.compliance.map(item => (
                  <div key={item.id} className="text-sm border-b pb-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-600">
                      <span className={`inline-block px-1 rounded ${
                        item.risk === 'High' ? 'bg-red-100 text-red-600' : 
                        item.risk === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 
                        'bg-green-100 text-green-600'
                      }`}>{item.risk}</span>
                      <span className="ml-2">{item.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Lifecycle Warning Card */}
            <div className="bg-white p-4 rounded-lg shadow h-full">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-600 p-1 rounded mr-2">🔄</span>
                生命周期预警 TOP5
              </h3>
              <div className="space-y-2 h-full overflow-y-auto">
                {mockTopItems.lifecycle.map(item => (
                  <div key={item.id} className="text-sm border-b pb-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-600">
                      <span>{item.status}</span>
                      <span className="ml-2">{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Middle Column - Product Platform Matrix Chart */}
          <div className="col-span-8 bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">产品-平台矩阵</h3>
            </div>
            
            {/* 自动加载的产品-平台气泡图 */}
            <div className="h-full bg-gray-50 rounded border overflow-hidden">
              {!chartLoaded ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin text-4xl mb-2">⏳</div>
                    <p className="text-sm text-gray-500">正在加载产品-平台气泡图...</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 h-full">
                  <div className="mb-2 text-sm text-gray-500">
                    2025-10数据（显示156个产品，气泡大小=月产量×成本）
                  </div>
                  <div className="relative h-[calc(100%-20px)] bg-white rounded border p-2" style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* 带坐标轴单位标识和气泡标签的产品-平台气泡图 */}
                    <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                      {/* X轴单位标识 */}
                      <g>
                        <line x1="5" y1="95" x2="95" y2="95" stroke="#666" strokeWidth="0.5" />
                        <text x="50" y="98" textAnchor="middle" fontSize="3" fill="#333">单位成本 (¥)</text>
                      </g>
                        
                      {/* Y轴单位标识 */}
                      <g>
                        <line x1="5" y1="5" x2="5" y2="95" stroke="#666" strokeWidth="0.5" />
                        <text x="3" y="50" textAnchor="middle" fontSize="3" fill="#333" transform="rotate(-90, 3, 50)">月产量 (台)</text>
                      </g>
                      
                      {/* 气泡点和标签 */}
                      {productPlatformData.map((item) => {
                        // 计算气泡半径，进行缩放以便更好地显示
                        const maxSize = Math.max(...productPlatformData.map(d => d.bubbleSize));
                        const radius = Math.sqrt((item.bubbleSize / maxSize) * 50) * 0.5;
                        
                        // 根据平台设置不同颜色
                        const colorMap = {
                          'X1': '#1890ff',
                          'X13': '#52c41a',
                          'T14': '#faad14',
                          'T16': '#f5222d',
                          'L14': '#722ed1',
                          'L15': '#fa541c',
                          'P1': '#13c2c2',
                          'P15': '#eb2f96',
                          'P17': '#fa8c16',
                          'Yoga': '#2f54eb',
                          'Legion': '#52c41a',
                          'IdeaPad': '#faad14'
                        };
                        const color = colorMap[item.platform] || '#d9d9d9';
                        
                        // 仅对较大的气泡显示标签，避免图表过于拥挤
                        const showLabel = radius > 1;
                        
                        return (
                          <g key={item.id}>
                            <circle
                              cx={item.x}
                              cy={item.y}
                              r={radius}
                              fill={color}
                              fillOpacity="0.5"
                              stroke={color}
                              strokeWidth="0.5"
                              style={{ cursor: 'pointer' }}
                              title={`产品: ${item.productId}\n平台: ${item.platform}\n月产量: ${item.productionQuantity}\n单位成本: ¥${item.unitCost}\n气泡大小: ${item.bubbleSize.toLocaleString()}`}
                            />
                            {/* 产品名称标签 - 仅对较大气泡显示 */}
                            {showLabel && (
                              <text
                                x={item.x}
                                y={item.y - radius - 0.3}
                                textAnchor="middle"
                                fontSize="1.5"
                                fill="#333"
                                fontWeight="500"
                              >
                                {item.productId}
                              </text>
                            )}
                            {/* 成本价格标签 - 仅对较大气泡显示 */}
                            {showLabel && (
                              <text
                                x={item.x}
                                y={item.y - radius - 1}
                                textAnchor="middle"
                                fontSize="1.5"
                                fill="#666"
                              >
                                ¥{item.unitCost}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                    
                    {/* 图表说明 */}
                    <div className="absolute bottom-2 right-2 text-sm bg-white bg-opacity-80 p-1 rounded">
                      气泡大小 = 月产量 × 单位成本
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Task Drawer */}
      <div className={`fixed top-0 right-0 h-full bg-white shadow-xl transition-transform duration-300 z-10 ${isTaskDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '320px' }}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">今日任务</h3>
            <button 
              onClick={() => setIsTaskDrawerOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>我的待办</span>
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">{tasks.filter(t => t.status === 'pending').length}</span>
              </div>
            </div>
            
            <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="border rounded-lg p-3 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <input 
                type="checkbox" 
                checked={task.status === 'completed'}
                onChange={() => handleTaskComplete(task.id)}
                className="mt-1 mr-3"
              />
              <Link to={`/tasks/${task.id}`} className="flex-1 text-gray-800 hover:text-blue-600 no-underline">
                <div className="flex items-center">
                  <span className={`text-xs px-2 py-1 rounded mr-2 ${
                    task.type === 'approval' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {task.type === 'approval' ? '审批' : '差异确认'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.priority === 'High' ? 'bg-red-100 text-red-600' : 
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <div className={`font-medium mt-1 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                  {task.title}
                </div>
              </Link>
            </div>
          </div>
        ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Toggle Button for Task Drawer */}
      {!isTaskDrawerOpen && (
        <button
          onClick={() => setIsTaskDrawerOpen(true)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-600 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Dashboard;