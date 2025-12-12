import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, ArrowLeft } from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';

// 日期格式转换函数
const formatDate = (dateValue) => {
  if (!dateValue) return '';
  
  // 如果已经是字符串格式（YYYY-MM-DD），直接返回
  if (typeof dateValue === 'string' && dateValue.includes('-')) {
    return dateValue;
  }
  
  // 如果是Excel日期序列号
  if (typeof dateValue === 'number') {
    // Excel日期从1900-01-01开始，序号1对应1900-01-01
    // Excel有一个Bug，认为1900年是闰年，所以需要减1
    let adjustedDate = dateValue;
    if (dateValue > 59) {
      adjustedDate = dateValue - 1; // 修正Excel的闰年Bug
    }
    
    // Excel基准日期是1899-12-30，序号0对应该日期
    const date = new Date(Math.round((adjustedDate - 25569) * 86400 * 1000));
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return String(dateValue); // 返回原始值
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // 如果是日期对象
  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // 尝试解析YYYY/MM/DD或YYYY/M/D格式
  if (typeof dateValue === 'string' && dateValue.includes('/')) {
    const parts = dateValue.split('/');
    if (parts.length === 3) {
      const year = parts[0];
      const month = String(parts[1]).padStart(2, '0');
      const day = String(parts[2]).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  // 尝试解析YYYYMMDD格式
  if (typeof dateValue === 'string' && /^\d{8}$/.test(dateValue)) {
    const year = dateValue.substring(0, 4);
    const month = dateValue.substring(4, 6);
    const day = dateValue.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  
  return dateValue;
};

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 表单数据
  const [formData, setFormData] = useState({
    // 基础信息
    id: '',
    serialNumbers: [], // 产品序列号数组
    model: '',
    name: '',
    category: '',
    image: '',
    description: '',
    
    // 平台配置
    platform: '',
    family: '',
    targetMarket: [], // 多选
    targetCost: '',
    
    // 生命周期
    lifecycle: '',
    specs: '',
    status: 'draft', // 默认值
    releaseDate: '', // 格式: YYYY-MM-DD
    currentBOM: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 下拉框选项
  const categoryOptions = [
    "Ultrabook", "Gaming", "Workstation", "2-in-1", "Tablet"
  ];
  
  const platformOptions = [
    "Intel", "AMD", "Qualcomm", "MediaTek", "NVIDIA", "ARM", "Apple Silicon"
  ];
  
  const familyOptions = [
    "ThinkPad X1", "Legion Gaming", "IdeaPad Consumer", 
    "ThinkStation", "Yoga", "ThinkBook"
  ];
  
  const targetMarketOptions = [
    "Enterprise", "Business", "Consumer", "Gaming", "Education"
  ];
  
  const lifecycleOptions = [
    "planning", "development", "production", "sustaining", "end_of_life"
  ];
  
  const statusOptions = [
    "draft", "active", "deprecated"
  ];
  
  // 生命周期映射
  const lifecycleMap = {
    "planning": "规划中",
    "development": "开发中",
    "production": "量产",
    "sustaining": "维护期",
    "end_of_life": "已停产"
  };
  
  // 状态映射
  const statusMap = {
    "draft": "草稿",
    "active": "活跃",
    "deprecated": "已废弃"
  };

  // 使用ProductContext
  const { products, isLoading, updateProduct } = useProducts();
  
  // 加载产品数据
  useEffect(() => {
    if (products.length > 0) {
      // 从products数组中查找匹配的产品ID
      const product = products.find(p => p.id === id);
      
      if (product) {
        // 确保日期格式正确和targetMarket是数组
        const formattedProduct = {
          ...product,
          releaseDate: formatDate(product.releaseDate),
          targetMarket: Array.isArray(product.targetMarket) 
            ? product.targetMarket 
            : (product.targetMarket ? [product.targetMarket] : [])
        };
        
        setFormData(formattedProduct);
        setLoading(false);
      } else {
        console.error('Product not found with ID:', id);
        setLoading(false);
      }
    }
  }, [id, products]);

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox' && name === 'targetMarket') {
      // 处理目标市场多选
      const currentMarkets = Array.isArray(formData.targetMarket) ? formData.targetMarket : [];
      
      if (e.target.checked) {
        // 添加选中项
        setFormData(prev => ({
          ...prev,
          targetMarket: [...currentMarkets, value]
        }));
      } else {
        // 移除选中项
        setFormData(prev => ({
          ...prev,
          targetMarket: currentMarkets.filter(market => market !== value)
        }));
      }
    } else {
      // 处理其他普通输入
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 保存产品
  const handleSave = () => {
    setSaving(true);
    
    // 使用ProductContext更新产品，注意参数顺序是productId和updatedProduct
    updateProduct(id, formData);
    
    setTimeout(() => {
      alert('产品已更新');
      setSaving(false);
      navigate(`/products/${id}`);
    }, 1000);
  };

  // 返回列表
  const handleBack = () => {
    navigate('/products/list');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">编辑产品</h1>
        <div className="flex gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            返回列表
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左列 */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">产品型号</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">产品ID</label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">产品图片</label>
              <div className="flex items-center">
                {formData.image && (
                  <img 
                    src={formData.image} 
                    alt="产品图片" 
                    className="h-24 w-24 object-cover rounded-md mr-4"
                    onError={(e) => {
                      // 使用本地SVG图标代替外部图片服务
                      e.target.outerHTML = `<svg class="h-24 w-24 object-cover rounded-md mr-4 bg-gray-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>`;
                    }}
                  />
                )}
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="请输入图片URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">产品序列号</label>
              <textarea
                name="serialNumbers"
                value={formData.serialNumbers?.join('; ')}
                onChange={(e) => {
                  const serialNumbers = e.target.value.split(';').map(s => s.trim()).filter(s => s);
                  setFormData(prev => ({ ...prev, serialNumbers }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                rows="2"
                placeholder="多个序列号用分号;分隔"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">产品类别</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">产品描述</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* 右列 */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">平台</label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {platformOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">产品家族</label>
              <select
                name="family"
                value={formData.family}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {familyOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">目标市场</label>
              <div className="space-y-2">
                {targetMarketOptions.map(option => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      name="targetMarket"
                      value={option}
                      checked={Array.isArray(formData.targetMarket) && formData.targetMarket.includes(option)}
                      onChange={handleInputChange}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">目标成本</label>
              <input
                type="number"
                name="targetCost"
                value={formData.targetCost}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">当前BOM</label>
              <input
                type="text"
                name="currentBOM"
                value={formData.currentBOM}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">生命周期</label>
              <select
                name="lifecycle"
                value={formData.lifecycle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {lifecycleOptions.map(option => (
                  <option key={option} value={option}>{lifecycleMap[option]}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{statusMap[option]}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">发布日期</label>
              <input
                type="date"
                name="releaseDate"
                value={formData.releaseDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">规格参数</label>
            <textarea
              name="specs"
              value={formData.specs}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEdit;