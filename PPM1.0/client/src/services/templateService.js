import { bom7LayerTemplate } from '../components/bom7LayerTemplate';

// 模拟模板API服务
const templateService = {
  // 获取模板
  getTemplate: async (templateId) => {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 从模板库中查找对应模板
    const template = bom7LayerTemplate[templateId];
    
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    
    return template;
  },
  
  // 获取模板历史记录
  getTemplateHistory: async (templateId) => {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 返回模拟的历史记录
    return [
      {
        id: `${templateId}_v1`,
        version: 'v1.0',
        modifiedBy: '系统管理员',
        modifiedAt: '2024-01-15T10:30:00Z',
        changes: '初始版本创建'
      },
      {
        id: `${templateId}_v2`,
        version: 'v1.1',
        modifiedBy: '张工程师',
        modifiedAt: '2024-02-20T14:15:00Z',
        changes: '更新CPU型号为最新一代'
      },
      {
        id: `${templateId}_v3`,
        version: 'v1.2',
        modifiedBy: '李工程师',
        modifiedAt: '2024-03-10T09:45:00Z',
        changes: '调整内存配置，增加成本预算'
      }
    ];
  },
  
  // 保存模板
  saveTemplate: async (templateId, templateData) => {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 模拟保存操作
    console.log('保存模板:', templateId, templateData);
    
    return {
      success: true,
      message: '模板保存成功',
      templateId: templateId,
      version: 'v1.3',
      modifiedAt: new Date().toISOString()
    };
  }
};

export default templateService;