const fs = require('fs');

// 直接指定文件路径
const content = fs.readFileSync('src/components/CostComplianceStep.jsx', 'utf8');

// 简单的括号计数
let open = 0;
let close = 0;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') open++;
  if (content[i] === '}') close++;
}

console.log('开括号数量:', open);
console.log('闭括号数量:', close);
console.log('差异:', open - close);
console.log('括号是否匹配:', open === close);