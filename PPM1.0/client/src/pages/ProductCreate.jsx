import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Save, X } from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';

const ProductCreate = () => {
  const navigate = useNavigate();
  const { saveProducts, products } = useProducts();
  
  // 步骤状态
  const [currentStep, setCurrentStep] = useState(1);
  
  // 表单数据
  const [formData, setFormData] = useState({
    // 基础信息
    model: '',
    id: '',
    serialNumbers: [], // 产品序列号数组
    name: '',
    category: '',
    image: '',
    description: '',
    
    // 平台配置
    platform: '',
    family: '',
    targetMarket: [], // 多选
    targetCost: '',
    currentBOM: '', // 添加当前BOM字段
    
    // 生命周期
    lifecycle: '',
    specs: '',
    status: 'draft', // 默认值
    releaseDate: '', // 格式: YYYY-MM-DD
  });

  // 下拉框选项
  const modelOptions = [
    "X1 Carbon Gen 11", "X1 Nano Gen 3", "X1 Yoga Gen 8", 
    "Legion Slim 7", "Legion 7i", "Legion 5i", "Legion 5 Pro", "Legion Tower 5i",
    "ThinkStation P620", "ThinkStation P360", "ThinkStation P340",
    "ThinkPad T14 Gen 3", "ThinkPad T16", "ThinkPad X1 Carbon Gen 11", "ThinkPad X1 Nano", "ThinkPad X1 Yoga",
    "ThinkBook 14", "ThinkBook 16p", "ThinkBook 13s", 
    "Yoga 9i", "Yoga 7i", "Yoga Slim 7", "Yoga Pro 9", "Yoga Book 9i",
    "IdeaPad Slim 7", "IdeaPad 5i Pro", "IdeaPad Duet 3", "IdeaPad Flex 5",
    "ThinkCentre M90a", "ThinkCentre Neo 50s", "ThinkCentre M75q",
    "Legion Go", "Tab P12", "Tab P11"
  ];
  
  const categoryOptions = [
    "Ultrabook", "Gaming", "Workstation", "2-in-1", "Tablet", 
    "Desktop", "All-in-One", "Chromebook", "Business", "Prototype"
  ];
  
  const platformOptions = [
    "Intel", "AMD", "Qualcomm", "MediaTek", "NVIDIA", "ARM", "Apple Silicon"
  ];
  
  const familyOptions = [
    "ThinkPad X1", "Legion Gaming", "IdeaPad Consumer", 
    "ThinkStation", "Yoga", "ThinkBook"
  ];
  
  const targetMarketOptions = [
    "Enterprise", "Business", "Consumer", "Gaming", "Education", 
    "Professional", "R&D", "Home", "Medical", "Government", "Industrial", "Creative"
  ];
  
  const lifecycleOptions = [
    "planning", "development", "production", "sustaining", "end_of_life"
  ];
  
  const statusOptions = [
    "draft", "active", "deprecated"
  ];

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      // 处理多选
      if (name === 'targetMarket') {
        const updatedMarkets = [...formData.targetMarket];
        if (value === 'all') {
          // 全选/全不选
          if (updatedMarkets.length === targetMarketOptions.length) {
            setFormData(prev => ({ ...prev, targetMarket: [] }));
          } else {
            setFormData(prev => ({ ...prev, targetMarket: [...targetMarketOptions] }));
          }
        } else {
          // 单个选项
          if (updatedMarkets.includes(value)) {
            setFormData(prev => ({ 
              ...prev, 
              targetMarket: updatedMarkets.filter(market => market !== value) 
            }));
          } else {
            setFormData(prev => ({ 
              ...prev, 
              targetMarket: [...updatedMarkets, value] 
            }));
          }
        }
      }
    } else {
      // 处理普通输入
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 表单验证函数
  const validateStep = (step) => {
    switch(step) {
      case 1:
        // 基础信息验证
        if (!formData.model || formData.model.trim() === '') {
          alert('请填写产品型号');
          return false;
        }
        if (!formData.id || formData.id.trim() === '') {
          alert('请填写产品ID');
          return false;
        }
        if (!formData.name || formData.name.trim() === '') {
          alert('请填写产品名称');
          return false;
        }
        if (!formData.category || formData.category.trim() === '') {
          alert('请选择产品类别');
          return false;
        }
        if (!formData.platform || formData.platform.trim() === '') {
          alert('请选择平台');
          return false;
        }
        if (!formData.family || formData.family.trim() === '') {
          alert('请选择产品家族');
          return false;
        }
        if (!formData.serialNumbers || !Array.isArray(formData.serialNumbers) || formData.serialNumbers.length === 0) {
          alert('请填写产品序列号');
          return false;
        }
        return true;
        
      case 2:
        // 平台配置验证
        if (!formData.targetMarket || !Array.isArray(formData.targetMarket) || formData.targetMarket.length === 0) {
          alert('请至少选择一个目标市场');
          console.log('TargetMarket validation failed:', formData.targetMarket);
          return false;
        }
        if (!formData.targetCost || formData.targetCost.trim() === '' || isNaN(parseFloat(formData.targetCost))) {
          alert('请输入有效的目标成本');
          return false;
        }
        return true;
        
      case 3:
        // 生命周期验证
        if (!formData.lifecycle || formData.lifecycle.trim() === '') {
          alert('请选择产品生命周期');
          return false;
        }
        if (!formData.status || formData.status.trim() === '') {
          alert('请选择产品状态');
          return false;
        }
        if (!formData.releaseDate || formData.releaseDate.trim() === '') {
          alert('请填写发布日期');
          return false;
        }
        if (!formData.specs || formData.specs.trim() === '') {
          alert('请填写产品规格');
          return false;
        }
        return true;
        
      default:
        return false;
    }
  };

  // 处理步骤导航
  const nextStep = () => {
    // 验证当前步骤
    if (!validateStep(currentStep)) {
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // 最后一步，提交表单
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 提交表单
  const handleSubmit = () => {
    // 确保所有必填字段都有值
    const { model, id, name, category, platform, family, serialNumbers, targetMarket, targetCost, lifecycle, status, releaseDate, description, specs, currentBOM } = formData;
    
    console.log('Form validation:', { model, id, name, category, platform, family, serialNumbers, targetMarket, targetCost, lifecycle, status, releaseDate });
    
    if (!model || !id || !name || !category || !platform || !family || !serialNumbers ||
        !Array.isArray(targetMarket) || targetMarket.length === 0 || !targetCost || !lifecycle || !status || !releaseDate) {
      alert('请填写所有必填字段');
      console.log('Validation failed:', {
        hasModel: !!model,
        hasId: !!id,
        hasName: !!name,
        hasCategory: !!category,
        hasPlatform: !!platform,
        hasFamily: !!family,
        hasSerialNumbers: Array.isArray(serialNumbers) && serialNumbers.length > 0,
        hasTargetMarket: Array.isArray(targetMarket) && targetMarket.length > 0,
        hasTargetCost: !!targetCost,
        hasLifecycle: !!lifecycle,
        hasStatus: !!status,
        hasReleaseDate: !!releaseDate
      });
      return;
    }
    
    // 准备产品数据，确保数据类型正确
    const now = new Date().toISOString();
    const productData = {
      ...formData,
      targetCost: parseFloat(targetCost) || 0, // 确保是数字类型
      serialNumbers: Array.isArray(formData.serialNumbers) ? formData.serialNumbers : 
                     (typeof formData.serialNumbers === 'string' ? formData.serialNumbers.split(';').map(s => s.trim()).filter(s => s) : []),
      image: formData.image || `https://picsum.photos/seed/${id}/100/100.jpg`,
      description: description || '',
      specs: specs || '',
      currentBOM: currentBOM || '',
      createdAt: now,
      updatedAt: now
    };
    
    console.log('Creating product with data:', productData);
    
    // 使用ProductContext保存产品
    try {
      // 获取当前产品数据
      const updatedProducts = [...products, productData];
      
      // 使用ProductContext的saveProducts方法
      saveProducts(updatedProducts);
      
      console.log('产品已保存，总产品数:', updatedProducts.length);
      alert('产品创建成功！');
      
      // 导航到产品列表页
      navigate('/products/list');
    } catch (error) {
      console.error('保存产品失败:', error);
      alert('保存产品失败，请重试');
    }
  };

  // 取消创建
  const handleCancel = () => {
    if (window.confirm('确定要取消产品创建吗？所有输入的数据将会丢失。')) {
      navigate('/products/list');
    }
  };

  // 生成产品ID和产品序列号
  const generateProductId = (model) => {
    // 简单的ID生成逻辑
    if (!model) return '';
    
    const prefix = model.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString().substring(-6);
    return `${prefix}-${timestamp}`;
  };
  
  // 生成产品序列号 (SN-PF3D1ABCD1234格式)
  const generateSerialNumbers = (model, id, count = 3) => {
    if (!model || !id) return [];
    
    const serialNumbers = [];
    const modelPrefix = model.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    
    // 生成指定数量的序列号
    for (let i = 0; i < count; i++) {
      const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
      const suffix = String.fromCharCode(65 + i); // A, B, C, ...
      serialNumbers.push(`SN-${modelPrefix}${id.substring(3)}${randomPart}${suffix}`);
    }
    
    return serialNumbers;
  };

  // 当模型选择变化时，自动生成ID、序列号和图片URL
  const handleModelChange = (e) => {
    const model = e.target.value;
    const id = generateProductId(model);
    const serialNumbers = generateSerialNumbers(model, id); // 默认生成3个序列号
    const imageUrl = `https://picsum.photos/seed/${model.replace(/\s+/g, '').toLowerCase()}/100/100.jpg`;
    
    setFormData(prev => ({
      ...prev,
      model,
      id,
      serialNumbers,
      image: imageUrl
    }));
  };

  // 格式化目标成本输入
  const handleCostChange = (e) => {
    let value = e.target.value;
    
    // 移除非数字和小数点
    value = value.replace(/[^\d.]/g, '');
    
    // 确保只有一个小数点
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    } else if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    setFormData(prev => ({ ...prev, targetCost: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8 xl:max-w-5xl">
      {/* 页面头部 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">产品生成器</h1>
          <p className="text-gray-600 mt-1">创建新产品</p>
        </div>
        <button
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <X size={18} className="inline mr-2" />
          取消
        </button>
      </div>

      {/* 步骤条 */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center ${currentStep === 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${currentStep === 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-600'}`}>
              1
            </div>
            <span className="ml-2 font-medium">基础信息</span>
          </div>
          
          <div className={`flex items-center ${currentStep === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${currentStep === 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-600'}`}>
              2
            </div>
            <span className="ml-2 font-medium">市场与成本</span>
          </div>
          
          <div className={`flex items-center ${currentStep === 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${currentStep === 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-600'}`}>
              3
            </div>
            <span className="ml-2 font-medium">生命周期</span>
          </div>
        </div>
        
        {/* 连接线 */}
        <div className="flex items-center w-full mt-2">
          <div className={`h-1 flex-1 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`h-1 flex-1 ${currentStep > 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        {/* 步骤1: 基础信息 */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品型号 <span className="text-red-500">*</span></label>
              <select
                name="model"
                value={formData.model}
                onChange={handleModelChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">请选择产品型号</option>
                {modelOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品ID <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                readOnly
                placeholder="自动关联"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品序列号 <span className="text-red-500">*</span></label>
              <textarea
                name="serialNumbers"
                value={formData.serialNumbers?.join('; ')}
                onChange={(e) => {
                  const serialNumbers = e.target.value.split(';').map(s => s.trim()).filter(s => s);
                  setFormData(prev => ({ ...prev, serialNumbers }));
                }}
                placeholder="自动生成 (SN-PF3D1ABCD1234格式)，多个序列号用分号;分隔"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                rows="2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品名称 <span className="text-red-500">*</span></label>
              <select
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">请选择产品名称</option>
                {modelOptions.map(option => (
                  <option key={option} value={option}>联想 {option}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品类别 <span className="text-red-500">*</span></label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">请选择产品类别</option>
                {categoryOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">平台 <span className="text-red-500">*</span></label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">请选择平台</option>
                {platformOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品家族 <span className="text-red-500">*</span></label>
              <select
                name="family"
                value={formData.family}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">请选择产品家族</option>
                {familyOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">产品图片</label>
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
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">产品描述</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="填写产品描述"
              ></textarea>
            </div>
          </div>
        )}
        
        {/* 步骤2: 平台配置 */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">目标市场 <span className="text-red-500">*</span></label>
              <div className="border border-gray-300 rounded-md p-3">
                <div className="mb-2">
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="checkbox"
                      name="targetMarket"
                      value="all"
                      checked={formData.targetMarket.length === targetMarketOptions.length}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span>全选</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {targetMarketOptions.map(option => (
                    <label key={option} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        name="targetMarket"
                        value={option}
                        checked={formData.targetMarket.includes(option)}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">目标成本 <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                <input
                  type="text"
                  name="targetCost"
                  value={formData.targetCost}
                  onChange={handleCostChange}
                  placeholder="格式化人民币填写"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">当前BOM</label>
              <input
                type="text"
                name="currentBOM"
                value={formData.currentBOM || ''}
                onChange={handleInputChange}
                placeholder="填写当前BOM版本，如：BOM-v1.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
        
        {/* 步骤3: 生命周期 */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">生命周期 <span className="text-red-500">*</span></label>
              <select
                name="lifecycle"
                value={formData.lifecycle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">请选择生命周期阶段</option>
                <option value="planning">规划中</option>
                <option value="development">开发中</option>
                <option value="production">量产</option>
                <option value="sustaining">维护期</option>
                <option value="end_of_life">已停产</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">规格 <span className="text-red-500">*</span></label>
              <textarea
                name="specs"
                value={formData.specs}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="填写产品规格"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">状态 <span className="text-red-500">*</span></label>
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
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">发布日期 <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="releaseDate"
                value={formData.releaseDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        )}
      </div>
      
      {/* 步骤导航按钮 - 移到步骤内容区域外部 */}
      <div className="flex justify-between mt-8">
        <div>
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ChevronLeft size={18} className="mr-2" />
              上一步
            </button>
          )}
        </div>
        
        <div>
          <button
            onClick={nextStep}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {currentStep === 3 ? (
              <>
                <Save size={18} className="mr-2" />
                确认生成
              </>
            ) : (
              <>
                下一步
                <ChevronRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCreate;