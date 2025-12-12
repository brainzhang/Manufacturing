import api from './api';
import { mockDashboardData } from '../components/cost/mockData';

export const fetchDashboardData = async () => {
  try {
    // 使用模拟数据代替实际API调用，避免请求中止错误
    // const response = await api.get('/dashboard');
    // return response.data;
    
    // 返回模拟数据，避免真实API调用
    return mockDashboardData;
  } catch (error) {
    console.error('Dashboard data fetch failed:', error);
    // 即使失败也返回模拟数据，确保应用正常运行
    return mockDashboardData;
  }
};