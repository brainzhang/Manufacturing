const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

class BOMTemplateChecker {
    constructor() {
        this.templatePaths = [
            path.join(__dirname, '../../client/public/BOM_Import_Template.xlsx'),
            path.join(__dirname, '../../client/dist/BOM_Import_Template.xlsx')
        ];
    }

    async checkTemplateContent() {
        console.log('🔍 检查BOM模板文件内容...\n');

        for (const templatePath of this.templatePaths) {
            if (!fs.existsSync(templatePath)) {
                console.log(`❌ 模板文件不存在: ${templatePath}`);
                continue;
            }

            console.log(`📄 检查文件: ${path.basename(templatePath)}`);
            
            try {
                const workbook = xlsx.readFile(templatePath);
                const sheetNames = workbook.SheetNames;
                
                console.log(`   工作表数量: ${sheetNames.length}`);
                console.log(`   工作表名称: ${sheetNames.join(', ')}`);
                
                // 检查主工作表
                const mainSheetName = sheetNames[0];
                const worksheet = workbook.Sheets[mainSheetName];
                const data = xlsx.utils.sheet_to_json(worksheet);
                
                console.log(`   数据行数: ${data.length}`);
                
                if (data.length > 0) {
                    console.log('   示例数据:');
                    console.log('   ', data[0]);
                }
                
                console.log('');
                
            } catch (error) {
                console.error(`   检查失败: ${error.message}`);
            }
        }
    }

    async validateTemplateStructure(templatePath) {
        if (!fs.existsSync(templatePath)) {
            return { valid: false, error: '文件不存在' };
        }

        try {
            const workbook = xlsx.readFile(templatePath);
            const sheetNames = workbook.SheetNames;
            
            if (sheetNames.length === 0) {
                return { valid: false, error: '没有工作表' };
            }

            const mainSheet = workbook.Sheets[sheetNames[0]];
            const data = xlsx.utils.sheet_to_json(mainSheet);
            
            if (data.length === 0) {
                return { valid: false, error: '没有数据' };
            }

            // 检查必需字段
            const requiredFields = ['BOM Name', 'Version', 'Product Line'];
            const firstRow = data[0];
            const missingFields = requiredFields.filter(field => !firstRow.hasOwnProperty(field));
            
            if (missingFields.length > 0) {
                return { 
                    valid: false, 
                    error: `缺少必需字段: ${missingFields.join(', ')}` 
                };
            }

            return { valid: true, rowCount: data.length, fields: Object.keys(firstRow) };
            
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

module.exports = BOMTemplateChecker;