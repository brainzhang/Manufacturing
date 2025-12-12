import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AntdConfigWrapper } from './config/antdConfig.jsx';

// 在应用启动时清除任何无效的产品数据
const cleanInvalidProductData = () => {
  try {
    // 检查并清理localStorage中的产品数据
    const savedProducts = localStorage.getItem('importedProducts');
    if (savedProducts) {
      const parsedProducts = JSON.parse(savedProducts);
      // 如果数据格式不正确或包含无效数据，清除它
      if (!Array.isArray(parsedProducts) || 
          parsedProducts.some(product => !product || !product.id || !product.model)) {
        localStorage.removeItem('importedProducts');
        console.log('已清除无效的产品数据');
      }
    }
  } catch (error) {
    // 如果解析失败，清除可能损坏的数据
    localStorage.removeItem('importedProducts');
    console.log('已清除损坏的产品数据');
  }
};

// 在应用启动前清理数据
cleanInvalidProductData();

// Simple test function to check if the DOM is ready
function testDOM() {
  console.log('DOM Test - Document readyState:', document.readyState);
  console.log('DOM Test - Body exists:', !!document.body);
  console.log('DOM Test - Root element:', document.getElementById('root'));
  console.log('DOM Test - Loading element:', document.getElementById('loading'));
}

// Function to safely render the app
function renderApp() {
  console.log('renderApp called');
  testDOM();
  
  const rootElement = document.getElementById('root');
  const loadingElement = document.getElementById('loading');
  
  console.log('rootElement:', rootElement);
  console.log('loadingElement:', loadingElement);
  
  // 不再直接隐藏loading元素，让React组件内部根据数据加载状态来控制显示
  // 这样可以确保在数据加载完成前，loading元素保持可见
  
  if (!rootElement) {
    console.error('Failed to find the root element. Make sure index.html contains <div id="root"></div>');
    return;
  }
  
  // Clear any existing content
  rootElement.innerHTML = '';
  
  // Render the app
  try {
    console.log('Rendering React app');
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <AntdConfigWrapper>
          <App />
        </AntdConfigWrapper>
      </React.StrictMode>
    );
    console.log('React app rendered successfully');
    
    // 添加一个轮询函数来检查数据是否加载完成
    let checkCount = 0;
    const maxChecks = 30; // 最多检查30次，避免无限循环
    
    const checkDataLoaded = () => {
      checkCount++;
      
      // 检查ProductContext是否已经初始化并且数据已经加载完成
      // 通过React组件树查找包含isLoading状态的组件
      console.log(`Checking if data loaded... (${checkCount}/${maxChecks})`);
      
      // 方法1：使用setTimeout延迟隐藏loading元素，确保用户能看到加载过程
      if (checkCount >= 3) { // 延迟约300ms后隐藏，让用户能看到加载动画
        if (loadingElement && loadingElement.style) {
          console.log('Hiding loading element after app render');
          loadingElement.style.display = 'none';
        }
        return;
      }
      
      // 方法2：如果没有达到最大检查次数，继续轮询
      if (checkCount < maxChecks) {
        setTimeout(checkDataLoaded, 100);
      } else {
        // 达到最大检查次数后，强制隐藏loading元素
        if (loadingElement && loadingElement.style) {
          console.log('Forcing hide loading element after max checks');
          loadingElement.style.display = 'none';
        }
      }
    };
    
    // 开始检查
    checkDataLoaded();
    
  } catch (error) {
    console.error('Failed to render React app:', error);
    rootElement.innerHTML = '<div style="color: red; padding: 20px;">Failed to render React app. Check console for errors.</div>';
    // 如果渲染失败，也隐藏loading元素
    if (loadingElement && loadingElement.style) {
      loadingElement.style.display = 'none';
    }
  }
}

// Test DOM immediately
testDOM();

// Use a flag to prevent multiple renders
let appRendered = false;

function initApp() {
  if (appRendered) {
    console.log('App already rendered, skipping duplicate render');
    return;
  }
  
  console.log('Calling renderApp');
  renderApp();
  appRendered = true;
}

// Check if DOM is already ready
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    initApp();
  });
} else {
  // DOM is already ready, render immediately
  console.log('DOM already ready, rendering immediately');
  initApp();
}

// Handle hot module replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}