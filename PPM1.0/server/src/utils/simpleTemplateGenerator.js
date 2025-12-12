const ExcelJS = require('exceljs');

class SimpleTemplateGenerator {
    constructor() {
        this.workbook = new ExcelJS.Workbook();
    }

    // 生成操作指引
    generateInstructions(worksheet) {
        // 添加操作指引标题
        worksheet.getCell('A1').value = 'BOM Import Template - Instructions';
        worksheet.getCell('A1').font = { bold: true, size: 14 };
        
        // 操作步骤
        worksheet.getCell('A3').value = 'Instructions:';
        worksheet.getCell('A3').font = { bold: true };
        
        const instructions = [
            '1. Fill in the required data in the template',
            '2. ID fields (BOM ID, Part ID, Product ID) cannot be modified - they are read-only',
            '3. Use dropdown menus for selectable fields',
            '4. Status field has three states: Active, Inactive, Draft',
            '5. Actions field has two states: push, pushed',
            '6. Push availability rules:',
            '   - Active status: push available',
            '   - Inactive/Draft status: push unavailable',
            '   - pushed action: always unavailable',
            '7. Save the file and upload it through the BOM import interface'
        ];
        
        instructions.forEach((instruction, index) => {
            worksheet.getCell(`A${index + 4}`).value = instruction;
        });
        
        // 空行分隔
        worksheet.getCell(`A${instructions.length + 5}`).value = '';
    }

    // 生成表头 - 根据前端页面实际表头结构
    generateHeaders(worksheet) {
        const headers = [
            'BOM ID', 'BOM Name', 'Part ID', 'Part Name', 'Quantity', 
            'Product ID', 'Product Name', 'Version', 'Product Line', 
            'Status', 'Actions'
        ];
        
        headers.forEach((header, index) => {
            const cell = worksheet.getCell(10, index + 1);
            cell.value = header;
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE6E6FA' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    }

    // 设置数据验证（下拉框）- 根据前端页面实际字典值
    setupDataValidation(worksheet) {
        // 为每个单元格单独设置数据验证
        for (let row = 11; row <= 100; row++) {
            // BOM Name 下拉选项 - 根据前端实际值
            worksheet.getCell(`B${row}`).dataValidation = {
                type: 'list',
                formulae: ['"Resistor SOT 10kΩ,Capacitor 100uF,Transistor NPN,Diode 1N4148,IC Chip ATmega328,Connector USB-C"'],
                allowBlank: true
            };

            // Part Name 下拉选项 - 根据前端实际值
            worksheet.getCell(`D${row}`).dataValidation = {
                type: 'list',
                formulae: ['"Power Supply,CPU Module,Memory Module,Storage Device,Network Card,Motherboard"'],
                allowBlank: true
            };

            // Quantity 数值验证 - 只能输入正整数
            worksheet.getCell(`E${row}`).dataValidation = {
                type: 'whole',
                operator: 'greaterThan',
                formulae: [0],
                allowBlank: true
            };

            // Product Name 下拉选项 - 根据前端实际值
            worksheet.getCell(`G${row}`).dataValidation = {
                type: 'list',
                formulae: ['"ThinkPad P15,ThinkPad X1 Carbon,ThinkPad T14,ThinkPad P1,ThinkPad X13"'],
                allowBlank: true
            };

            // Version 自定义验证 - 只能输入Gen+正数值
            worksheet.getCell(`H${row}`).dataValidation = {
                type: 'custom',
                formulae: ['AND(LEFT(H' + row + ',3)="Gen",ISNUMBER(VALUE(MID(H' + row + ',4,LEN(H' + row + ')-3))))'],
                allowBlank: true,
                showErrorMessage: true,
                errorTitle: 'Invalid Version Format',
                error: 'Version must be in format "Gen" followed by a number (e.g., Gen1, Gen2)'
            };

            // Product Line 下拉选项 - 根据前端实际值
            worksheet.getCell(`I${row}`).dataValidation = {
                type: 'list',
                formulae: ['"ThinkPad,ThinkBook,ThinkCentre,ThinkStation,ThinkSystem"'],
                allowBlank: true
            };

            // Status 下拉选项 - 三个独立状态：Active、Inactive、Draft
            worksheet.getCell(`J${row}`).dataValidation = {
                type: 'list',
                formulae: ['"Active,Inactive,Draft"'],
                allowBlank: true
            };

            // Actions 下拉选项 - push、pushed
            worksheet.getCell(`K${row}`).dataValidation = {
                type: 'list',
                formulae: ['"push,pushed"'],
                allowBlank: true
            };
        }
    }

    // 设置单元格保护 - 正确实现单元格保护逻辑
    setupCellProtection(worksheet) {
        // 默认所有单元格都是解锁状态（可编辑）
        // 只锁定需要保护的单元格
        
        // ID字段设置为只读（不能修改）- 只保护ID字段
        const protectedColumns = ['A', 'C', 'F']; // BOM ID, Part ID, Product ID
        
        protectedColumns.forEach(col => {
            for (let row = 11; row <= 100; row++) {
                const cell = worksheet.getCell(`${col}${row}`);
                cell.protection = { locked: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF5F5F5' }
                };
            }
        });

        // Status字段设置为可编辑 - 用户手动选择状态
        for (let row = 11; row <= 100; row++) {
            const cell = worksheet.getCell(`J${row}`);
            cell.protection = { locked: false }; // 允许编辑
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFFFF' } // 白色背景表示可编辑
            };
        }

        // 保护工作表，但允许编辑非锁定单元格
        worksheet.protect('password123', {
            selectLockedCells: true,
            selectUnlockedCells: true,
            formatCells: true,
            formatColumns: true,
            formatRows: true,
            insertColumns: false,
            insertRows: false,
            insertHyperlinks: false,
            deleteColumns: false,
            deleteRows: false,
            sort: false,
            autoFilter: false,
            pivotTables: false
        });
    }

    // 生成示例数据 - 根据新的Status和Actions映射关系
    generateSampleData(worksheet) {
        // 根据新的状态映射要求：Status有三个状态，Actions有push和pushed
        // 推送可用性规则：Active状态可以push，Inactive/Draft状态不能push，pushed状态始终不能push
        const sampleData = [
            ['Res0100', 'Resistor SOT 10kΩ', 'PS0001', 'Power Supply', 1, 'PROD005', 'ThinkPad P15', 'Gen1', 'ThinkPad', 'Active', 'push'],        // Active状态：push available
            ['Res0101', 'Capacitor 100uF', 'PS0002', 'CPU Module', 2, 'PROD006', 'ThinkPad X1 Carbon', 'Gen2', 'ThinkPad', 'Inactive', 'pushed'],   // Inactive状态：pushed（不可推送）
            ['Res0102', 'Transistor NPN', 'PS0003', 'Memory Module', 1, 'PROD007', 'ThinkPad T14', 'Gen1', 'ThinkPad', 'Draft', 'push']           // Draft状态：push unavailable
        ];

        sampleData.forEach((rowData, rowIndex) => {
            rowData.forEach((cellData, colIndex) => {
                const cell = worksheet.getCell(11 + rowIndex, colIndex + 1);
                cell.value = cellData;
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });
    }

    // 设置列宽
    setupColumnWidths(worksheet) {
        worksheet.columns = [
            { width: 15 }, // BOM ID
            { width: 20 }, // BOM Name
            { width: 15 }, // Part ID
            { width: 20 }, // Part Name
            { width: 10 }, // Quantity
            { width: 15 }, // Product ID
            { width: 20 }, // Product Name
            { width: 12 }, // Version
            { width: 15 }, // Product Line
            { width: 12 }, // Status
            { width: 12 }  // Actions
        ];
    }

    // 生成模板
    async generateTemplate() {
        const worksheet = this.workbook.addWorksheet('BOM Import Template');
        
        // 生成各个部分
        this.generateInstructions(worksheet);
        this.generateHeaders(worksheet);
        this.setupDataValidation(worksheet);
        this.setupCellProtection(worksheet);
        this.generateSampleData(worksheet);
        this.setupColumnWidths(worksheet);

        // 生成Excel缓冲区
        const buffer = await this.workbook.xlsx.writeBuffer({
            useStyles: false,
            useSharedStrings: false
        });

        return buffer;
    }

    // 生成简单模板（备用方案）
    async generateSimpleTemplate() {
        const worksheet = this.workbook.addWorksheet('BOM Import Template');
        
        // 简化版本 - 只包含基本结构和字段
        const headers = [
            'BOM ID', 'BOM Name', 'Part ID', 'Part Name', 'Quantity', 
            'Product ID', 'Product Name', 'Version', 'Product Line', 
            'Status', 'Actions'
        ];
        
        // 添加表头
        headers.forEach((header, index) => {
            worksheet.getCell(1, index + 1).value = header;
        });

        // 添加示例数据 - 根据新的Status和Actions映射关系
        const sampleData = [
            ['Res0100', 'Resistor SOT 10kΩ', 'PS0001', 'Power Supply', 1, 'PROD005', 'ThinkPad P15', 'Gen1', 'ThinkPad', 'Active', 'push']
        ];

        sampleData.forEach((rowData, rowIndex) => {
            rowData.forEach((cellData, colIndex) => {
                worksheet.getCell(rowIndex + 2, colIndex + 1).value = cellData;
            });
        });

        const buffer = await this.workbook.xlsx.writeBuffer();
        return buffer;
    }
}

module.exports = SimpleTemplateGenerator;