// 简单的语法检查脚本
const fs = require('fs');

// 读取文件内容
const filePath = './src/components/BOMStructureNew.jsx';
try {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('文件读取成功，开始检查语法...');
  
  // 简单检查是否有关闭的括号不匹配
  let openBraces = 0;
  let closeBraces = 0;
  
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') openBraces++;
    if (content[i] === '}') closeBraces++;
  }
  
  console.log(`大括号统计: 开${openBraces}, 闭${closeBraces}`);
  console.log(`大括号匹配: ${openBraces === closeBraces ? '是' : '否'}`);
  
  // 检查是否有其他明显的语法问题
  if (content.includes(']}",bomTreeData')) {
    console.error('发现潜在语法错误: "]}",bomTreeData');
  }
  
  // 检查是否有未闭合的模板字符串
  if ((content.match(/`/g) || []).length % 2 !== 0) {
    console.error('发现未闭合的模板字符串');
  }
  
  console.log('基本语法检查完成');
  
} catch (error) {
  console.error('检查过程中出错:', error.message);
}