import { ConfigProvider } from 'antd';
import React from 'react';

// 全局antd配置
const antdConfig = {
  // 在这里可以配置全局主题、语言等
  getPopupContainer: () => document.body,
};

export default antdConfig;

// 导出一个包装组件，用于在应用入口处包裹
export const AntdConfigWrapper = ({ children }) => {
  return <ConfigProvider {...antdConfig}>{children}</ConfigProvider>;
};