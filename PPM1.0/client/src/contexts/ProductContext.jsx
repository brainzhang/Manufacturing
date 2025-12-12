import React, { createContext, useState, useEffect, useContext } from 'react';

// 创建产品上下文
const ProductContext = createContext();

// 自定义Hook用于使用产品上下文
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

// 产品提供者组件
export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 去重函数，确保产品ID唯一
  const deduplicateProducts = (products) => {
    if (!Array.isArray(products)) return [];
    
    const seenIds = new Set();
    return products.filter(product => {
      if (!product || !product.id) return false;
      
      if (seenIds.has(product.id)) {
        console.log(`Duplicate product found: ${product.id}, skipping`);
        return false;
      }
      
      seenIds.add(product.id);
      return true;
    });
  };
  
  // 初始化数据
  useEffect(() => {
    // 同步加载localStorage数据，避免中间空状态
    const loadProducts = () => {
      try {
        // 开发环境下，强制使用默认mock数据进行测试
        if (process.env.NODE_ENV !== 'production') {
          console.log('Development environment: Using default mock data for testing');
          // 清除旧的localStorage数据，确保使用新的mock数据
          localStorage.removeItem('importedProducts');
          localStorage.removeItem('hasImportedData');
          // 直接设置默认mock数据，跳过localStorage读取
          const defaultMockProducts = generateDefaultMockProducts();
          console.log('直接设置默认mock数据，数量:', defaultMockProducts.length);
          setProducts(defaultMockProducts);
          setIsLoading(false);
          return;
        }
        
        const savedProducts = localStorage.getItem('importedProducts');
        console.log('Initializing products, found in localStorage:', !!savedProducts);
        
        if (savedProducts) {
          const parsedProducts = JSON.parse(savedProducts);
          console.log('Parsed products from localStorage:', parsedProducts.length, 'items');
          
          // 检查数据是否有效
          if (Array.isArray(parsedProducts)) {
            // 先去重
            const deduplicatedProducts = deduplicateProducts(parsedProducts);
            console.log('Products after deduplication:', deduplicatedProducts.length);
            
            // 然后过滤掉任何无效的产品数据
            const validProducts = deduplicatedProducts.filter(product => {
              if (!product) return false;
              // 确保基本字段存在
              const hasId = product.id !== undefined && product.id !== null && String(product.id).trim() !== '';
              const hasModel = product.model !== undefined && product.model !== null && String(product.model).trim() !== '';
              const hasName = product.name !== undefined && product.name !== null && String(product.name).trim() !== '';
              // 确保筛选所需的字段也存在
              const hasRequiredFields = product.platform !== undefined && product.family !== undefined && product.targetMarket !== undefined;
              
              return hasId && hasModel && hasName && hasRequiredFields;
            });
            
            console.log('Valid products after filtering:', validProducts.length);
            
            if (validProducts.length > 0) {
              setProducts(validProducts);
              // 如果有重复数据被移除，更新localStorage
              if (deduplicatedProducts.length < parsedProducts.length) {
                localStorage.setItem('importedProducts', JSON.stringify(validProducts));
                console.log('Updated localStorage with deduplicated data');
              }
              console.log('Products loaded successfully');
              return;
            }
          }
        }
        
        // 没有有效数据，使用默认mock数据
        console.log('No valid products in localStorage, setting default mock data');
        
        const defaultMockProducts = generateDefaultMockProducts();
        setProducts(defaultMockProducts);
        // 同时保存到localStorage
        localStorage.setItem('importedProducts', JSON.stringify(defaultMockProducts));
        localStorage.setItem('hasImportedData', 'true');
      } finally {
        // 确保加载完成后设置isLoading为false
        setIsLoading(false);
      }
    };
  
    
    loadProducts();
  }, []);
  
  // 生成默认mock产品数据的函数
  const generateDefaultMockProducts = () => {
    const now = new Date().toISOString();
    return [
      {
        id: 'PROD-001',
        model: 'Laptop-X1-2024',
        name: 'ThinkPad X1 Carbon 2024',
        status: 'active',
        lifecycle: 'development',
        category: 'Ultrabook',
        platform: 'Intel',
        family: 'ThinkPad X1',
        targetMarket: 'Enterprise',
        description: 'Premium business laptop with 14-inch display',
        createdAt: now,
        updatedAt: now,
        // 添加一些额外字段以匹配表格显示需求
        serialNumbers: ['SN-X1-001', 'SN-X1-002'],
        targetCost: '9999',
        currentBOM: 'v1.0',
        releaseDate: '2024-12-01',
        specs: 'Intel Core i7, 16GB RAM, 512GB SSD',
        image: 'https://img2.baidu.com/it/u=2850292769,2241218720&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500'
      },
      {
        id: 'PROD-002',
        model: 'Gaming-Y9000K',
        name: 'Legion Y9000K 2024',
        status: 'active',
        lifecycle: 'production',
        category: 'Gaming',
        platform: 'Intel',
        family: 'Legion Gaming',
        targetMarket: 'Gaming',
        description: 'High performance gaming laptop with RTX 4080',
        createdAt: now,
        updatedAt: now,
        serialNumbers: ['SN-GAMING-001', 'SN-GAMING-002'],
        targetCost: '15999',
        currentBOM: 'v1.2',
        releaseDate: '2024-08-15',
        specs: 'Intel Core i9, 32GB RAM, 2TB SSD, RTX 4080',
        image: 'https://q8.itc.cn/images01/20240424/7807ddf82f544eb0901658718b860c97.png'
      },
      {
        id: 'PROD-003',
        model: 'Yoga-7i',
        name: 'Yoga 7i 2-in-1',
        status: 'active',
        lifecycle: 'production',
        category: '2-in-1',
        platform: 'Intel',
        family: 'Yoga',
        targetMarket: 'Consumer',
        description: 'Versatile 2-in-1 laptop with touchscreen',
        createdAt: now,
        updatedAt: now,
        serialNumbers: ['SN-YOGA-001'],
        targetCost: '6999',
        currentBOM: 'v1.1',
        releaseDate: '2024-06-10',
        specs: 'Intel Core i5, 8GB RAM, 256GB SSD, Touchscreen',
        image: 'https://img2.baidu.com/it/u=1061063816,1810405195&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500'
      },
      {
        id: 'PROD-004',
        model: 'IdeaPad-5',
        name: 'IdeaPad 5',
        status: 'draft',
        lifecycle: 'planning',
        category: 'Ultrabook',
        platform: 'AMD',
        family: 'IdeaPad Consumer',
        targetMarket: 'Business',
        description: 'Affordable business laptop with good battery life',
        createdAt: now,
        updatedAt: now,
        serialNumbers: [],
        targetCost: '4999',
        currentBOM: 'v0.9',
        releaseDate: '2024-10-01',
        specs: 'AMD Ryzen 5, 8GB RAM, 256GB SSD',
        image: 'https://b0.bdstatic.com/f5c3c853d088b04dd6d8963588c8de65.jpg'
      },
      {
        id: 'PROD-005',
        model: 'ThinkBook-14',
        name: 'ThinkBook 14 G5',
        status: 'deprecated',
        lifecycle: 'sustaining',
        category: 'Ultrabook',
        platform: 'Intel',
        family: 'ThinkBook',
        targetMarket: 'Business',
        description: 'Business laptop with ThinkPad reliability',
        createdAt: now,
        updatedAt: now,
        serialNumbers: ['SN-TB-001', 'SN-TB-002', 'SN-TB-003'],
        targetCost: '5999',
        currentBOM: 'v1.3',
        releaseDate: '2023-03-15',
        specs: 'Intel Core i5, 16GB RAM, 512GB SSD',
        image: 'https://img0.baidu.com/it/u=3606105695,3727977930&fm=253&app=138&f=JPEG?w=800&h=800'
      }
    ];
  }

  // 保存产品数据到localStorage
  const saveProducts = (newProducts) => {
    // 确保数据是有效的数组
    if (!Array.isArray(newProducts)) {
      console.error('saveProducts called with non-array data:', newProducts);
      return;
    }
    
    setProducts(newProducts);
    // 确保不在加载状态
    setIsLoading(false);
    
    // 添加日志以便调试
    console.log('Saving products to localStorage:', newProducts.length, 'products');
    
    try {
      localStorage.setItem('importedProducts', JSON.stringify(newProducts));
      localStorage.setItem('hasImportedData', 'true'); // 设置导入标识
      console.log('Products successfully saved to localStorage');
    } catch (error) {
      console.error('Failed to save products to localStorage:', error);
    }
  };

  // 添加新产品
  const addProduct = (product) => {
    console.log('Adding new product:', product);
    console.log('Current products count before add:', products.length);
    
    // 验证产品数据
    if (!product || !product.id) {
      console.error('Invalid product data: missing ID');
      return products;
    }
    
    // 应用状态到生命周期的映射
    const lifecycle = product.lifecycle || getStatusToLifecycleMapping(product.status);
    
    const newProducts = [...products, { 
      ...product, 
      lifecycle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];
    console.log('Products count after add:', newProducts.length);
    
    saveProducts(newProducts);
    return newProducts;
  };

  // 状态映射：根据状态映射到生命周期
  const getStatusToLifecycleMapping = (status) => {
    switch(status) {
      case "draft":
        return "planning"; // 草稿映射到规划中
      case "active":
        return "development"; // 活跃映射到开发中（默认）
      case "deprecated":
        return "end_of_life"; // 已废弃映射到已停产
      default:
        return status;
    }
  };

  // 更新产品
  const updateProduct = (productId, updatedProduct) => {
    const newProducts = products.map(p => {
      if (p.id === productId) {
        // 如果状态发生变化，应用状态到生命周期的映射
        const statusChanged = updatedProduct.status && updatedProduct.status !== p.status;
        const lifecycle = statusChanged ? getStatusToLifecycleMapping(updatedProduct.status) : (updatedProduct.lifecycle || p.lifecycle);
        
        return {
          ...p, 
          ...updatedProduct,
          lifecycle,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProducts(newProducts);
    return newProducts;
  };

  // 删除产品
  const deleteProduct = (productId) => {
    const newProducts = products.filter(p => p.id !== productId);
    saveProducts(newProducts);
    return newProducts;
  };

  // 批量删除产品
  const deleteProducts = (productIds) => {
    const newProducts = products.filter(p => !productIds.includes(p.id));
    saveProducts(newProducts);
    return newProducts;
  };

  // 导入产品
  const importProducts = (newProducts) => {
    console.log('Importing products:', newProducts.length, 'new items');
    console.log('Current products count:', products.length);
    
    // 确保输入数据是数组
    if (!Array.isArray(newProducts)) {
      console.error('importProducts called with non-array data:', newProducts);
      return products;
    }
    
    // 如果当前没有产品，直接导入所有新产品
    if (products.length === 0) {
      const updatedProducts = [...newProducts];
      console.log('No existing products, importing all new products:', updatedProducts.length);
      saveProducts(updatedProducts);
      return updatedProducts;
    }
    
    // 创建现有产品的ID映射
    const existingProductsMap = new Map();
    products.forEach(p => {
      existingProductsMap.set(p.id, p);
    });
    
    // 合并策略：保留原有产品，更新重复ID的产品，添加新ID的产品
    const updatedProducts = [...products];
    const updatedIds = new Set();
    
    newProducts.forEach(newProduct => {
      if (existingProductsMap.has(newProduct.id)) {
        // 如果ID重复，检查是否需要更新
        const existingProduct = existingProductsMap.get(newProduct.id);
        // 这里可以选择更新或保留原有产品，目前我们保留原有产品，但添加日志
        console.log(`Found duplicate ID: ${newProduct.id}, keeping existing product`);
        updatedIds.add(newProduct.id);
      } else {
        // 新产品，直接添加
        updatedProducts.push(newProduct);
        updatedIds.add(newProduct.id);
        console.log(`Added new product with ID: ${newProduct.id}`);
      }
    });
    
    console.log('Total products after import:', updatedProducts.length);
    saveProducts(updatedProducts);
    return updatedProducts;
  };

  // 清空产品数据
  const clearProducts = () => {
    saveProducts([]);
  };

  const value = {
    products,
    isLoading,
    saveProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteProducts,
    importProducts,
    clearProducts
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductContext;