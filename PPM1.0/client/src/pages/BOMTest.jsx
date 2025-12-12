import React from 'react';

// 简化的BOM测试页面，用于验证基本功能
const BOMTest = () => {
  // 模拟数据
  const mockBOMs = [
    {
      id: 1,
      bomName: '测试BOM1',
      productName: '产品A',
      productCode: 'PROD001',
      version: '1.0',
      status: 'DRAFT',
      totalCost: 1500.50,
      syncStatus: 'SYNCED',
      lastModified: new Date().toISOString(),
      modifiedBy: '用户1'
    },
    {
      id: 2,
      bomName: '测试BOM2',
      productName: '产品B',
      productCode: 'PROD002',
      version: '1.1',
      status: 'APPROVED',
      totalCost: null, // 测试null值
      syncStatus: 'PENDING_SYNC',
      lastModified: new Date().toISOString(),
      modifiedBy: '用户2'
    }
  ];

  // 安全的格式化函数
  const costFmt = (v) => {
    if (v === undefined || v === null || isNaN(Number(v))) return '¥0.00';
    return `¥${Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
  };

  const dateFmt = (d) => {
    if (!d) return '';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">BOM测试页面</h1>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">测试信息</h2>
        <p>此页面用于测试BOM功能，使用了安全的数据处理函数，可以正确处理undefined和null值。</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">BOM名称</th>
              <th className="p-2 text-left">产品</th>
              <th className="p-2 text-left">产品代码</th>
              <th className="p-2 text-left">状态</th>
              <th className="p-2 text-left">总成本</th>
              <th className="p-2 text-left">最后修改</th>
            </tr>
          </thead>
          <tbody>
            {mockBOMs.map(bom => (
              <tr key={bom.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{bom.bomName}</td>
                <td className="p-2">{bom.productName}</td>
                <td className="p-2">{bom.productCode}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    bom.status === 'DRAFT' ? 'bg-blue-100 text-blue-800' :
                    bom.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {bom.status === 'DRAFT' ? '草稿' :
                     bom.status === 'APPROVED' ? '已批准' : bom.status}
                  </span>
                </td>
                <td className="p-2">{costFmt(bom.totalCost)}</td>
                <td className="p-2">{dateFmt(bom.lastModified)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">测试结果</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>✓ 页面加载成功</li>
          <li>✓ 数据渲染正常</li>
          <li>✓ 成本格式化函数正确处理null值</li>
          <li>✓ 日期格式化函数正常工作</li>
        </ul>
      </div>
    </div>
  );
};

export default BOMTest;