import React, { useState, useEffect } from 'react';
import { fetchProducts } from '../services/productService';
import { fetchTargetParts } from '../services/targetPartService';
import { generateConfigurations } from '../services/configurationService';

const ConfigurationGenerator = () => {
  const [products, setProducts] = useState([]);
  const [targetParts, setTargetParts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedTargetParts, setSelectedTargetParts] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(false);
  const [criteria, setCriteria] = useState({
    maxCost: 1000,
    minReliability: 80,
    limit: 10
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, targetPartsData] = await Promise.all([
        fetchProducts(),
        fetchTargetParts()
      ]);
      setProducts(productsData);
      setTargetParts(targetPartsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('加载数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTargetPartToggle = (targetPartId) => {
    setSelectedTargetParts(prev => {
      if (prev.includes(targetPartId)) {
        return prev.filter(id => id !== targetPartId);
      } else {
        return [...prev, targetPartId];
      }
    });
  };

  const handleGenerateConfigurations = async () => {
    if (!selectedProduct || selectedTargetParts.length === 0) {
      alert('请选择产品和至少一个目标零件');
      return;
    }

    try {
      setGenerating(true);
      const result = await generateConfigurations(selectedProduct, selectedTargetParts, {
        ...criteria,
        autoGenerate: autoGenerateEnabled
      });
      setConfigurations(result.available_configurations);
    } catch (error) {
      console.error('Error generating configurations:', error);
      alert('生成配置失败: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCriteriaChange = (field, value) => {
    setCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) return <div className="text-center py-10">加载数据中...</div>;

  return (
    <div className="configuration-generator">
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h1 className="text-3xl font-bold mb-6">硬件配置生成器</h1>
        
        {/* 产品选择 */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            选择产品
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">选择产品</option>
            {products.map(product => (
              <option key={product._id} value={product._id}>
                {product.model} - {product.product_line}
              </option>
            ))}
          </select>
        </div>

        {/* 目标零件选择 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 text-sm font-bold">
              选择目标零件
            </label>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoGenerateEnabled}
                  onChange={(e) => setAutoGenerateEnabled(e.target.checked)}
                  className="form-checkbox"
                />
                <span>启用自动生成</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto p-2 border rounded">
            {targetParts.map(targetPart => (
              <label key={targetPart._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTargetParts.includes(targetPart._id)}
                  onChange={() => handleTargetPartToggle(targetPart._id)}
                  className="form-checkbox"
                />
                <span className="text-sm">
                  {targetPart.target_part_id} - {targetPart.function_description}
                  {targetPart.auto_generation_rules?.enabled && (
                    <span className="ml-1 text-xs text-green-600">(自动)</span>
                  )}
                </span>
              </label>
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            已选择 {selectedTargetParts.length} 个目标零件
            {autoGenerateEnabled && (
              <span className="ml-2 text-blue-600">• 自动生成模式已启用</span>
            )}
          </div>
        </div>

        {/* 生成条件 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              最大成本限制
            </label>
            <input
              type="number"
              value={criteria.maxCost}
              onChange={(e) => handleCriteriaChange('maxCost', parseInt(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              最低可靠性要求
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={criteria.minReliability}
              onChange={(e) => handleCriteriaChange('minReliability', parseInt(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              显示结果数量
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={criteria.limit}
              onChange={(e) => handleCriteriaChange('limit', parseInt(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        {/* 生成按钮 */}
        <button
          onClick={handleGenerateConfigurations}
          disabled={generating || !selectedProduct || selectedTargetParts.length === 0}
          className={`font-bold py-3 px-6 rounded w-full ${
            autoGenerateEnabled 
              ? 'bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white' 
              : 'bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white'
          }`}
        >
          {generating ? '生成配置中...' : autoGenerateEnabled ? '自动生成配置' : '生成硬件配置'}
        </button>
      </div>

      {/* 配置结果 */}
      {configurations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">
            生成的配置方案 ({configurations.length} 个)
          </h2>
          
          <div className="space-y-4">
            {configurations.map((config, index) => (
              <div key={config.combination_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold">
                    配置方案 #{index + 1}
                  </h3>
                  <div className="flex space-x-2">
                    <span className={`px-3 py-1 rounded text-sm ${
                      config.compatibility_score >= 90 ? 'bg-green-100 text-green-800' :
                      config.compatibility_score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      兼容性: {config.compatibility_score}%
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                      成本: ${config.estimated_cost}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm">
                      可靠性: {config.reliability_score}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config.selections.map(selection => (
                    <div key={`${selection.target_part_id}_${selection.selected_part_id}`} 
                         className={`p-3 rounded ${
                           selection.auto_generated ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                         }`}>
                      <div className="font-medium">
                        {targetParts.find(tp => tp._id === selection.target_part_id)?.target_part_id}
                        {selection.auto_generated && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            自动生成
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        选择零件: {selection.selected_part_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        匹配强度: {selection.match_strength}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 text-sm text-gray-600">
                  <strong>验证结果:</strong> {config.validation_result.overall_valid ? '通过' : '未通过'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationGenerator;