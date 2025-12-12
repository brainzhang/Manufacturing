import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Plus, Trash2, Copy, FileText } from 'lucide-react';
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

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, isLoading, saveProducts, deleteProduct, updateProduct } = useProducts();
  const [product, setProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

// 从ProductContext中获取产品详情
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
        // 确保targetMarket是数组
        const formData = {
          ...foundProduct,
          targetMarket: Array.isArray(foundProduct.targetMarket) 
            ? foundProduct.targetMarket 
            : (foundProduct.targetMarket ? [foundProduct.targetMarket] : [])
        };
        setFormData(formData);
      } else {
        // 如果找不到产品，导航回列表页
        alert('未找到产品信息');
        navigate('/products/list');
      }
    }
  }, [id, products, isLoading, navigate]);

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

  const handleSave = () => {
    // 使用ProductContext的updateProduct方法更新产品
    updateProduct(id, formData);
    setProduct(formData);
    setIsEditing(false);
    alert("产品信息已更新");
  };

  const handleCancel = () => {
    setFormData(product);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("确定要删除此产品吗？此操作不可逆。")) {
      // 使用ProductContext删除产品
      deleteProduct(id);
      alert("产品已删除");
      navigate("/products/list");
    }
  };
  
  // 废弃产品
  const handleDeprecateProduct = () => {
    if (window.confirm('确定要废弃此产品吗？')) {
      const updatedProducts = products.map(p => {
        if (p.id === id) {
          return {
            ...p,
            status: 'deprecated',
            lifecycle: 'end_of_life',
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      
      saveProducts(updatedProducts);
      const updatedProduct = { ...product, status: 'deprecated', lifecycle: 'end_of_life' };
      setProduct(updatedProduct);
      setFormData(updatedProduct);
      alert('产品已废弃');
    }
  };
  
  // 启用产品（恢复之前的状态）
  const handleRestoreProduct = () => {
    if (window.confirm('确定要启用此产品吗？')) {
      const updatedProducts = products.map(p => {
        if (p.id === id) {
          // 从已废弃恢复到活跃，生命周期也恢复到开发中
          return {
            ...p,
            status: 'active',
            lifecycle: 'development',
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      
      saveProducts(updatedProducts);
      const updatedProduct = { ...product, status: 'active', lifecycle: 'development' };
      setProduct(updatedProduct);
      setFormData(updatedProduct);
      alert('产品已启用');
    }
  };

  if (isLoading || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // 产品不存在的情况已在useEffect中处理，导航回列表页

  return (
    <div className="container mx-auto px-4 py-8 xl:max-w-7xl">
      {/* 页面头部 */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/products/list")}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
            title="返回产品列表"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                product.name
              )}
            </h1>
            <p className="text-gray-500">产品ID: {product.id}</p>
            <p className="text-gray-500">产品序列号: {product.serialNumbers?.join('; ')}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save size={16} />
                保存
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <X size={16} />
                取消
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Edit size={16} />
                编辑
              </button>
              <button className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <Copy size={16} />
                复制
              </button>
              <button className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <FileText size={16} />
                导出
              </button>
              {/* 根据状态显示废弃或启用按钮 */}
              {product.status === 'deprecated' ? (
                <button
                  onClick={handleRestoreProduct}
                  className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  启用
                </button>
              ) : (
                <button
                  onClick={handleDeprecateProduct}
                  className="flex items-center gap-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  废弃
                </button>
              )}
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              >
                <Trash2 size={16} />
                删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['basic', 'bom', 'specs', 'suppliers'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'basic' && '基本信息'}
              {tab === 'bom' && 'BOM信息'}
              {tab === 'specs' && '技术规格'}
              {tab === 'suppliers' && '供应商信息'}
            </button>
          ))}
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        {/* 基本信息标签 */}
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">产品图片</label>
                <div className="flex items-center">
                  {isEditing ? (
                    <>
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
                    </>
                  ) : (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="h-24 w-24 object-cover rounded-md mr-4"
                      onError={(e) => {
                        // 使用本地SVG图标代替外部图片服务
                        e.target.outerHTML = `<svg class="h-24 w-24 object-cover rounded-md mr-4 bg-gray-200" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>`;
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">产品型号</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{product.model}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">产品类别</label>
                {isEditing ? (
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Ultrabook">Ultrabook</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Workstation">Workstation</option>
                    <option value="2-in-1">2-in-1</option>
                    <option value="Tablet">Tablet</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{product.category}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">平台</label>
                {isEditing ? (
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择平台</option>
                    <option value="Intel">Intel</option>
                    <option value="AMD">AMD</option>
                    <option value="Qualcomm">Qualcomm</option>
                    <option value="MediaTek">MediaTek</option>
                    <option value="NVIDIA">NVIDIA</option>
                    <option value="ARM">ARM</option>
                    <option value="Apple Silicon">Apple Silicon</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{product.platform}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">产品家族</label>
                {isEditing ? (
                  <select
                    name="family"
                    value={formData.family}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择产品家族</option>
                    <option value="ThinkPad X1">ThinkPad X1</option>
                    <option value="Legion Gaming">Legion Gaming</option>
                    <option value="IdeaPad Consumer">IdeaPad Consumer</option>
                    <option value="ThinkStation">ThinkStation</option>
                    <option value="Yoga">Yoga</option>
                    <option value="ThinkBook">ThinkBook</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{product.family}</p>
                )}
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">产品ID</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                ) : (
                  <p className="text-gray-900">{product.id}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">产品序列号</label>
                {isEditing ? (
                  <textarea
                    name="serialNumbers"
                    value={formData.serialNumbers?.join('; ')}
                    onChange={(e) => handleInputChange({
                      target: {
                        name: 'serialNumbers',
                        value: e.target.value.split(';').map(s => s.trim())
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    rows="2"
                    placeholder="多个序列号请用分号;分隔"
                  />
                ) : (
                  <p className="text-gray-900">{product.serialNumbers?.join('; ')}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">目标市场</label>
                {isEditing ? (
                  <div className="space-y-2">
                    {["Enterprise", "Business", "Consumer", "Gaming", "Education"].map(market => (
                      <label key={market} className="flex items-center">
                        <input
                          type="checkbox"
                          name="targetMarket"
                          value={market}
                          checked={Array.isArray(formData.targetMarket) && formData.targetMarket.includes(market)}
                          onChange={handleInputChange}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{market}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {Array.isArray(product.targetMarket) 
                      ? product.targetMarket.join(', ') 
                      : product.targetMarket
                    }
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">目标成本</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="targetCost"
                    value={formData.targetCost}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">¥{(parseFloat(product.targetCost) || 0).toFixed(2)}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">生命周期</label>
                {isEditing ? (
                  <select
                    name="lifecycle"
                    value={formData.lifecycle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="planning">规划中</option>
                    <option value="development">开发中</option>
                    <option value="production">量产</option>
                    <option value="sustaining">维护期</option>
                    <option value="end_of_life">已停产</option>
                  </select>
                ) : (
                  <p className="text-gray-900">
                    {product.lifecycle === 'planning' && '规划中'}
                    {product.lifecycle === 'development' && '开发中'}
                    {product.lifecycle === 'production' && '量产'}
                    {product.lifecycle === 'sustaining' && '维护期'}
                    {product.lifecycle === 'end_of_life' && '已停产'}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                {isEditing ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">草稿</option>
                    <option value="active">活跃</option>
                    <option value="deprecated">已废弃</option>
                  </select>
                ) : (
                  <p className="text-gray-900">
                    {product.status === 'draft' && '草稿'}
                    {product.status === 'active' && '活跃'}
                    {product.status === 'deprecated' && '已废弃'}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">发布日期</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formatDate(product.releaseDate)}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* BOM信息标签 */}
        {activeTab === 'bom' && (
          <div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">当前BOM版本</h3>
                <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                  <Plus size={14} />
                  创建新BOM版本
                </button>
              </div>
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-lg font-medium text-blue-900">{product.currentBOM}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">BOM历史版本</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">版本</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">日期</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">变更内容</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">负责人</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {product.bomHistory.map((bom, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{bom.version}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{bom.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{bom.changes}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{bom.author}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* 技术规格标签 */}
        {activeTab === 'specs' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">产品描述</h3>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{product.description}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">详细技术规格</h3>
              {isEditing ? (
                <textarea
                  name="specs"
                  value={formData.specs}
                  onChange={handleInputChange}
                  rows="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              ) : (
                <pre className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap font-mono text-sm">
                  {product.specs}
                </pre>
              )}
            </div>
          </div>
        )}
        
        {/* 供应商信息标签 */}
        {activeTab === 'suppliers' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">供应商列表</h3>
              <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                <Plus size={14} />
                添加供应商
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">供应商名称</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">供应部件</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {product.suppliers.map((supplier, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{supplier.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{supplier.parts.join(', ')}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          supplier.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {supplier.status === 'Active' ? '活跃' : supplier.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button className="text-blue-600 hover:text-blue-900">编辑</button>
                        <button className="ml-2 text-red-600 hover:text-red-900">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* 系统信息 */}
      <div className="mt-6 bg-gray-50 p-4 rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">创建时间：</span>
            <span className="text-gray-900 ml-1">{product.createdDate}</span>
            <span className="text-gray-900 ml-2">({product.createdBy})</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">最后更新：</span>
            <span className="text-gray-900 ml-1">{product.updatedDate}</span>
            <span className="text-gray-900 ml-2">({product.updatedBy})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;