const Part = require('../models/Part');
const TargetPart = require('../models/TargetPart');
const PartMapping = require('../models/PartMapping');

class ValidationService {
  
  /**
   * 验证Part是否满足TargetPart的技术要求
   */
  async validateTechnicalRequirements(partId, targetPartId) {
    try {
      const part = await Part.findById(partId);
      const targetPart = await TargetPart.findById(targetPartId);
      
      if (!part || !targetPart) {
        throw new Error('Part或TargetPart不存在');
      }
      
      const validationResult = {
        part_id: partId,
        target_part_id: targetPartId,
        technical_validation: {
          passed: true,
          issues: []
        },
        interface_validation: {
          passed: true,
          issues: []
        },
        overall_passed: true
      };
      
      // 技术规格验证
      if (targetPart.technical_requirements) {
        // 这里可以添加具体的规格验证逻辑
        // 例如：电压范围、功率要求、尺寸规格等
        validationResult.technical_validation.issues.push('技术规格验证待实现');
      }
      
      // 接口规范验证
      if (targetPart.interface_spec) {
        // 验证硬件接口和协议的匹配度
        validationResult.interface_validation.issues.push('接口规范验证待实现');
      }
      
      // 如果有任何问题，标记为未通过
      if (validationResult.technical_validation.issues.length > 0 || 
          validationResult.interface_validation.issues.length > 0) {
        validationResult.overall_passed = false;
      }
      
      return validationResult;
    } catch (error) {
      throw new Error(`验证失败: ${error.message}`);
    }
  }
  
  /**
   * 验证BOM中的Part组合是否兼容
   */
  async validateBOMCompatibility(bomId) {
    try {
      const BOM = require('../models/BOM');
      const bom = await BOM.findById(bomId).populate('parts.part_id');
      
      if (!bom) {
        throw new Error('BOM不存在');
      }
      
      const compatibilityResult = {
        bom_id: bomId,
        parts_compatibility: [],
        overall_compatible: true,
        warnings: []
      };
      
      // 检查BOM中所有零件的兼容性
      for (const bomPart of bom.parts) {
        const part = bomPart.part_id;
        
        // 检查该零件与其他零件的兼容性
        const partCompatibility = {
          part_id: part._id,
          part_id: part.part_id,
          compatible_with: [],
          incompatible_with: []
        };
        
        // 这里可以添加具体的兼容性检查逻辑
        // 例如：检查电压匹配、接口兼容性等
        
        compatibilityResult.parts_compatibility.push(partCompatibility);
      }
      
      return compatibilityResult;
    } catch (error) {
      throw new Error(`BOM兼容性验证失败: ${error.message}`);
    }
  }
  
  /**
   * 生成适配验证报告
   */
  async generateValidationReport(productId, targetPartIds) {
    try {
      const Product = require('../models/Product');
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('产品不存在');
      }
      
      const report = {
        product_id: productId,
        product_model: product.model,
        validation_date: new Date(),
        target_parts: [],
        overall_status: 'pending'
      };
      
      // 验证每个Target Part
      for (const targetPartId of targetPartIds) {
        const targetPart = await TargetPart.findById(targetPartId);
        const partMappings = await PartMapping.find({ target_part_id: targetPartId })
          .populate('part_id');
        
        const targetPartValidation = {
          target_part_id: targetPartId,
          target_part_id: targetPart.target_part_id,
          available_parts: [],
          validation_status: 'pending'
        };
        
        // 验证每个可用的Part
        for (const mapping of partMappings) {
          const validation = await this.validateTechnicalRequirements(
            mapping.part_id._id, 
            targetPartId
          );
          
          targetPartValidation.available_parts.push({
            part_id: mapping.part_id._id,
            part_id: mapping.part_id.part_id,
            validation_result: validation,
            match_strength: mapping.match_strength
          });
        }
        
        // 检查是否有可用的验证通过的零件
        const validParts = targetPartValidation.available_parts.filter(
          p => p.validation_result.overall_passed
        );
        
        targetPartValidation.validation_status = validParts.length > 0 ? 'passed' : 'failed';
        report.target_parts.push(targetPartValidation);
      }
      
      // 计算整体状态
      const allPassed = report.target_parts.every(tp => tp.validation_status === 'passed');
      report.overall_status = allPassed ? 'passed' : 'failed';
      
      return report;
    } catch (error) {
      throw new Error(`生成验证报告失败: ${error.message}`);
    }
  }
  
  /**
   * 验证硬件配置方案
   */
  async validateHardwareConfiguration(configuration) {
    try {
      const { product_id, target_part_selections } = configuration;
      
      const validationResults = {
        product_id,
        selections: [],
        overall_valid: true,
        compatibility_issues: []
      };
      
      // 验证每个选择
      for (const selection of target_part_selections) {
        const { target_part_id, selected_part_id } = selection;
        
        // 验证技术规格
        const techValidation = await this.validateTechnicalRequirements(
          selected_part_id, 
          target_part_id
        );
        
        validationResults.selections.push({
          target_part_id,
          selected_part_id,
          technical_validation: techValidation
        });
        
        if (!techValidation.overall_passed) {
          validationResults.overall_valid = false;
          validationResults.compatibility_issues.push(
            `TargetPart ${target_part_id} 的技术验证失败`
          );
        }
      }
      
      // 验证零件间的兼容性
      if (validationResults.overall_valid) {
        // 这里可以添加零件间兼容性检查
        // 例如：检查电源匹配、接口兼容性等
      }
      
      return validationResults;
    } catch (error) {
      throw new Error(`硬件配置验证失败: ${error.message}`);
    }
  }
}

module.exports = new ValidationService();