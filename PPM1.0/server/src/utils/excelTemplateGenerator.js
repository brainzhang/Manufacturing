const ExcelJS = require('exceljs');
const Part = require('../models/Part');
const Product = require('../models/Product');
const BOM = require('../models/BOM');

class ExcelTemplateGenerator {
  
  /**
   * 获取系统中所有可用的BOM数据（包含ID和名称映射）
   */
  async getAvailableBOMs() {
    try {
      // 检查MongoDB连接状态
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.log('MongoDB not connected, using sample BOM data');
        return this.getSampleBOMs();
      }
      
      const boms = await BOM.find({})
        .select('bom_id bom_name')
        .sort({ bom_name: 1 })
        .lean();
      
      // 如果没有数据，返回示例数据
      if (boms.length === 0) {
        return this.getSampleBOMs();
      }
      
      return boms;
    } catch (error) {
      console.error('Error fetching BOMs:', error);
      // 返回示例数据
      return this.getSampleBOMs();
    }
  }

  /**
   * 获取示例BOM数据
   */
  getSampleBOMs() {
    return [
      { bom_id: 'BOM0001', bom_name: '主板BOM' },
      { bom_id: 'BOM0002', bom_name: '电源BOM' },
      { bom_id: 'BOM0003', bom_name: '控制板BOM' },
      { bom_id: 'BOM0004', bom_name: '接口板BOM' }
    ];
  }

  /**
   * 获取系统中所有可用的零件数据（包含ID和名称映射）
   */
  async getAvailableParts() {
    try {
      // 检查MongoDB连接状态
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.log('MongoDB not connected, using sample part data');
        return this.getSampleParts();
      }
      
      const parts = await Part.find({})
        .select('part_id name')
        .sort({ name: 1 })
        .lean();
      
      // 如果没有数据，返回示例数据
      if (parts.length === 0) {
        return this.getSampleParts();
      }
      
      return parts;
    } catch (error) {
      console.error('Error fetching parts:', error);
      // 返回示例数据
      return this.getSampleParts();
    }
  }

  /**
   * 获取示例零件数据
   */
  getSampleParts() {
    return [
      { part_id: 'PT0001', name: 'CPU处理器' },
      { part_id: 'PT0002', name: '内存条' },
      { part_id: 'PT0003', name: '硬盘' },
      { part_id: 'PT0004', name: '电源模块' },
      { part_id: 'PT0005', name: '主板芯片' },
      { part_id: 'PT0006', name: '网卡' }
    ];
  }

  /**
   * 获取系统中所有可用的产品数据（包含ID和名称映射）
   */
  async getAvailableProducts() {
    try {
      // 检查MongoDB连接状态
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.log('MongoDB not connected, using sample product data');
        return this.getSampleProducts();
      }
      
      const products = await Product.find({ status: { $in: ['development', 'production'] } })
        .select('product_id model')
        .sort({ model: 1 })
        .lean();
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return this.getSampleProducts();
    }
  }

  /**
   * 获取示例产品数据
   */
  getSampleProducts() {
    return [
      { product_id: 'PROD001', model: '服务器A型' },
      { product_id: 'PROD002', model: '服务器B型' },
      { product_id: 'PROD003', model: '工作站C型' },
      { product_id: 'PROD004', model: '笔记本D型' }
    ];
  }

  /**
   * 获取系统中所有可用的产品线
   */
  async getAvailableProductLines() {
    try {
      // 检查MongoDB连接状态
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        console.log('MongoDB not connected, using sample product lines');
        return this.getSampleProductLines();
      }
      
      const products = await Product.find({ status: { $in: ['development', 'production'] } })
        .select('product_line')
        .sort({ product_line: 1 })
        .lean();
      
      const productLines = [...new Set(products.map(product => product.product_line))];
      
      // 如果没有数据，返回示例数据
      if (productLines.length === 0) {
        return this.getSampleProductLines();
      }
      
      return productLines;
    } catch (error) {
      console.error('Error fetching product lines:', error);
      return this.getSampleProductLines();
    }
  }

  /**
   * 获取示例产品线数据
   */
  getSampleProductLines() {
    return ['服务器产品线', '工作站产品线', '笔记本产品线', '台式机产品线'];
  }

  /**
   * 获取系统中所有可用的状态选项
   */
  getAvailableStatusOptions() {
    return ['draft', 'active', 'inactive', 'discarded'];
  }

  /**
   * 获取系统中所有可用的Position选项
   */
  getAvailablePositionOptions() {
    return ['Power Supply', 'Signal Processing', 'Control Circuit', 'Interface', 'Sensor', 'Oscillator', 'Filter'];
  }

  /**
   * 获取系统中所有可用的Actions选项
   */
  getAvailableActionsOptions() {
    return ['EDIT', 'APPROVE', 'REJECT', 'DISCARD'];
  }

  /**
   * 获取Actions与Status的映射关系
   */
  getActionsStatusMapping() {
    return {
      'EDIT': 'draft',
      'APPROVE': 'active',
      'REJECT': 'inactive',
      'DISCARD': 'discarded'
    };
  }

  /**
   * 创建带有真正下拉框和映射功能的Excel模板
   */
  async createBOMImportTemplate() {
    try {
      // 获取所有下拉选项数据和映射关系
      const [boms, parts, products, productLines, statusOptions, positionOptions, actionsOptions] = await Promise.all([
        this.getAvailableBOMs(),
        this.getAvailableParts(),
        this.getAvailableProducts(),
        this.getAvailableProductLines(),
        Promise.resolve(this.getAvailableStatusOptions()),
        Promise.resolve(this.getAvailablePositionOptions()),
        Promise.resolve(this.getAvailableActionsOptions())
      ]);

      // 创建工作簿
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'PPM 3.0 System';
      workbook.created = new Date();

      // 创建主数据表
      const worksheet = workbook.addWorksheet('BOM导入模板');

      // 设置列宽
      worksheet.columns = [
        { header: 'BOM ID', key: 'bom_id', width: 15 },
        { header: 'BOM Name', key: 'bom_name', width: 25 },
        { header: 'Part ID', key: 'part_id', width: 15 },
        { header: 'Part Name', key: 'part_name', width: 25 },
        { header: 'Quantity', key: 'quantity', width: 12 },
        { header: 'Position', key: 'position', width: 20 },
        { header: 'Product ID', key: 'product_id', width: 15 },
        { header: 'Product Name', key: 'product_name', width: 25 },
        { header: 'Version', key: 'version', width: 12 },
        { header: 'Product Line', key: 'product_line', width: 18 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Actions', key: 'actions', width: 12 }
      ];

      // 添加标题行
      worksheet.mergeCells('A1:L1');
      worksheet.getCell('A1').value = 'BOM导入模板 - 请勿修改表头格式';
      worksheet.getCell('A1').font = { bold: true, size: 14 };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A2:L2');
      worksheet.getCell('A2').value = '说明：请在下方数据区域填写BOM信息，带下拉框的单元格请从下拉列表中选择';
      worksheet.getCell('A2').font = { bold: true };

      // 添加表头
      const headerRow = worksheet.getRow(4);
      headerRow.values = ['BOM ID', 'BOM Name', 'Part ID', 'Part Name', 'Quantity', 'Position', 'Product ID', 'Product Name', 'Version', 'Product Line', 'Status', 'Actions'];
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: 'center' };

      // 保护表头行（第4行）- 设置为只读
      for (let col = 1; col <= 12; col++) {
        const cell = worksheet.getCell(4, col);
        cell.protection = { locked: true };
      }

      // 添加示例数据行
      const dataRow = worksheet.getRow(5);
      dataRow.values = [
        'BOM0001',
        '', // BOM Name - 下拉选择
        'PT0001',
        '', // Part Name - 下拉选择
        '1',
        'Power Supply',
        'PROD001',
        '', // Product Name - 下拉选择
        'Gen 1',
        '', // Product Line - 下拉选择
        '', // Status - 下拉选择
        'EDIT'
      ];

      // 保护ID字段（A、C、G列）- 设置为只读
      for (let row = 5; row <= 100; row++) {
        ['A', 'C', 'G'].forEach(col => {
          const cell = worksheet.getCell(col + row);
          cell.protection = { locked: true };
        });
      }

      // 设置可编辑字段的保护状态为false（解锁）
      // BOM Name (B列), Part Name (D列), Quantity (E列), Position (F列), 
      // Product Name (H列), Version (I列), Product Line (J列), Status (K列), Actions (L列)
      for (let row = 5; row <= 100; row++) {
        ['B', 'D', 'E', 'F', 'H', 'I', 'J', 'K', 'L'].forEach(col => {
          const cell = worksheet.getCell(col + row);
          cell.protection = { locked: false };
        });
      }

      // BOM Name - 验证值是否正确
      const bomNames = boms.map(bom => bom.bom_name);
      const bomList = bomNames.length > 0 ? bomNames : ['主板BOM', '电源BOM', '控制板BOM', '接口板BOM'];
      
      // 添加数据验证，确保输入的值在有效列表中
      worksheet.getCell('B5').dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`"${bomList.join(',')}"`],
        showDropDown: true,
        showErrorMessage: true,
        errorTitle: 'Invalid BOM Name',
        error: 'Please enter a valid BOM name, you can select from the dropdown list'
      };

      // Part Name 下拉框
      const partNames = parts.map(part => part.name);
      const partList = partNames.length > 0 ? partNames : ['CPU处理器', '内存条', '硬盘', '电源模块', '主板芯片', '网卡'];
      worksheet.getCell('D5').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${partList.join(',')}"`],
        showDropDown: true,
        showErrorMessage: true,
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid part name from the dropdown list'
      };

      // Quantity 数值验证 - 必须大于0
      worksheet.getCell('E5').dataValidation = {
        type: 'decimal',
        operator: 'greaterThan',
        formulae: [0],
        allowBlank: false,
        showErrorMessage: true,
        errorTitle: 'Invalid Quantity',
        error: 'Quantity must be a number greater than 0'
      };

      // Position 下拉框
      worksheet.getCell('F5').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${positionOptions.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid position from the dropdown list'
      };

      // Product Name - 验证值是否正确
      const productModels = products.map(product => product.model);
      const productList = productModels.length > 0 ? productModels : ['服务器A型', '服务器B型', '工作站C型', '笔记本D型'];
      
      // 添加数据验证，确保输入的值在有效列表中
      worksheet.getCell('H5').dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`"${productList.join(',')}"`],
        showDropDown: true,
        showErrorMessage: true,
        errorTitle: 'Invalid Product Name',
        error: 'Please enter a valid product name, you can select from the dropdown list'
      };

      // Product Line 下拉框
      worksheet.getCell('J5').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [productLines.length > 0 ? `"${productLines.join(',')}"` : '"服务器产品线,工作站产品线,笔记本产品线,台式机产品线"'],
        showErrorMessage: true,
        errorTitle: '无效选择',
        error: '请从下拉列表中选择有效的产品线'
      };

      // Version 自定义验证 - 必须为"Gen+正整数"格式
      worksheet.getCell('I5').dataValidation = {
        type: 'custom',
        allowBlank: false,
        formulae: ['AND(LEFT(I5,3)="Gen",ISNUMBER(VALUE(MID(I5,4,LEN(I5)-3))),VALUE(MID(I5,4,LEN(I5)-3))>0)'],
        showErrorMessage: true,
        errorTitle: 'Invalid Version Format',
        error: 'Version must be in "Gen+positive integer" format, e.g.: Gen 1, Gen 2, Gen 10'
      };

      // Status 下拉框 - 只读，通过Actions联动
      worksheet.getCell('K5').dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`"${statusOptions.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Status Locked',
        error: 'Status field is locked, can only be changed through Actions operation'
      };

      // Actions 下拉框
      worksheet.getCell('L5').dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`"${actionsOptions.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Invalid Action',
        error: 'Please select a valid action from the dropdown list'
      };

      // 将数据验证应用到整列（从第5行到第100行）
      for (let row = 6; row <= 100; row++) {
        // BOM Name - 移除数据验证限制，改为模糊输入
        worksheet.getCell(`B${row}`).dataValidation = null;

        // Part Name
        worksheet.getCell(`D${row}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [partNames.length > 0 ? `"${partNames.join(',')}"` : '"CPU处理器,内存条,硬盘,电源模块,主板芯片,网卡"']
        };

        // Quantity 数值验证 - 必须大于0
        worksheet.getCell(`E${row}`).dataValidation = {
          type: 'decimal',
          operator: 'greaterThan',
          formulae: [0],
          allowBlank: false
        };

        // Position
        worksheet.getCell(`F${row}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${positionOptions.join(',')}"`]
        };

        // Product Name - 移除数据验证限制，改为模糊输入
        worksheet.getCell(`H${row}`).dataValidation = null;

        // Version 自定义验证 - 必须为"Gen+正整数"格式
        worksheet.getCell(`I${row}`).dataValidation = {
          type: 'custom',
          allowBlank: false,
          formulae: ['AND(LEFT(I' + row + ',3)="Gen",ISNUMBER(VALUE(MID(I' + row + ',4,LEN(I' + row + ')-3))),VALUE(MID(I' + row + ',4,LEN(I' + row + ')-3))>0)']
        };

        // Product Line
        worksheet.getCell(`J${row}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [productLines.length > 0 ? `"${productLines.join(',')}"` : '"服务器产品线,工作站产品线,笔记本产品线,台式机产品线"']
        };

        // Status
        worksheet.getCell(`K${row}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`"${statusOptions.join(',')}"`]
        };

        // Actions
        worksheet.getCell(`L${row}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`"${actionsOptions.join(',')}"`]
        };

        // 保护ID字段
        ['A', 'C', 'G'].forEach(col => {
          const cell = worksheet.getCell(col + row);
          cell.protection = { locked: true };
        });

        // 设置可编辑字段的保护状态为false（解锁）
        ['B', 'D', 'E', 'F', 'H', 'I', 'J', 'K', 'L'].forEach(col => {
          const cell = worksheet.getCell(col + row);
          cell.protection = { locked: false };
        });
      }

      // 首先确保所有单元格的保护状态正确设置
      // 默认情况下，ExcelJS会锁定所有单元格，所以我们需要显式解锁可编辑的单元格
      
      // 设置工作表保护，允许用户选择和解锁的单元格
      worksheet.protect('PPM3.0', {
        selectLockedCells: true,    // 允许选择锁定的单元格
        selectUnlockedCells: true, // 允许选择解锁的单元格
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false
      });

      // 创建映射关系表
      const mappingWorksheet = workbook.addWorksheet('映射关系参考');
      
      mappingWorksheet.columns = [
        { header: '类型', key: 'type', width: 20 },
        { header: 'ID', key: 'id', width: 15 },
        { header: '名称', key: 'name', width: 30 }
      ];

      let currentRow = 1;
      
      // BOM 映射关系（支持模糊输入）
      mappingWorksheet.getCell(`A${currentRow}`).value = 'BOM 映射关系（支持模糊输入）';
      mappingWorksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      mappingWorksheet.getCell(`A${currentRow}`).value = '说明：BOM Name支持模糊输入，可输入关键词进行智能匹配';
      mappingWorksheet.getCell(`A${currentRow}`).font = { italic: true };
      currentRow++;
      
      mappingWorksheet.getCell(`A${currentRow}`).value = '例如：输入"主板"可匹配"主板BOM"，系统会自动反显完整名称';
      mappingWorksheet.getCell(`A${currentRow}`).font = { italic: true };
      currentRow++;
      
      mappingWorksheet.getCell(`A${currentRow}`).value = 'BOM ID';
      mappingWorksheet.getCell(`B${currentRow}`).value = 'BOM Name';
      mappingWorksheet.getRow(currentRow).font = { bold: true };
      currentRow++;
      
      boms.forEach((bom, index) => {
        mappingWorksheet.getCell(`A${currentRow + index}`).value = bom.bom_id;
        mappingWorksheet.getCell(`B${currentRow + index}`).value = bom.bom_name;
      });
      currentRow += boms.length + 2;

      // Part 映射关系
      mappingWorksheet.getCell(`A${currentRow}`).value = 'Part 映射关系';
      mappingWorksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      mappingWorksheet.getCell(`A${currentRow}`).value = 'Part ID';
      mappingWorksheet.getCell(`B${currentRow}`).value = 'Part Name';
      mappingWorksheet.getRow(currentRow).font = { bold: true };
      currentRow++;
      
      parts.forEach((part, index) => {
        mappingWorksheet.getCell(`A${currentRow + index}`).value = part.part_id;
        mappingWorksheet.getCell(`B${currentRow + index}`).value = part.name;
      });
      currentRow += parts.length + 2;

      // Product 映射关系（支持模糊输入）
      mappingWorksheet.getCell(`A${currentRow}`).value = 'Product 映射关系（支持模糊输入）';
      mappingWorksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      mappingWorksheet.getCell(`A${currentRow}`).value = '说明：Product Name支持模糊输入，可输入关键词进行智能匹配';
      mappingWorksheet.getCell(`A${currentRow}`).font = { italic: true };
      currentRow++;
      
      mappingWorksheet.getCell(`A${currentRow}`).value = '例如：输入"服务器"可匹配"服务器A型"，系统会自动反显完整名称';
      mappingWorksheet.getCell(`A${currentRow}`).font = { italic: true };
      currentRow++;
      
      mappingWorksheet.getCell(`A${currentRow}`).value = 'Product ID';
      mappingWorksheet.getCell(`B${currentRow}`).value = 'Product Name';
      mappingWorksheet.getRow(currentRow).font = { bold: true };
      currentRow++;
      
      products.forEach((product, index) => {
        mappingWorksheet.getCell(`A${currentRow + index}`).value = product.product_id;
        mappingWorksheet.getCell(`B${currentRow + index}`).value = product.model;
      });

      // 创建下拉选项参考表
      const optionsWorksheet = workbook.addWorksheet('下拉选项参考');
      
      optionsWorksheet.columns = [
        { header: '选项类型', key: 'type', width: 25 },
        { header: '选项值', key: 'value', width: 30 }
      ];

      currentRow = 1;
      
      // Position 选项
      optionsWorksheet.getCell(`A${currentRow}`).value = 'Position 选项';
      optionsWorksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      positionOptions.forEach((position, index) => {
        optionsWorksheet.getCell(`B${currentRow + index}`).value = position;
      });
      currentRow += positionOptions.length + 2;

      // Product Line 选项
      optionsWorksheet.getCell(`A${currentRow}`).value = 'Product Line 选项';
      optionsWorksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      productLines.forEach((line, index) => {
        optionsWorksheet.getCell(`B${currentRow + index}`).value = line;
      });
      currentRow += productLines.length + 2;

      // Status 选项
      optionsWorksheet.getCell(`A${currentRow}`).value = 'Status 选项';
      optionsWorksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      statusOptions.forEach((status, index) => {
        optionsWorksheet.getCell(`B${currentRow + index}`).value = status;
      });
      currentRow += statusOptions.length + 2;

      // Actions 选项
      optionsWorksheet.getCell(`A${currentRow}`).value = 'Actions 选项';
      optionsWorksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      actionsOptions.forEach((action, index) => {
        optionsWorksheet.getCell(`B${currentRow + index}`).value = action;
      });
      currentRow += actionsOptions.length + 2;

      // Actions-Status 映射关系
      optionsWorksheet.getCell(`A${currentRow}`).value = 'Actions-Status 映射关系';
      optionsWorksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
      
      optionsWorksheet.getCell(`A${currentRow}`).value = 'Action';
      optionsWorksheet.getCell(`B${currentRow}`).value = '对应的Status';
      optionsWorksheet.getRow(currentRow).font = { bold: true };
      currentRow++;
      
      Object.entries(this.getActionsStatusMapping()).forEach(([action, status]) => {
        optionsWorksheet.getCell(`A${currentRow}`).value = action;
        optionsWorksheet.getCell(`B${currentRow}`).value = status;
        currentRow++;
      });

      return workbook;
    } catch (error) {
      console.error('Error creating Excel template:', error);
      throw error;
    }
  }

  /**
   * 生成Excel模板文件并返回Buffer
   */
  async generateTemplateBuffer() {
    try {
      const workbook = await this.createBOMImportTemplate();
      
      // 简化Excel生成，避免复杂的格式设置
      const buffer = await workbook.xlsx.writeBuffer({
        useStyles: false,
        useSharedStrings: false
      });
      
      return buffer;
    } catch (error) {
      console.error('Error generating template buffer:', error);
      
      // 如果复杂模板失败，生成一个简单的模板
      return await this.generateSimpleTemplate();
    }
  }

  /**
   * 生成简单的Excel模板
   */
  async generateSimpleTemplate() {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('BOM导入模板');
      
      // 简单的表头
      worksheet.columns = [
        { header: 'BOM ID', key: 'bom_id', width: 15 },
        { header: 'BOM Name', key: 'bom_name', width: 25 },
        { header: 'Part ID', key: 'part_id', width: 15 },
        { header: 'Part Name', key: 'part_name', width: 25 },
        { header: 'Quantity', key: 'quantity', width: 12 },
        { header: 'Position', key: 'position', width: 20 },
        { header: 'Product ID', key: 'product_id', width: 15 },
        { header: 'Product Name', key: 'product_name', width: 25 },
        { header: 'Version', key: 'version', width: 12 },
        { header: 'Product Line', key: 'product_line', width: 18 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Actions', key: 'actions', width: 12 }
      ];
      
      // 添加标题
      worksheet.getCell('A1').value = 'BOM导入模板';
      worksheet.getCell('A1').font = { bold: true, size: 14 };
      
      // 添加表头
      const headerRow = worksheet.getRow(3);
      headerRow.values = ['BOM ID', 'BOM Name', 'Part ID', 'Part Name', 'Quantity', 'Position', 'Product ID', 'Product Name', 'Version', 'Product Line', 'Status', 'Actions'];
      headerRow.font = { bold: true };
      
      // 添加示例数据
      const dataRow = worksheet.getRow(4);
      dataRow.values = [
        'BOM0001', '主板BOM', 'PT0001', 'CPU处理器', '1', 'Power Supply', 
        'PROD001', '服务器A型', 'Gen 1', '服务器产品线', 'draft', 'EDIT'
      ];
      
      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('Error generating simple template:', error);
      
      // 如果连简单模板都失败，返回一个空的Excel文件
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('BOM导入模板');
      worksheet.getCell('A1').value = 'BOM导入模板';
      return await workbook.xlsx.writeBuffer();
    }
  }
}

module.exports = ExcelTemplateGenerator;